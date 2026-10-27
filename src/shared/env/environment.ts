import * as THREE from 'three';
import { Clouds } from '../../foundation/components/environment';
import { Weather } from '../../foundation/components/physics';
import { Thermal } from '../../foundation/components/physics';
import Tree from '../../foundation/components/scenery/trees/Tree';
import { logger } from '../../foundation/utils/logger';
import { Gulls, GullFlock } from '../../foundation/components/wildlife/Gulls';
import { addMeshAroundArea } from './mesh-utils';
import { generateThermalPair, ThermalGenerationOptions } from './thermal-utils';
import { setCloudColors } from '../../foundation/rendering/cloudMaterial';
import { Theme } from '../../foundation/types/Theme';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { IThreeComponent } from '../../foundation/components/base/IThreeComponent';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { LevelOfDetail } from '../../foundation/types/lod';

interface MovableComponent extends IThreeComponent {
  updateMovementOrigin?(): void;
}
import { BoatGroupCreator } from './boat-group-creator';
import { HouseGroupCreator } from './house-group-creator';
import { mergeStaticMeshes } from '../../foundation/utils/mergeStatic';
import { removeHousesAtSea } from './house-group-utils';
import { HouseStyle } from './house-group-types';
import { Berth, BoatConfig } from './boat-group-types';

/** Houses whose ground is lower than this are in the sea and are left out */
const MIN_LAND_HEIGHT = 2;

/**
 * Town configuration for placing settlements
 */
export interface TownConfig {
  position: THREE.Vector3;
  houseCount: number;
  formation: 'street' | 'grid' | 'suburban' | 'rural' | 'random';
  spacing?: number; // Optional spacing multiplier (default: 1.0, higher = more spread out)
  style?: HouseStyle; // The town's own house mix and colours, instead of the default mix
}

/**
 * Lanzarote island landmark positions
 * Named locations for major settlements on the island
 */
export const TOWN_TEGUISE_TOP = new THREE.Vector3(6879, 0, 545);
export const TOWN_FAMARA = new THREE.Vector3(6279, 0, -3155);
export const TOWN_NORUEGOS = new THREE.Vector3(7827, 0, -3460);
export const TOWN_TEGUISE = new THREE.Vector3(5600, 0, 1205);
export const TOWN_LA_CALETA = new THREE.Vector3(2866.8, 270.8, -2598.7);

/**
 * Lanzarote island town configuration
 * Real locations of major settlements on the island
 */
export const LANZAROTE_TOWNS: TownConfig[] = [
  { position: TOWN_TEGUISE_TOP, houseCount: 50, formation: 'rural', spacing: 2.0 },
  { position: TOWN_FAMARA, houseCount: 120, formation: 'rural', spacing: 2.0 },
  { position: TOWN_NORUEGOS, houseCount: 50, formation: 'grid' },
  { position: TOWN_TEGUISE, houseCount: 51, formation: 'suburban' },
  { position: TOWN_LA_CALETA, houseCount: 40, formation: 'rural' },
];

/** Gulls circling in the thermals off Famara, at about the pilots' height. */
export const FAMARA_GULL_FLOCKS: GullFlock[] = [
  { center: new THREE.Vector3(7127, 980, -1405), count: 14 },
  { center: new THREE.Vector3(6650, 860, -380), count: 8 },
  { center: new THREE.Vector3(5600, 1050, -650), count: 10 },
];

