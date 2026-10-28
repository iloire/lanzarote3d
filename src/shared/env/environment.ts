import * as THREE from 'three';
import { Clouds } from '../../foundation/components/environment';
import Tree from '../../foundation/components/scenery/trees/Tree';
import { logger } from '../../foundation/utils/logger';
import { Gulls, GullFlock, GUIRRE, RAVEN } from '../../foundation/components/wildlife/Gulls';
import { addMeshAroundArea } from './mesh-utils';
import { setCloudColors } from '../../foundation/rendering/cloudMaterial';
import { Theme } from '../../foundation/types/Theme';
import { IThreeComponent } from '../../foundation/components/base/IThreeComponent';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { LevelOfDetail } from '../../foundation/types/lod';
import { rndIntBetween } from '../../foundation/utils/math';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';

interface MovableComponent extends IThreeComponent {
  updateMovementOrigin?(): void;
}
import { BoatGroupCreator } from './boat-group-creator';
import { HouseGroupCreator } from './house-group-creator';
import { mergeStaticMeshes } from '../../foundation/utils/mergeStatic';
import { removeHousesAtSea } from './house-group-utils';
import { HouseStyle } from './house-group-types';
import { Berth, BoatConfig } from './boat-group-types';

/**
 * Where thermals go up: Famara, Tenesar, the Mirador del Río, Playa Quemada (pq) and Mala.
 * Each gets a cluster of cumulus; the Mirador's super thermal adds a tower to it.
 */
const THERMAL_SITES = [
  { x: 0, z: 0 },
  { x: 7127, z: -1405 },
  { x: 3027, z: 1005 },
  { x: -4827, z: -855 },
  { x: 15027, z: -12555 },
  { x: -6227, z: 14055 },
  { x: 14227, z: -3755 },
  { x: -3927, z: 9830 },
  { x: 592, z: 5530 },
];
const SUPER_THERMAL_SITE = { x: 15027, z: -12555 };

/** Where a cluster of cumulus stands: its kind and how big */
export interface CloudSite {
  x: number;
  z: number;
  kind: 'puff' | 'tower';
  scale: number;
}

/**
 * A cluster over each thermal site, a towering one over the super thermal, a few clusters in
 * between, and the trade wind piling cloud up on the Risco de Famara, so its crest from the
 * takeoff to the Mirador del Río is rarely clear.
 */
const LANZAROTE_CLOUD_SITES: CloudSite[] = [
  ...THERMAL_SITES.map(({ x, z }) => ({ x, z, kind: 'puff' as const, scale: 1 })),
  { ...SUPER_THERMAL_SITE, kind: 'tower', scale: 1.6 },
  ...[
    { x: 5120, z: -10100 },
    { x: 2600, z: 842 },
    { x: -3600, z: 8042 },
  ].map(({ x, z }) => ({ x, z, kind: 'puff' as const, scale: 1 })),
  ...[
    { x: 7800, z: -1300 },
    { x: 9300, z: -2700 },
    { x: 10200, z: -4300 },
    { x: 11200, z: -6200 },
    { x: 12000, z: -8200 },
    { x: 12700, z: -10200 },
  ].map(({ x, z }) => ({ x, z, kind: 'puff' as const, scale: 1.2 })),
];

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

/** A town's centre from its OpenStreetMap place node; houses settle onto the terrain */
const town = (lat: number, lon: number): THREE.Vector3 => {
  const { x, z } = geoToWorld(lat, lon, ISLAND_ANCHOR);
  return new THREE.Vector3(x, 0, z);
};

/**
 * Lanzarote island landmark positions
 * Named locations for major settlements on the island
 */
