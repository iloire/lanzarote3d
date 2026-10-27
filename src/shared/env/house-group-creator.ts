import * as THREE from 'three';
import {
  House,
  HouseType,
  Pool,
  Stone,
  BarrelCactus,
  PricklyPearCactus,
  CanaryPalm,
} from '../../foundation/components/scenery';
import {
  Villa,
  Townhouse,
  Barn,
  DesertHouse,
  DesertHouseWithPool,
  RoundBungalow,
} from '../../foundation/components/scenery/buildings';
import { LevelOfDetail, getLODFromLegacy } from '../../foundation/types/lod';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { HouseConfig, HouseGroupConfig, HouseStyle } from './house-group-types';
import { logger } from '../../foundation/utils/logger';
import { calculateHousePositions, generateMixedNeighborhood } from './house-group-utils';

/**
 * House Group Creator - handles the creation and management of neighborhoods
 */
export class HouseGroupCreator {
  private scene: THREE.Scene;
  private componentRegistry: ComponentRegistry;
  private lowPoly: boolean = false; // Deprecated - kept for backward compatibility
  private levelOfDetail: LevelOfDetail = LevelOfDetail.HIGH;
  private createdObjects: THREE.Object3D[] = []; // Track all created objects

  constructor(scene: THREE.Scene, componentRegistry: ComponentRegistry) {
    this.scene = scene;
    this.componentRegistry = componentRegistry;
  }

  /**
   * Set low-poly mode for all future house creation
   * @deprecated Use setLOD() instead for finer control
   */
  setLowPolyMode(lowPoly: boolean): void {
    this.lowPoly = lowPoly;
    this.levelOfDetail = getLODFromLegacy(lowPoly);
  }

  /**
   * Set LOD level for all future house creation
   */
  setLOD(lod: LevelOfDetail): void {
    this.levelOfDetail = lod;
    this.lowPoly = lod === LevelOfDetail.LOW || lod === LevelOfDetail.ULTRA_LOW;
    logger.info(`🏠 HouseGroupCreator LOD set to: ${lod} (lowPoly: ${this.lowPoly})`);
  }

  /**
   * Clear all created objects from the scene and dispose them properly
   */
  clearAll(): void {
    logger.debug(`🧹 HouseGroupCreator clearing ${this.createdObjects.length} objects`);

    this.createdObjects.forEach(obj => {
      // Remove from scene
      if (obj.parent) {
        obj.parent.remove(obj);
      }

      // Dispose object recursively
      this.disposeObject3D(obj);
    });

    // Clear tracking array
    this.createdObjects.length = 0;
    logger.debug('✅ HouseGroupCreator cleanup completed');
  }

  /**
   * Recursively dispose of Three.js objects
   */
  private disposeObject3D(obj: THREE.Object3D): void {
    obj.children.forEach(child => {
      this.disposeObject3D(child);
    });

    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    obj.userData = {};
  }