class Environment {
  gulls?: Gulls;
  cloudInstances: Clouds[] = [];
  private componentRegistry: ComponentRegistry = new ComponentRegistry();
  private boatGroupCreator: BoatGroupCreator;
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boatGroupCreator = new BoatGroupCreator(scene, this.componentRegistry);
  }

  /**
   * Flocks of gulls circling in thermals: one instanced draw call for all of them.
   */
  addGulls(flocks: GullFlock[]): Gulls {
    this.gulls = new Gulls(flocks);
    this.scene.add(this.gulls.mesh);
    return this.gulls;
  }

  async addBoats(water: THREE.Mesh) {
    // Each call adds its boats to the scene; the returned meshes aren't needed here.
    // First area (marina/harbor - more variety)
    await this.boatGroupCreator.createRecreationalBoats(
      water,
      new THREE.Vector3(7879, 0, -5445),
      4,
      'random'
    );

    // Second area (open water - different distribution)
    await this.boatGroupCreator.createRecreationalBoats(
      water,
      new THREE.Vector3(8279, 0, -6455),
      3,
      'random'
    );

    // Fix movement origins for all boats after positioning
    this.updateAllBoatMovementOrigins();
  }

  /** Boats moored at berths along pontoons and quays, still but for bobbing */
  async addMooredBoats(boats: BoatConfig[], berths: Berth[]): Promise<THREE.Object3D[]> {
    return this.boatGroupCreator.createMooredBoats(boats, berths);
  }

  /** A few boats out on the water around `center`, some moving, `scale` times their usual size */
  async addBoatsAround(water: THREE.Mesh, center: THREE.Vector3, count: number, scale = 1) {
    await this.boatGroupCreator.createRecreationalBoats(water, center, count, 'random', scale);
    this.updateAllBoatMovementOrigins();
  }

  // Convenience aliases used by the scenes
  async addMixedBoats(water: THREE.Mesh) {
    await this.addBoats(water);
  }

  async addRandomBoats(water: THREE.Mesh) {
    await this.addBoats(water);
  }

  /**
   * Create a neighborhood of houses with terrain adaptation
   */
  async createHouseNeighborhood(
    center: THREE.Vector3,
    houseCount: number,
    formation: 'street' | 'grid' | 'suburban' | 'rural' | 'random',
    terrain: THREE.Mesh,
    lowPoly: boolean = false,
    spacingMultiplier: number = 1.0,
    levelOfDetail?: LevelOfDetail,
    style?: HouseStyle
  ): Promise<THREE.Object3D[]> {
    // Get terrain height for the center position
    const terrainHeight = this.getTerrainHeight(center.x, center.z, terrain);
    if (isNaN(terrainHeight)) {
      logger.warn(`Could not determine terrain height at center ${center.x}, ${center.z}`);
      return [];
    }

    // Update center position with correct terrain height
    const terrainAdaptedCenter = new THREE.Vector3(center.x, terrainHeight, center.z);

    // Create house group creator
    const houseGroupCreator = new HouseGroupCreator(this.scene, this.componentRegistry);

    // Use levelOfDetail if provided, otherwise fall back to lowPoly for backward compatibility
    if (levelOfDetail !== undefined) {
      houseGroupCreator.setLOD(levelOfDetail);
    } else {
      houseGroupCreator.setLowPolyMode(lowPoly);
    }

    try {
      // Use createMixedNeighborhood for all formations with the specified house count
      const created = await houseGroupCreator.createMixedNeighborhood(
        terrainAdaptedCenter,
        houseCount,
        formation,
        spacingMultiplier,
        style
      );
      const meshes = removeHousesAtSea(
        this.scene,
        created,
        (x, z) => this.getTerrainHeight(x, z, terrain),
        MIN_LAND_HEIGHT
      );

      // Adapt all created houses to terrain height
      // AND update associated land plots, cacti, and stones at the same location
      meshes.forEach((mesh: THREE.Object3D) => {
        const meshTerrainHeight = this.getTerrainHeight(mesh.position.x, mesh.position.z, terrain);
        if (!isNaN(meshTerrainHeight)) {
          mesh.position.y = meshTerrainHeight;

          // Update all scene objects associated with this house
          // Using userData tags instead of fragile Y-position checks
          this.scene.traverse((obj: THREE.Object3D) => {
            if (obj === mesh) return; // Skip the house itself

            // Check userData tags to identify land plots and landscape elements
            const isLandPlot = obj.userData?.isLandPlot === true;
            const isLandscapeElement = obj.userData?.isLandscapeElement === true;

            if (isLandPlot || isLandscapeElement) {
              // Verify this object belongs to the current house by checking proximity
              const dx = obj.position.x - mesh.position.x;
              const dz = obj.position.z - mesh.position.z;
              const distance = Math.sqrt(dx * dx + dz * dz);

              if (distance < 200) {
                const oldObjY = obj.position.y;

                // Get terrain height at THIS object's actual position
                const objTerrainHeight = this.getTerrainHeight(
                  obj.position.x,
                  obj.position.z,
                  terrain
                );

                if (!isNaN(objTerrainHeight)) {
                  // Position at terrain height with small offset for land plots
                  obj.position.y = objTerrainHeight + (isLandPlot ? 0.1 : 0);

                  if (isLandPlot) {
                    logger.debug(
                      `Land plot adapted: ${oldObjY.toFixed(1)} → ${obj.position.y.toFixed(1)} (terrain: ${objTerrainHeight.toFixed(1)})`
                    );
                  }
                }
              }
            }
          });
        }
      });

      return meshes;
    } catch (error) {
      logger.error(`Error creating ${formation} neighborhood:`, error);
      return [];
    }
  }

  /**
   * Add a town with houses at a specific position
   * @param center - Center position of the town
   * @param terrain - Terrain mesh for height adaptation
   * @param options - Configuration options for the town
   */
  async addTown(
    center: THREE.Vector3,
    terrain: THREE.Mesh,
    options?: {
      houseCount?: number;
      formation?: 'street' | 'grid' | 'suburban' | 'rural' | 'random';
      spacing?: number;
      lowPoly?: boolean;
      levelOfDetail?: LevelOfDetail;
      style?: HouseStyle;
    }
  ): Promise<THREE.Object3D[]> {
    const {
      houseCount = 20,
      formation = 'random',
      spacing = 1.0,
      lowPoly = true,
      levelOfDetail,
      style,
    } = options || {};

    logger.info(
      `🏘️ Creating ${formation} neighborhood with ${houseCount} houses, LOD: ${levelOfDetail ?? 'legacy'}`
    );

    return this.createHouseNeighborhood(
      center,
      houseCount,
      formation,
      terrain,
      lowPoly,
      spacing,
      levelOfDetail,
      style
    );
  }

  /**
   * Add multiple towns from a configuration array
   * @param towns - Array of town configurations
   * @param terrain - Terrain mesh for height adaptation
   * @param lowPoly - Whether to use low-poly models (default: true)
   * @param levelOfDetail - LOD level for houses (optional, overrides lowPoly if provided)
   * @returns The created house objects. Their meshes are merged into shared scene meshes, so they are no longer in the scene
   */
  async addTownsFromConfig(
    towns: TownConfig[],
    terrain: THREE.Mesh,
    lowPoly: boolean = true,
    levelOfDetail?: LevelOfDetail
  ): Promise<THREE.Object3D[]> {
    const allHouses: THREE.Object3D[] = [];
    const existing = new Set(this.scene.children);

    for (const town of towns) {
      const houses = await this.addTown(town.position, terrain, {
        houseCount: town.houseCount,
        formation: town.formation,
        spacing: town.spacing,
        lowPoly,
        levelOfDetail,
        style: town.style,
      });
      allHouses.push(...houses);
    }

    // Towns are thousands of small static meshes (houses, plots, pools, cacti);
    // baking them into one mesh per material keeps them to a few dozen draw calls.
    const added = this.scene.children.filter(child => !existing.has(child));
    const merged = mergeStaticMeshes(added, this.scene);
    logger.info(`🏘️ Merged ${added.length} town objects into ${merged.length} meshes`);

    return allHouses;
  }

  async addTrees(terrain: THREE.Mesh, scale: number = 2) {
    const tree = await this.componentRegistry.register(new Tree({}), 'tree');
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea([tree], new THREE.Vector3(6879, 0, -545), 100, terrain, this.scene, 100, 5);
    addMeshAroundArea([tree], new THREE.Vector3(8879, 0, -2245), 100, terrain, this.scene, 100, 5);
    addMeshAroundArea([tree], new THREE.Vector3(5600, 0, 705), 100, terrain, this.scene, 40, 5);
  }

  generateThermals(weather: Weather, opacity: number = 0.05): Thermal[] {
    // famara
    const baseOptions: ThermalGenerationOptions = {
      position: new THREE.Vector3(0, 0, 0),
      weather,
      superThermal: false,
      opacity,
    };

    const allThermals = generateThermalPair(baseOptions)
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(7127, 0, -1405) }))
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(3027, 0, 1005) }))
      // tenesar
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(-4827, 0, -855) }))
      // mirador
      .concat(
        generateThermalPair({ ...baseOptions, position: new THREE.Vector3(15027, 0, -12555) })
      )
      //pq
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(-6227, 0, 14055) }))
      //mala
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(14227, 0, -3755) }))
      // pq
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(-3927, 0, 9830) }))
      .concat(generateThermalPair({ ...baseOptions, position: new THREE.Vector3(592, 0, 5530) }))
      .concat(
        generateThermalPair({
          ...baseOptions,
          position: new THREE.Vector3(15027, 0, -12555),
          superThermal: true,
        })
      );

    return allThermals;
  }

  /**
   * A cluster of cumulus over each main thermal, their bases level just above the thermal's
   * top, a towering one over the super thermal, and a few clusters in between.
   */
  async addClouds(thermals: Thermal[]): Promise<THREE.Object3D[]> {
    this.cloudInstances.forEach(c => c.dispose());
    this.cloudInstances = [];
    const mainThermals = thermals.filter(t => t.isMainThermal());
    const cloudBase = (mainThermals[0]?.getDimensions().height ?? 1800) * 1.08;

    const sites = mainThermals.map(t => ({
      position: new THREE.Vector3(t.getPosition().x, cloudBase, t.getPosition().z),
      kind: t.isSuperThermal() ? ('tower' as const) : ('puff' as const),
      scale: t.isSuperThermal() ? 1.6 : 1,
    }));
    [
      { x: 5120, z: -10100 },
      { x: 2600, z: 842 },
      { x: -3600, z: 8042 },
    ].forEach(({ x, z }) =>
      sites.push({ position: new THREE.Vector3(x, cloudBase, z), kind: 'puff', scale: 1 })
    );

    const clouds = await Promise.all(
      sites.map(async site => {
        const cloudInstance = new Clouds(site.kind);
        this.cloudInstances.push(cloudInstance);
        const cloud = await cloudInstance.load(site.position, site.scale);
        this.scene.add(cloud);
        return cloud;
      })
    );
    return clouds;
  }

  // Theme-aware methods

  /**
   * Add clouds coloured from the theme
   */
  async addCloudsFromTheme(thermals: Thermal[], theme: Theme): Promise<THREE.Object3D[]> {
    setCloudColors(theme.clouds);
    return this.addClouds(thermals);
  }

  /**
   * Create weather from theme
   */
  createWeatherFromTheme(theme: Theme): Weather {
    return ThemeEngine.createWeatherFromTheme(theme);
  }

  /**
   * Update all managed components
   */
  update(deltaTime: number): void {
    this.componentRegistry.update(deltaTime);
  }

  /**
   * Update movement origins for all boats after they've been positioned
   */
  private updateAllBoatMovementOrigins(): void {
    this.componentRegistry.getAllComponents().forEach((component, id) => {
      // Check if component has movement behavior (PatrolBoat, etc.)
      if (component && typeof (component as MovableComponent).updateMovementOrigin === 'function') {
        (component as MovableComponent).updateMovementOrigin();
        logger.debug(`Updated movement origin for component: ${id}`);
      }
    });
  }

  /**
   * Get terrain height at specific coordinates using raycasting
   */
  private getTerrainHeight(x: number, z: number, terrain: THREE.Mesh): number {
    const rayVertical = new THREE.Raycaster(
      new THREE.Vector3(x, 10000, z), // Start from high above
      new THREE.Vector3(0, -1, 0) // Cast downward
    );
    const intersects = rayVertical.intersectObject(terrain);
    if (intersects.length > 0 && intersects[0]) {
      return intersects[0].point.y;
    } else {
      return NaN;
    }
  }

  /**
   * Get statistics about managed components
   */
  getComponentStats(): { totalComponents: number; byType: Record<string, number> } {
    return this.componentRegistry.getStats();
  }
}

export default Environment;