export const TOWN_LAS_LADERAS = town(29.08746, -13.56208);
export const TOWN_FAMARA = town(29.11885, -13.56599); // Caleta de Famara
export const TOWN_NORUEGOS = town(29.11441, -13.54721); // Urbanización Famara
export const TOWN_TEGUISE = town(29.05925, -13.56022);
export const TOWN_SOO = town(29.09932, -13.62235);
export const TOWN_CALETA_DE_SEBO = town(29.2311, -13.5035); // La Graciosa, where the ferry docks
export const TOWN_PEDRO_BARBA = town(29.2437, -13.4747); // La Graciosa's east-end hamlet
export const TOWN_ORZOLA = town(29.2223, -13.4497); // The fishing village the ferry sails from

/**
 * Boat clusters in El Río as [x, z, count], in world units read off the model's coast: each
 * centre is 550+ units from land, so boats placed and circling within ~400 of it stay afloat.
 */
const EL_RIO_BOATS: [number, number, number][] = [
  [12000, -12950, 2],
  [12800, -13300, 2],
  [13200, -13650, 2],
];

/** Urbanización Famara: whitewashed round bungalows, woodwork in blue or Canarian green */
const FAMARA_BUNGALOWS: HouseStyle = {
  types: { RoundBungalow: 1 },
  palette: {
    wallColor: ['#F7F5EF', '#F2EFE6', '#EFEBE1'],
    roofColor: ['#DCD6C8', '#CFC8B8'],
    accentColor: ['#2F6DB5', '#3C7A4A', '#2E5E8C'],
  },
  // Small sandy plots, packed close the way the village is
  plot: { scale: 0.7, colors: ['#CFC3A8', '#D8CCB0', '#C4B89C'] },
};

/**
 * La Graciosa and Órzola: flat-roofed white cubes on sand streets, with blue or green woodwork. Only the
 * Famara bungalows' colours, so the merge folds them into the same meshes: no new draw calls.
 */
const GRACIOSA_HOUSES: HouseStyle = {
  types: { DesertHouse: 1 },
  palette: FAMARA_BUNGALOWS.palette,
  plot: FAMARA_BUNGALOWS.plot,
};

/**
 * Lanzarote island town configuration
 * Real locations of major settlements on the island
 */
export const LANZAROTE_TOWNS: TownConfig[] = [
  { position: TOWN_LAS_LADERAS, houseCount: 12, formation: 'rural', spacing: 4.0 }, // scattered farmsteads, not a village
  { position: TOWN_FAMARA, houseCount: 120, formation: 'rural', spacing: 2.0 },
  {
    position: TOWN_NORUEGOS,
    houseCount: 80,
    formation: 'grid',
    spacing: 0.5,
    style: FAMARA_BUNGALOWS,
  },
  { position: TOWN_TEGUISE, houseCount: 51, formation: 'suburban' },
  { position: TOWN_SOO, houseCount: 40, formation: 'rural' },
  {
    position: TOWN_CALETA_DE_SEBO,
    houseCount: 45,
    formation: 'grid',
    spacing: 0.6,
    style: GRACIOSA_HOUSES,
  },
  {
    position: TOWN_ORZOLA,
    houseCount: 40,
    formation: 'grid',
    spacing: 0.6,
    style: GRACIOSA_HOUSES,
  },
  {
    position: TOWN_PEDRO_BARBA,
    houseCount: 10,
    formation: 'rural',
    spacing: 0.8,
    style: GRACIOSA_HOUSES,
  },
];

/** Gulls circling in the thermals off Famara, at about the pilots' height. */
export const FAMARA_GULL_FLOCKS: GullFlock[] = [
  { center: new THREE.Vector3(7127, 980, -1405), count: 14 },
  { center: new THREE.Vector3(6650, 860, -380), count: 8 },
  { center: new THREE.Vector3(5600, 1050, -650), count: 10 },
];

/**
 * Ravens riding the updraft along the edge of the Risco, in pairs and threes just over the
 * cliff top, from above Famara to the Mirador.
 */
