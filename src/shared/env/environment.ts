import * as THREE from 'three';
import { Clouds } from '../../foundation/components/environment';
import { Weather } from '../../foundation/components/physics';
import { Thermal } from '../../foundation/components/physics';
import { rndIntBetween } from '../../foundation/utils/math';
import Tree from '../../foundation/components/scenery/trees/Tree';
import PineTree from '../../foundation/components/scenery/trees/PineTree';
import Stone from '../../foundation/components/scenery/Stone';
import {
  SmallSailBoat,
  FishingBoat,
  Yacht,
  SpeedBoat,
  PatrolBoat,
} from '../../foundation/components/scenery';
import { Car } from '../../foundation/components/vehicles/Car';
import { AutonomousCar } from '../../foundation/components/vehicles/AutonomousCar';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';
import Birds from '../../foundation/components/wildlife/Birds';
import { Hangglider as HangGlider } from '../../foundation/components/vehicles';
import { addMeshAroundArea } from './mesh-utils';
import { generateThermalPair, ThermalGenerationOptions } from './thermal-utils';
import { CloudOptions } from '../../foundation/components/environment';
import { Theme } from '../../foundation/types/Theme';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { IThreeComponent } from '../../foundation/components/base/IThreeComponent';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';

interface MovableComponent extends IThreeComponent {
  updateMovementOrigin?(): void;
}

interface DisposableComponent {
  dispose?(): void;
}
import { BoatGroupCreator } from './boat-group-creator';
import { BoatConfig, BoatGroupConfig } from './boat-group-types';
import { CarGroupCreator } from './car-group-creator';
import { CarConfig, CarGroupConfig } from './car-group-types';
import { HouseGroupCreator } from './house-group-creator';

/**
 * Boat type weights for realistic marine distribution
 */
interface BoatTypeWeights {
  [boatType: string]: number;
}

/**
 * Default weights for boat types (higher = more common)
 */
const DEFAULT_BOAT_WEIGHTS: BoatTypeWeights = {
  SmallSailBoat: 4, // Most common - recreational sailing
  FishingBoat: 3, // Common - local fishing industry
  SpeedBoat: 2, // Common - recreational water sports
  Yacht: 1, // Less common - luxury vessels
  PatrolBoat: 0.8, // Rare but visible - official/security vessels
};

