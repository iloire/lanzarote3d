import * as THREE from 'three';
import {
  House,
  HouseType,
  Pool,
  Stone,
  SaguaroCactus,
  BarrelCactus,
  PricklyPearCactus,
  OrganPipeCactus,
} from '../../foundation/components/scenery';
import {
  Villa,
  Townhouse,
  Barn,
  DesertHouse,
  DesertHouseWithPool,
} from '../../foundation/components/scenery/buildings';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { HouseConfig, HouseGroupConfig, NeighborhoodVariation, DEFAULT_VARIATION } from './house-group-types';
import {
  calculateHousePositions,
  generateSuburbanNeighborhood,
  generateUrbanNeighborhood,
  generateRuralNeighborhood,
  generateMixedNeighborhood,
} from './house-group-utils';

/**
 * House Group Creator - handles the creation and management of neighborhoods
 */
export class HouseGroupCreator {
  private scene: THREE.Scene;
  private componentRegistry: ComponentRegistry;
  private lowPoly: boolean = false;
  private createdObjects: THREE.Object3D[] = []; // Track all created objects

  constructor(scene: THREE.Scene, componentRegistry: ComponentRegistry) {
    this.scene = scene;
    this.componentRegistry = componentRegistry;
  }

  /**
   * Set low-poly mode for all future house creation
   */
  setLowPolyMode(lowPoly: boolean): void {
    this.lowPoly = lowPoly;
  }