export const RISCO_RAVEN_FLOCKS: GullFlock[] = [
  { center: new THREE.Vector3(8516, 1080, -2248), count: 3 },
  { center: new THREE.Vector3(9587, 1420, -4507), count: 4 },
  { center: new THREE.Vector3(10259, 1150, -6766), count: 2 },
  { center: new THREE.Vector3(11748, 1110, -9591), count: 3 },
  { center: new THREE.Vector3(12702, 1080, -11285), count: 3 },
];

/**
 * A single pair of guirres, the Canary Egyptian vulture: rare on Lanzarote, so just the two,
 * circling off the Mirador del Río a little above Magne, over the middle of his loop (home
 * config: 1659-1753 m, centred near x 12953, z -12028).
 */
export const RISCO_GUIRRE_FLOCKS: GullFlock[] = [
  { center: new THREE.Vector3(12953, 1770, -12028), count: 2 },
];

class Environment {
  gulls?: Gulls;
  ravens?: Gulls;
  guirres?: Gulls;
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

  /**
   * Ravens along the cliff: the gulls' flight in black, smaller and in tighter circles, kept
   * close to the edge. One more instanced draw call.
   */
  addRavens(flocks: GullFlock[]): Gulls {
    this.ravens = new Gulls(flocks, {
      wingspan: 4,
      minRadius: 25,
      maxRadius: 80,
      spread: 0.4,
      plumage: RAVEN,
    });
    this.ravens.mesh.name = 'ravens';
    this.scene.add(this.ravens.mesh);
    return this.ravens;
  }

  /**
   * Guirres soaring on the ridge lift: barely a wingbeat, wide slow circles, the pair kept
   * close together. Real ones span ~1.7 m; drawn at 5, like the ravens about 3x life size.
   */
  addGuirres(flocks: GullFlock[]): Gulls {
    this.guirres = new Gulls(flocks, {
      wingspan: 5,
      minRadius: 80,
      maxRadius: 150,
      spread: 0.3,
      plumage: GUIRRE,
      flapping: 0.1,
    });
    this.guirres.mesh.name = 'guirres';
    this.scene.add(this.guirres.mesh);
    return this.guirres;
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

    // El Río, the strait between Lanzarote and La Graciosa, busier than the open coast: off
    // Caleta de Sebo, mid-channel, and towards Punta Fariones, each clear of both shores
    for (const [x, z, count] of EL_RIO_BOATS) {
      await this.boatGroupCreator.createRecreationalBoats(
        water,
        new THREE.Vector3(x, 0, z),
        count,
        'random'
      );
    }

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
    const houseGroupCreator = new HouseGroupCreator(this.scene);

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

  /**
   * A cluster of cumulus over each site, their bases level just above the condensation level
   * (the LCL, give or take 200). Lanzarote's sites unless a location brings its own.
   */
  async addClouds(
    lclLevel: number,
    cloudSites: CloudSite[] = LANZAROTE_CLOUD_SITES
  ): Promise<THREE.Object3D[]> {
    this.cloudInstances.forEach(c => c.dispose());
    this.cloudInstances = [];
    const cloudBase = (lclLevel + rndIntBetween(-200, 200)) * 1.08;
    // Each cluster's base sits a little above or below the day's cloud base
    const CLUSTER_BASE_JITTER = 100;

    const sites = cloudSites.map(({ x, z, kind, scale }) => ({
      position: new THREE.Vector3(x, cloudBase, z),
      kind,
      scale,
    }));

    const clouds = await Promise.all(
      sites.map(async site => {
        const cloudInstance = new Clouds(site.kind);
        this.cloudInstances.push(cloudInstance);
        site.position.y += rndIntBetween(-CLUSTER_BASE_JITTER, CLUSTER_BASE_JITTER);
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
  async addCloudsFromTheme(theme: Theme, cloudSites?: CloudSite[]): Promise<THREE.Object3D[]> {
    setCloudColors(theme.clouds);
    return this.addClouds(theme.weather.lclLevel, cloudSites);
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