class Environment {
  birds!: Birds;
  hg!: HangGlider;
  thermals: Thermal[] = [];
  cloudInstances: Clouds[] = [];
  private componentRegistry: ComponentRegistry = new ComponentRegistry();
  private boatGroupCreator: BoatGroupCreator;
  private carGroupCreator: CarGroupCreator;
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boatGroupCreator = new BoatGroupCreator(scene, this.componentRegistry);
    this.carGroupCreator = new CarGroupCreator(scene, this.componentRegistry);
  }

  updateWrapSpeed(wrapSpeed: number) {
    this.birds && this.birds.updateWrapSpeed(wrapSpeed);
    // Note: Hangglider no longer extends AutoFlier, so updateWrapSpeed removed
    // Use FlyingBehavior composition for autonomous flight instead
  }

  async addBirds(path: THREE.Vector3[], gui?: { addFolder: (name: string) => any }) {
    // Create birds with optimized flight parameters for the environment
    this.birds = new Birds({
      speed: 2,
      arrivalThreshold: 20,
      smoothRotation: true,
      rotationSpeed: 0.06,
      forwardAxis: 'z', // Back to Z axis but will fix orientation in rotation logic
      scale: 1,
      animationSpeed: 1.2,
    });
    const birdsMesh = await this.birds.load(path, gui);
    this.scene.add(birdsMesh);
  }

  async addHangGlider(path: THREE.Vector3[], gui?: { addFolder: (name: string) => any }) {
    this.hg = new HangGlider();
    const hgMesh = await this.hg.load();
    this.scene.add(hgMesh);

    // Add GUI controls if provided
    if (gui) {
      this.hg.addGuiControls(gui);
    }

    // Note: Path following removed with AutoFlier inheritance
    // Use FlyingBehavior composition for autonomous flight instead
  }

  async addBoats(
    water: THREE.Mesh,
    options?: {
      randomize?: boolean;
      types?: string[];
      weights?: BoatTypeWeights;
      selectionMode?: 'uniform' | 'weighted';
    }
  ) {
    const {
      randomize = true,
      types = ['SmallSailBoat', 'FishingBoat', 'Yacht', 'SpeedBoat', 'PatrolBoat'],
      weights = DEFAULT_BOAT_WEIGHTS,
      selectionMode = 'weighted',
    } = options || {};

    // Create boats for first area (marina/harbor - more variety)
    const group1OfBoats = await this.boatGroupCreator.createRecreationalBoats(
      water,
      new THREE.Vector3(7879, 0, -5445),
      4,
      'random'
    );

    // Create boats for second area (open water - different distribution)
    const group2OfBoats = await this.boatGroupCreator.createRecreationalBoats(
      water,
      new THREE.Vector3(8279, 0, -6455),
      3,
      'random'
    );

    // Fix movement origins for all boats after positioning
    this.updateAllBoatMovementOrigins();
  }

  // Convenience methods for backward compatibility
  async addMixedBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false }); // Cycles through types in order
  }

  async addRandomBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: true });
  }

  async addOnlyYachts(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false, types: ['Yacht'] });
  }

  async addOnlySailboats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false, types: ['SmallSailBoat'] });
  }

  async addOnlySpeedBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false, types: ['SpeedBoat'] });
  }

  // ==========================================
  // BOAT GROUP CREATION SYSTEM
  // ==========================================

  /**
   * Create a group of boats with precise control over types, positions, and movement
   */
  async createBoatGroup(
    water: THREE.Mesh,
    boats: BoatConfig[],
    groupConfig: BoatGroupConfig
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.boatGroupCreator.createBoatGroup(water, boats, groupConfig);
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  /**
   * Create a marina/harbor formation with mixed boat types
   */
  async createMarina(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.boatGroupCreator.createMarina(water, center, size);
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  /**
   * Create a patrol fleet with coordinated movement
   */
  async createPatrolFleet(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'single' | 'formation' | 'fleet' = 'formation'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.boatGroupCreator.createPatrolFleet(water, center, size);
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  /**
   * Create a racing formation with speed boats
   */
  async createRacingFleet(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.boatGroupCreator.createRacingFleet(water, center, size);
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  /**
   * Create recreational boats with mixed types and movement
   */
  async createRecreationalBoats(
    water: THREE.Mesh,
    center: THREE.Vector3,
    count: number = 8,
    formation: 'circle' | 'random' = 'random'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.boatGroupCreator.createRecreationalBoats(
      water,
      center,
      count,
      formation
    );
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  /**
   * Create a neighborhood of houses with terrain adaptation
   */
  async createHouseNeighborhood(
    center: THREE.Vector3,
    houseCount: number,
    formation: 'street' | 'cul-de-sac' | 'grid' | 'suburban' | 'rural' | 'random',
    terrain: THREE.Mesh,
    lowPoly: boolean = false
  ): Promise<THREE.Object3D[]> {
    // Get terrain height for the center position
    const terrainHeight = this.getTerrainHeight(center.x, center.z, terrain);
    if (isNaN(terrainHeight)) {
      console.warn(`Could not determine terrain height at center ${center.x}, ${center.z}`);
      return [];
    }

    // Update center position with correct terrain height
    const terrainAdaptedCenter = new THREE.Vector3(center.x, terrainHeight, center.z);

    // Create house group creator
    const houseGroupCreator = new HouseGroupCreator(this.scene, this.componentRegistry);
    houseGroupCreator.setLowPolyMode(lowPoly);

    try {
      // Use the appropriate neighborhood creation method based on formation
      let meshes: THREE.Object3D[] = [];

      switch (formation) {
        case 'suburban':
          meshes = await houseGroupCreator.createSuburbanNeighborhood(terrainAdaptedCenter, 'medium');
          break;
        case 'rural':
          meshes = await houseGroupCreator.createRuralNeighborhood(terrainAdaptedCenter, 'village');
          break;
        case 'grid':
          meshes = await houseGroupCreator.createMixedNeighborhood(terrainAdaptedCenter, houseCount, 'grid');
          break;
        case 'street':
          meshes = await houseGroupCreator.createMixedNeighborhood(terrainAdaptedCenter, houseCount, 'street');
          break;
        case 'cul-de-sac':
          meshes = await houseGroupCreator.createMixedNeighborhood(terrainAdaptedCenter, houseCount, 'cul-de-sac');
          break;
        default:
          meshes = await houseGroupCreator.createMixedNeighborhood(terrainAdaptedCenter, houseCount, 'random');
          break;
      }

      // Adapt all created houses to terrain height
      meshes.forEach((mesh: THREE.Object3D) => {
        const meshTerrainHeight = this.getTerrainHeight(mesh.position.x, mesh.position.z, terrain);
        if (!isNaN(meshTerrainHeight)) {
          mesh.position.y = meshTerrainHeight;
        }
      });

      return meshes;
    } catch (error) {
      console.error(`Error creating ${formation} neighborhood:`, error);
      return [];
    }
  }

  async addHouses(terrain: THREE.Mesh, lowPoly: boolean = true) {
    // Create multiple neighborhoods at the same locations as before but with proper town structure
    const mode = lowPoly ? 'LOW-POLY' : 'HIGH-DETAIL';
    console.log(`🏘️ Creating ${mode} neighborhoods for ${lowPoly ? 'optimized performance' : 'maximum detail'}...`);

    try {
      // Near paraglider area - suburban neighborhood
      await this.createHouseNeighborhood(
        new THREE.Vector3(6879, 0, 545),
        12,
        'suburban',
        terrain,
        lowPoly // Use low-poly for performance
      );

      // Famara - coastal village with street formation
      await this.createHouseNeighborhood(
        new THREE.Vector3(6279, 0, -3155),
        15,
        'street',
        terrain,
        lowPoly
      );

      // Noruegos - small rural settlement
      await this.createHouseNeighborhood(
        new THREE.Vector3(7827, 0, -3460),
        8,
        'rural',
        terrain,
        lowPoly
      );

      // Teguise - historic town center with grid layout
      await this.createHouseNeighborhood(
        new THREE.Vector3(5600, 0, 1205),
        18,
        'grid',
        terrain,
        lowPoly
      );

      console.log('✅ All neighborhoods created successfully');
    } catch (error) {
      console.error('❌ Error creating neighborhoods:', error);
    }
  }

  async addStones(terrain: THREE.Mesh) {
    const stone = await this.componentRegistry.register(new Stone({}), 'stone');
    const scale = 1;
    stone.scale.set(scale, scale, scale);
    const pos = new THREE.Vector3(6879, 600, -545);
    addMeshAroundArea([stone], pos, 100, terrain, this.scene, 200, 2);
  }

  async addPines(terrain: THREE.Mesh) {
    // Pre-create a pine tree and use it for the area
    const pineTree = await this.componentRegistry.register(new PineTree({}), 'pinetree');
    const scalePineTree = 10;
    pineTree.scale.set(scalePineTree, scalePineTree, scalePineTree);

    addMeshAroundArea(
      [pineTree],
      new THREE.Vector3(8379, 0, -2145),
      100,
      terrain,
      this.scene,
      400,
      5
    );
  }

  async addTrees(terrain: THREE.Mesh, scale: number = 2) {
    const tree = await this.componentRegistry.register(new Tree({}), 'tree');
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea([tree], new THREE.Vector3(6879, 0, -545), 100, terrain, this.scene, 100, 5);
    addMeshAroundArea([tree], new THREE.Vector3(8879, 0, -2245), 100, terrain, this.scene, 100, 5);
    addMeshAroundArea([tree], new THREE.Vector3(5600, 0, 705), 100, terrain, this.scene, 40, 5);
  }

  // ==========================================
  // CAR GROUP CREATION SYSTEM
  // ==========================================

  /**
   * Create a group of cars with precise control over types, positions, and movement
   */
  async createCarGroup(
    terrain: THREE.Mesh,
    cars: CarConfig[],
    groupConfig: CarGroupConfig
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createCarGroup(terrain, cars, groupConfig);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create a parking lot with mixed car types
   */
  async createParkingLot(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createParkingLot(terrain, center, size);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create a convoy with coordinated movement
   */
  async createConvoy(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createConvoy(terrain, center, size);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create a patrol fleet with autonomous vehicles
   */
  async createCarPatrolFleet(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'single' | 'team' | 'fleet' = 'team'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createPatrolFleet(terrain, center, size);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create traffic simulation with mixed car types
   */
  async createTrafficFlow(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'light' | 'moderate' | 'heavy' = 'moderate'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createTrafficFlow(terrain, center, size);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create mixed recreational cars
   */
  async createMixedCars(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    count: number = 6,
    formation: 'circle' | 'random' | 'grid' = 'random'
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createMixedCars(terrain, center, count, formation);
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  /**
   * Create highway traffic between two points
   */
  async createHighwayTraffic(
    terrain: THREE.Mesh,
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    carCount: number = 5
  ): Promise<THREE.Object3D[]> {
    const meshes = await this.carGroupCreator.createHighwayTraffic(
      terrain,
      startPoint,
      endPoint,
      carCount
    );
    this.updateAllCarMovementOrigins();
    return meshes;
  }

  addThermals(weather: Weather, opacity: number = 0.05): Thermal[] {
    const thermals = this.generateThermals(weather, opacity);
    thermals.forEach(t => {
      this.scene.add(t.getMesh());
    });
    return thermals;
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

    this.thermals.concat(allThermals);

    return allThermals;
  }

  async addClouds(thermals: Thermal[], options: CloudOptions): Promise<THREE.Object3D[]> {
    // Clear previous cloud instances
    this.cloudInstances = [];

    // from thermals
    const mainThermals = thermals.filter(t => t.isMainThermal());
    const cloudPromises = mainThermals.map(async t => {
      const cloudInstance = new Clouds(options);
      this.cloudInstances.push(cloudInstance);

      if (t.isSuperThermal()) {
        return cloudInstance.load(
          3,
          new THREE.Vector3(
            t.getPosition().x,
            t.getDimensions().height * (1 + 0.01 * rndIntBetween(10, 30)),
            t.getPosition().z
          )
        );
      } else {
        return cloudInstance.load(
          1,
          new THREE.Vector3(
            t.getPosition().x,
            t.getDimensions().height * (1 + 0.01 * rndIntBetween(10, 30)),
            t.getPosition().z
          )
        );
      }
    });

    const clouds = await Promise.all(cloudPromises);
    clouds.forEach(c => {
      this.scene.add(c);
    });

    // custom clouds
    const customCloudPromises = [
      { x: 5120, y: 2000, z: -10100 },
      { x: 2600, y: 2300, z: 842 },
      { x: -3600, y: 2300, z: 8042 },
    ].map(async pos => {
      const cloudInstance = new Clouds(options);
      this.cloudInstances.push(cloudInstance);
      const cloud = await cloudInstance.load(1, new THREE.Vector3(pos.x, pos.y, pos.z));
      this.scene.add(cloud);
      return cloud;
    });

    const customClouds = await Promise.all(customCloudPromises);
    return clouds.concat(customClouds);
  }

  getThermals(): Thermal[] {
    return this.thermals;
  }

  // Theme-aware methods

  /**
   * Add clouds using theme settings
   */
  async addCloudsFromTheme(thermals: Thermal[], theme: Theme): Promise<THREE.Object3D[]> {
    const cloudOptions = ThemeEngine.getCloudOptionsFromTheme(theme);
    return this.addClouds(thermals, cloudOptions);
  }

  /**
   * Update cloud colors for theme switching
   */
  updateCloudColors(theme: Theme): void {
    const cloudOptions = ThemeEngine.getCloudOptionsFromTheme(theme);
    if (cloudOptions.colors && cloudOptions.colors.length > 0) {
      console.log('Updating cloud colors for theme:', theme.name, cloudOptions.colors);
      this.cloudInstances.forEach(cloudInstance => {
        cloudInstance.updateColors(cloudOptions.colors!);
      });
    }
  }

  /**
   * Create weather from theme
   */
  createWeatherFromTheme(theme: Theme): Weather {
    return ThemeEngine.createWeatherFromTheme(theme);
  }

  /**
   * Apply theme to environment components
   */
  async applyTheme(theme: Theme, options?: { terrain?: THREE.Mesh }): Promise<void> {
    await ThemeEngine.applyToEnvironment(this, theme, options);
  }

  /**
   * Get terrain style from theme for use in terrain workshop demos
   */
  getTerrainStyleFromTheme(theme: Theme): string {
    return ThemeEngine.getTerrainStyleFromTheme(theme);
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
        console.log(`Updated movement origin for component: ${id}`);
      }
    });
  }

  /**
   * Update movement origins for all cars after they've been positioned
   */
  private updateAllCarMovementOrigins(): void {
    this.componentRegistry.getAllComponents().forEach((component, id) => {
      // Check if component has movement behavior (Car, AutonomousCar, etc.)
      if (component && typeof (component as MovableComponent).updateMovementOrigin === 'function') {
        (component as MovableComponent).updateMovementOrigin();
        console.log(`Updated movement origin for car component: ${id}`);
      }
    });
  }

  /**
   * Get component registry for external access
   */
  getComponentRegistry(): ComponentRegistry {
    return this.componentRegistry;
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

  /**
   * Dispose all managed components and clean up environment
   */
  dispose(): void {
    // Dispose all registered components
    this.componentRegistry.dispose();

    // Clean up other environment objects
    this.thermals.forEach(thermal => {
      if (thermal && typeof (thermal as DisposableComponent).dispose === 'function') {
        (thermal as DisposableComponent).dispose();
      }
    });
    this.thermals.length = 0;

    this.cloudInstances.forEach(cloud => {
      if (cloud && typeof (cloud as DisposableComponent).dispose === 'function') {
        (cloud as DisposableComponent).dispose();
      }
    });
    this.cloudInstances.length = 0;

    // Dispose birds and hang glider if they exist
    if (this.birds && this.birds.dispose) {
      this.birds.dispose();
    }

    if (this.hg && this.hg.dispose) {
      this.hg.dispose();
    }

    console.log('Environment disposed with all components cleaned up');
  }
}

export default Environment;