  /**
   * Clear all created objects from the scene and dispose them properly
   */
  clearAll(): void {
    console.log(`🧹 HouseGroupCreator clearing ${this.createdObjects.length} objects`);

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
    console.log('✅ HouseGroupCreator cleanup completed');
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
    let house: any;
    let houseMesh: THREE.Object3D;
    let scale = houseConfig.scale || 1;

    // Create house based on type
    try {
      switch (houseConfig.type) {
        case 'House':
          console.log(`✅ Creating House with lowPoly: ${this.lowPoly}`);
          house = new House({
            type: houseConfig.houseType || HouseType.Medium,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;

        case 'Villa':
          console.log(`✅ Creating Villa with lowPoly: ${this.lowPoly}`);
          house = new Villa({
            scale: scale,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;

        case 'Townhouse':
          console.log(`✅ Creating Townhouse with lowPoly: ${this.lowPoly}`);
          house = new Townhouse({
            scale: scale,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;

        case 'Barn':
          console.log(`✅ Creating Barn with lowPoly: ${this.lowPoly}`);
          house = new Barn({
            scale: scale,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;

        case 'DesertHouse':
          console.log(`✅ Creating DesertHouse with lowPoly: ${this.lowPoly}`);
          house = new DesertHouse({
            scale: scale,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;


        case 'DesertHouseWithPool':
          console.log(`✅ Creating DesertHouseWithPool with lowPoly: ${this.lowPoly}`);
          house = new DesertHouseWithPool({
            scale: scale,
            lowPoly: this.lowPoly,
            ...(houseConfig.colors || {}),
          });
          houseMesh = house.load();
          break;

        default:
          console.warn(`Unknown house type: ${houseConfig.type}`);
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
        console.error('Invalid position provided to createSingleHouse:', position);
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

      // Add land plot if specified
      if (houseConfig.landPlot) {
        this.addLandPlot(position, houseConfig.landPlot, houseMesh.rotation.y);
      }

      // Add to scene and track
      this.scene.add(houseMesh);
      this.createdObjects.push(houseMesh);

      // Add pool if specified and house doesn't already include one
      if (houseConfig.includePool && houseConfig.type !== 'DesertHouseWithPool') {
        await this.addPoolToHouse(position, scale);
      }

      return houseMesh;
    } catch (error) {
      console.error(`Error creating house of type ${houseConfig.type}:`, error);
      return null;
    }
  }

  /**
   * Add a land plot under a house
   */
  private addLandPlot(
    housePosition: THREE.Vector3,
    landPlot: { width: number; depth: number; color?: string },
    houseRotation: number = 0
  ): void {
    try {
      const landGeometry = new THREE.PlaneGeometry(landPlot.width, landPlot.depth);
      const landMaterial = new THREE.MeshStandardMaterial({
        color: landPlot.color || '#7CFC00',
        roughness: 0.8,
        transparent: true,
        opacity: 0.7,
      });

      const landMesh = new THREE.Mesh(landGeometry, landMaterial);

      // Position the land plot at ground level
      landMesh.position.copy(housePosition);
      landMesh.position.y = -0.5; // Slightly below ground to avoid z-fighting

      // Rotate to lie flat and match house rotation if needed
      landMesh.rotation.x = -Math.PI / 2; // Lie flat
      landMesh.rotation.z = houseRotation; // Match house rotation

      // Set rendering order to render behind other objects
      landMesh.renderOrder = -1;

      this.scene.add(landMesh);
      this.createdObjects.push(landMesh);

      // Add random cacti and stones to the land plot
      this.addLandscapeElements(housePosition, landPlot, houseRotation);
    } catch (error) {
      console.error('Error adding land plot:', error);
    }
  }

  /**
   * Add random cacti and stones to a land plot
   */
  private addLandscapeElements(
    centerPosition: THREE.Vector3,
    landPlot: { width: number; depth: number },
    rotation: number = 0
  ): void {
    const maxElements = Math.floor((landPlot.width * landPlot.depth) / 1000); // Density based on area
    const elementCount = Math.floor(Math.random() * maxElements) + 1;

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
          this.addStone(elementPosition);
        } else if (elementType < 0.5) {
          // 20% chance for barrel cactus
          this.addBarrelCactus(elementPosition);
        } else if (elementType < 0.7) {
          // 20% chance for prickly pear cactus
          this.addPricklyPearCactus(elementPosition);
        } else if (elementType < 0.85) {
          // 15% chance for saguaro cactus
          this.addSaguaroCactus(elementPosition);
        } else {
          // 15% chance for organ pipe cactus
          this.addOrganPipeCactus(elementPosition);
        }
      } catch (error) {
        console.error('Error adding landscape element:', error);
      }
    }
  }

  private addStone(position: THREE.Vector3): void {
    const stone = new Stone();
    const stoneMesh = stone.createSyncContent();
    stoneMesh.position.copy(position);
    stoneMesh.scale.setScalar(0.3 + Math.random() * 0.4); // Random scale 0.3-0.7
    stoneMesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation
    this.scene.add(stoneMesh);
    this.createdObjects.push(stoneMesh);
  }

  private addBarrelCactus(position: THREE.Vector3): void {
    console.log(`🌵 Creating BarrelCactus with lowPoly: ${this.lowPoly}`);
    const cactus = new BarrelCactus({
      scale: 0.4 + Math.random() * 0.3,
      lowPoly: this.lowPoly
    });
    const cactusMesh = cactus.createSyncContent();
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
    console.log(`🌵 BarrelCactus created with ${Math.floor(polygons)} polygons (lowPoly: ${this.lowPoly})`);

    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  private addPricklyPearCactus(position: THREE.Vector3): void {
    const cactus = new PricklyPearCactus({
      scale: 0.3 + Math.random() * 0.4,
      lowPoly: this.lowPoly
    });
    const cactusMesh = cactus.createSyncContent();
    cactusMesh.position.copy(position);
    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  private addSaguaroCactus(position: THREE.Vector3): void {
    const cactus = new SaguaroCactus({
      scale: 0.2 + Math.random() * 0.3,
      lowPoly: this.lowPoly
    });
    const cactusMesh = cactus.createSyncContent();
    cactusMesh.position.copy(position);
    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  private addOrganPipeCactus(position: THREE.Vector3): void {
    const cactus = new OrganPipeCactus({
      scale: 0.3 + Math.random() * 0.3,
      lowPoly: this.lowPoly
    });
    const cactusMesh = cactus.createSyncContent();
    cactusMesh.position.copy(position);
    this.scene.add(cactusMesh);
    this.createdObjects.push(cactusMesh);
  }

  /**
   * Add a pool near a house
   */
  private async addPoolToHouse(housePosition: THREE.Vector3, houseScale: number): Promise<void> {
    try {
      const pool = new Pool();
      const poolMesh = pool.createSyncContent();

      // Position pool behind or to the side of the house
      const poolOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 40 * houseScale,
        0,
        20 + Math.random() * 20 * houseScale // Behind the house
      );

      poolMesh.position.copy(housePosition).add(poolOffset);
      poolMesh.scale.setScalar(0.6 + Math.random() * 0.4); // Vary pool size
      poolMesh.rotation.y = Math.random() * Math.PI * 2;

      this.scene.add(poolMesh);
      this.createdObjects.push(poolMesh);
    } catch (error) {
      console.error('Error adding pool to house:', error);
    }
  }

  /**
   * Create a group of houses with precise control over types, positions, and variations
   */
  async createNeighborhood(
    houses: HouseConfig[],
    groupConfig: HouseGroupConfig,
    variation: NeighborhoodVariation = DEFAULT_VARIATION
  ): Promise<THREE.Object3D[]> {
    const houseMeshes: THREE.Object3D[] = [];

    // Calculate positions based on formation type
    const positions = calculateHousePositions(houses.length, groupConfig);

    // Create each house with its specific configuration
    for (let i = 0; i < houses.length; i++) {
      const houseConfig = houses[i];
      const position = positions[i];

      const houseMesh = await this.createSingleHouse(houseConfig, position);
      if (houseMesh) {
        houseMeshes.push(houseMesh);
      }
    }

    return houseMeshes;
  }

  /**
   * Calculate dynamic spacing based on house types and sizes in the neighborhood
   */
  private calculateDynamicSpacing(houses: HouseConfig[], baseSpacing: number): number {
    // Calculate average land plot size for houses in this neighborhood
    const totalLandSize = houses.reduce((sum, house) => {
      const scale = house.scale || 1;

      // Base sizes for different house types (matching the land plot calculations)
      const baseSizes: Record<HouseConfig['type'], number> = {
        'House': 60,
        'Villa': 100,
        'Townhouse': 50,
        'Barn': 80,
        'DesertHouse': 70,
        'DesertHouseWithPool': 90,
      };

      const baseSize = baseSizes[house.type] || 60;
      return sum + (baseSize * scale);
    }, 0);

    const averageLandSize = totalLandSize / houses.length;

    // Adjust spacing based on average land size
    // Minimum spacing should be at least 1.5x the average land size
    const dynamicSpacing = Math.max(baseSpacing, averageLandSize * 1.5);

    console.log(`🏘️ Dynamic spacing for ${houses.length} houses: base=${baseSpacing}, avgLandSize=${averageLandSize.toFixed(1)}, final=${dynamicSpacing.toFixed(1)}`);

    return dynamicSpacing;
  }

  /**
   * Create a suburban neighborhood with mixed housing
   */
  async createSuburbanNeighborhood(
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium',
    variation: NeighborhoodVariation = DEFAULT_VARIATION
  ): Promise<THREE.Object3D[]> {
    const houses = generateSuburbanNeighborhood(size, variation);
    const baseSpacing = size === 'small' ? 80 : size === 'medium' ? 90 : 100;
    const dynamicSpacing = this.calculateDynamicSpacing(houses, baseSpacing);

    return this.createNeighborhood(houses, {
      center,
      formation: 'suburban',
      spacing: dynamicSpacing,
      neighborhoodSize: size === 'small' ? 120 : size === 'medium' ? 150 : 180,
      randomVariation: 0.3,
    }, variation);
  }

  /**
   * Create an urban neighborhood with compact housing
   */
  async createUrbanNeighborhood(
    center: THREE.Vector3,
    density: 'compact' | 'dense' | 'downtown' = 'dense',
    variation: NeighborhoodVariation = DEFAULT_VARIATION
  ): Promise<THREE.Object3D[]> {
    const houses = generateUrbanNeighborhood(density, variation);
    const baseSpacing = density === 'compact' ? 60 : density === 'dense' ? 50 : 45;
    const dynamicSpacing = this.calculateDynamicSpacing(houses, baseSpacing);

    return this.createNeighborhood(houses, {
      center,
      formation: 'grid',
      spacing: dynamicSpacing,
      neighborhoodSize: density === 'compact' ? 140 : density === 'dense' ? 160 : 180,
      randomVariation: 0.15,
    }, variation);
  }

  /**
   * Create a rural neighborhood with scattered buildings
   */
  async createRuralNeighborhood(
    center: THREE.Vector3,
    style: 'farmstead' | 'village' | 'scattered' = 'village',
    variation: NeighborhoodVariation = DEFAULT_VARIATION
  ): Promise<THREE.Object3D[]> {
    const houses = generateRuralNeighborhood(style, variation);
    const spacing = style === 'farmstead' ? 150 : style === 'village' ? 120 : 200;

    return this.createNeighborhood(houses, {
      center,
      formation: 'rural',
      spacing,
      neighborhoodSize: style === 'farmstead' ? 180 : style === 'village' ? 150 : 200,
      randomVariation: 0.4,
    }, variation);
  }

  /**
   * Create houses along a street
   */
  async createStreetNeighborhood(
    center: THREE.Vector3,
    houses: HouseConfig[],
    streetWidth: number = 30
  ): Promise<THREE.Object3D[]> {
    return this.createNeighborhood(houses, {
      center,
      formation: 'street',
      spacing: 80,
      streetWidth,
      randomVariation: 0.2,
    });
  }

  /**
   * Create houses in a cul-de-sac formation
   */
  async createCulDeSac(
    center: THREE.Vector3,
    houses: HouseConfig[],
    radius: number = 100
  ): Promise<THREE.Object3D[]> {
    return this.createNeighborhood(houses, {
      center,
      formation: 'cul-de-sac',
      spacing: 60,
      neighborhoodSize: radius * 2,
      randomVariation: 0.25,
    });
  }

  /**
   * Create houses in a grid formation
   */
  async createGridNeighborhood(
    center: THREE.Vector3,
    houses: HouseConfig[],
    spacing: number = 90,
    rowCount: number = 3
  ): Promise<THREE.Object3D[]> {
    return this.createNeighborhood(houses, {
      center,
      formation: 'grid',
      spacing,
      rowCount,
      colCount: Math.ceil(houses.length / rowCount),
      randomVariation: 0.15,
    });
  }

  /**
   * Create a mixed neighborhood with custom house distribution
   */
  async createMixedNeighborhood(
    center: THREE.Vector3,
    count: number,
    formation: HouseGroupConfig['formation'] = 'suburban',
    houseDistribution?: Partial<Record<HouseConfig['type'], number>>,
    variation: NeighborhoodVariation = DEFAULT_VARIATION
  ): Promise<THREE.Object3D[]> {
    const houses = generateMixedNeighborhood(count, houseDistribution, variation);
    const spacing = formation === 'rural' ? 150 : 90;

    return this.createNeighborhood(houses, {
      center,
      formation,
      spacing,
      neighborhoodSize: 120,
      randomVariation: 0.3,
    }, variation);
  }

  /**
   * Create a random neighborhood layout
   */
  async createRandomNeighborhood(
    center: THREE.Vector3,
    houses: HouseConfig[],
    size: number = 120
  ): Promise<THREE.Object3D[]> {
    return this.createNeighborhood(houses, {
      center,
      formation: 'random',
      spacing: 70,
      neighborhoodSize: size,
      randomVariation: 0.5,
    });
  }
}