  /**
   * Create a single house with the given configuration
   */
  private async createSingleHouse(
    houseConfig: HouseConfig,
    position: THREE.Vector3
  ): Promise<THREE.Object3D | null> {
    let house: any; // Type as any to allow legacy synchronous load()
    let houseMesh: THREE.Object3D;
    const scale = houseConfig.scale || 1;

    // Create house based on type
    try {
      switch (houseConfig.type) {
        case 'House':
          logger.debug(`✅ Creating House with levelOfDetail: ${this.levelOfDetail}`);
          house = new House({
            type: HouseType.Medium,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'Villa':
          logger.debug(`✅ Creating Villa with levelOfDetail: ${this.levelOfDetail}`);
          house = new Villa({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'Townhouse':
          logger.debug(`✅ Creating Townhouse with levelOfDetail: ${this.levelOfDetail}`);
          house = new Townhouse({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'Barn':
          logger.debug(`✅ Creating Barn with levelOfDetail: ${this.levelOfDetail}`);
          house = new Barn({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'DesertHouse':
          logger.debug(`✅ Creating DesertHouse with levelOfDetail: ${this.levelOfDetail}`);
          house = new DesertHouse({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'DesertHouseWithPool':
          logger.debug(`✅ Creating DesertHouseWithPool with levelOfDetail: ${this.levelOfDetail}`);
          house = new DesertHouseWithPool({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        case 'RoundBungalow':
          house = new RoundBungalow({
            scale: scale,
            levelOfDetail: this.levelOfDetail,
            ...(houseConfig.colors || {}),
          });
          houseMesh = await house.load();
          break;

        default:
          logger.warn(`Unknown house type: ${houseConfig.type}`);
          return null;
      }

      // Apply scaling for House type (others handle scale internally)
      if (houseConfig.type === 'House' && scale !== 1) {
        houseMesh.scale.setScalar(scale);
      }

      // Position the house (check if position is valid)
      if (position && position.copy) {
        houseMesh.position.copy(position);
      } else {
        logger.error('Invalid position provided to createSingleHouse:', position);
        houseMesh.position.set(0, 0, 0);
      }

      // Apply rotation in 90-degree increments (random or specified)
      if (houseConfig.rotation !== undefined) {
        houseMesh.rotation.y = houseConfig.rotation;
      } else {
        // Random rotation in 90-degree increments (0°, 90°, 180°, 270°)
        const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        houseMesh.rotation.y = rotations[Math.floor(Math.random() * rotations.length)];
      }

      // Add land plot if specified (use houseMesh.position to handle invalid positions)
      if (houseConfig.landPlot) {
        await this.addLandPlot(houseMesh.position, houseConfig.landPlot, houseMesh.rotation.y);
      }

      // Add to scene and track
      this.scene.add(houseMesh);
      this.createdObjects.push(houseMesh);

      // Add pool if specified and house doesn't already include one (use houseMesh.position)
      if (houseConfig.includePool && houseConfig.type !== 'DesertHouseWithPool') {
        await this.addPoolToHouse(houseMesh.position, scale);
      }

      return houseMesh;
    } catch (error) {
      logger.error(`Error creating house of type ${houseConfig.type}:`, error);
      return null;
    }
  }

  /**
   * Add a land plot under a house
   */
  private async addLandPlot(
    housePosition: THREE.Vector3,
    landPlot: { width: number; depth: number; color?: string },
    houseRotation: number = 0
  ): Promise<void> {
    try {
      const landGeometry = new THREE.PlaneGeometry(landPlot.width, landPlot.depth);
      const landMaterial = new THREE.MeshBasicMaterial({
        color: landPlot.color || '#7CFC00',
        transparent: true,
        opacity: 0.8,
      });

      const landMesh = new THREE.Mesh(landGeometry, landMaterial);

      // Tag object for terrain adaptation - proper way to identify objects
      landMesh.userData.isLandPlot = true;
      landMesh.userData.parentHousePosition = housePosition.clone();

      // Position the land plot at the exact same Y as the house INITIALLY
      // Both house and land plot will be terrain-adapted together in environment.ts
      // The land plot will get the same deltaY adjustment as the house
      landMesh.position.copy(housePosition);

      logger.debug(
        `🟩 Land plot created at Y=${landMesh.position.y.toFixed(1)} (house Y=${housePosition.y.toFixed(1)})`
      );

      // Rotate to lie flat and match house rotation if needed
      landMesh.rotation.x = -Math.PI / 2; // Lie flat
      landMesh.rotation.z = houseRotation; // Match house rotation

      // Set rendering order to render behind other objects but in front of terrain
      landMesh.renderOrder = 1;

      // Disable depth write to prevent z-fighting with terrain
      landMaterial.depthWrite = false;

      this.scene.add(landMesh);
      this.createdObjects.push(landMesh);

      // Add random cacti and stones to the land plot
      await this.addLandscapeElements(housePosition, landPlot, houseRotation);
    } catch (error) {
      logger.error('Error adding land plot:', error);
    }
  }

  /**
   * Add random cacti and stones to a land plot
   */
  private async addLandscapeElements(
    centerPosition: THREE.Vector3,
    landPlot: { width: number; depth: number },
    rotation: number = 0
  ): Promise<void> {
    const maxElements = Math.floor((landPlot.width * landPlot.depth) / 1000); // Density based on area
    const elementCount = Math.floor(Math.random() * maxElements) + 1;

    // Collect all element creation promises
    const elementPromises: Promise<void>[] = [];
    const firstElement = this.createdObjects.length;

    for (let i = 0; i < elementCount; i++) {
      // Random position within the land plot
      const localX = (Math.random() - 0.5) * landPlot.width * 0.8; // Keep away from edges
      const localZ = (Math.random() - 0.5) * landPlot.depth * 0.8;

      // Rotate position based on house rotation
      const rotatedX = localX * Math.cos(rotation) - localZ * Math.sin(rotation);
      const rotatedZ = localX * Math.sin(rotation) + localZ * Math.cos(rotation);

      const elementPosition = new THREE.Vector3(
        centerPosition.x + rotatedX,
        centerPosition.y,
        centerPosition.z + rotatedZ
      );

      // Randomly choose element type
      const elementType = Math.random();

      try {
        if (elementType < 0.3) {
          // 30% chance for stones
          elementPromises.push(this.addStone(elementPosition));
        } else if (elementType < 0.5) {
          // 20% chance for barrel cactus
          elementPromises.push(this.addBarrelCactus(elementPosition));
        } else if (elementType < 0.7) {
          // 20% chance for prickly pear cactus
          elementPromises.push(this.addPricklyPearCactus(elementPosition));
        } else {
          // 30% chance for a Canary palm, the island's garden palm
          elementPromises.push(this.addCanaryPalm(elementPosition));
        }
      } catch (error) {
        logger.error('Error adding landscape element:', error);
      }
    }

    // Load all elements in parallel
    await Promise.all(elementPromises);

    // Tag them with their house's position, so they go with it (removeHousesAtSea)
    this.createdObjects.slice(firstElement).forEach(obj => {
      obj.userData.parentHousePosition = centerPosition.clone();
    });
  }

  private async addStone(position: THREE.Vector3): Promise<void> {
    const stone = new Stone();
    const stoneMesh = await stone.load();

    // Tag as landscape element for terrain adaptation
    stoneMesh.userData.isLandscapeElement = true;

    stoneMesh.position.copy(position);
    stoneMesh.scale.setScalar(0.3 + Math.random() * 0.4); // Random scale 0.3-0.7
    stoneMesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation
    this.scene.add(stoneMesh);
    this.createdObjects.push(stoneMesh);
  }

  private async addBarrelCactus(position: THREE.Vector3): Promise<void> {
    logger.debug(`🌵 Creating BarrelCactus with levelOfDetail: ${this.levelOfDetail}`);
    const cactus = new BarrelCactus({
      scale: 0.4 + Math.random() * 0.3,
      levelOfDetail: this.levelOfDetail,
    });
    const cactusMesh = await cactus.load();

    // Tag as landscape element for terrain adaptation
    cactusMesh.userData.isLandscapeElement = true;

    cactusMesh.position.copy(position);

    // Count polygons for debugging
    let polygons = 0;
    cactusMesh.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        if (geometry.index !== null) {
          polygons += geometry.index.count / 3;
        } else {
          const positionAttribute = geometry.getAttribute('position');
          if (positionAttribute) {
            polygons += positionAttribute.count / 3;
          }
        }
      }
    });
    logger.debug(
      `🌵 BarrelCactus created with ${Math.floor(polygons)} polygons (levelOfDetail: ${this.levelOfDetail})`
    );

    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  private async addPricklyPearCactus(position: THREE.Vector3): Promise<void> {
    const cactus = new PricklyPearCactus({
      scale: 0.3 + Math.random() * 0.4,
      levelOfDetail: this.levelOfDetail,
    });
    const cactusMesh = await cactus.load();

    // Tag as landscape element for terrain adaptation
    cactusMesh.userData.isLandscapeElement = true;

    cactusMesh.position.copy(position);
    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  private async addCanaryPalm(position: THREE.Vector3): Promise<void> {
    const palm = new CanaryPalm({
      height: 7 + Math.random() * 5,
      seed: Math.random() * 1000,
      levelOfDetail: this.levelOfDetail,
    });
    const palmMesh = await palm.load();

    // Tag as landscape element for terrain adaptation
    palmMesh.userData.isLandscapeElement = true;

    palmMesh.position.copy(position);
    palmMesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(palmMesh);
    this.createdObjects.push(palmMesh);
  }

  /**
   * Add a pool near a house
   */
  private async addPoolToHouse(housePosition: THREE.Vector3, houseScale: number): Promise<void> {
    try {
      const pool = new Pool();
      const poolMesh = await pool.load();

      // Position pool behind or to the side of the house
      const poolOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 40 * houseScale,
        0,
        20 + Math.random() * 20 * houseScale // Behind the house
      );

      poolMesh.position.copy(housePosition).add(poolOffset);
      poolMesh.scale.setScalar(0.6 + Math.random() * 0.4); // Vary pool size
      poolMesh.rotation.y = Math.random() * Math.PI * 2;
      poolMesh.userData.isLandscapeElement = true;
      poolMesh.userData.parentHousePosition = housePosition.clone();

      this.scene.add(poolMesh);
      this.createdObjects.push(poolMesh);
    } catch (error) {
      logger.error('Error adding pool to house:', error);
    }
  }

  /**
   * Create a group of houses with precise control over types, positions, and variations
   */
  async createNeighborhood(
    houses: HouseConfig[],
    groupConfig: HouseGroupConfig
  ): Promise<THREE.Object3D[]> {
    const houseMeshes: THREE.Object3D[] = [];

    // Calculate positions based on formation type
    const positions = calculateHousePositions(houses.length, groupConfig);

    // Create each house with its specific configuration
    const actualHouseCount = Math.min(houses.length, positions.length);

    for (let i = 0; i < actualHouseCount; i++) {
      const houseConfig = houses[i];
      const position = positions[i];

      if (position) {
        const houseMesh = await this.createSingleHouse(houseConfig, position);
        if (houseMesh) {
          houseMeshes.push(houseMesh);
        }
      }
    }

    return houseMeshes;
  }

  /**
   * Create a mixed neighborhood with custom house distribution
   */
  async createMixedNeighborhood(
    center: THREE.Vector3,
    count: number,
    formation: HouseGroupConfig['formation'] = 'suburban',
    spacingMultiplier: number = 1.0,
    style?: HouseStyle
  ): Promise<THREE.Object3D[]> {
    // Validate spacing multiplier
    if (spacingMultiplier < 0.1 || spacingMultiplier > 10) {
      throw new Error(
        `Invalid spacing multiplier: ${spacingMultiplier}. Must be between 0.1 and 10.0`
      );
    }

    const houses = generateMixedNeighborhood(count, style);
    const baseSpacing = formation === 'rural' ? 250 : 90;
    const spacing = baseSpacing * spacingMultiplier;

    // Scale neighborhood size based on house count
    // Base size 120 for ~20 houses, scale up for more houses and spacing
    const baseSize = 120;
    const baseCount = 20;
    const neighborhoodSize = baseSize * Math.sqrt(count / baseCount) * spacingMultiplier;

    return this.createNeighborhood(houses, {
      center,
      formation,
      spacing,
      neighborhoodSize,
      randomVariation: 0.3,
    });
  }
}
