import * as THREE from 'three';
import { Clouds } from '../../../foundation/components/environment';
import { Weather } from '../../../foundation/components/physics';
import { Thermal } from '../../../foundation/components/physics';
import { rndIntBetween } from '../../../foundation/utils/math';
import Tree from '../../../foundation/components/scenery/Tree';
import PineTree from '../../../foundation/components/scenery/PineTree';
import Stone from '../../../foundation/components/scenery/Stone';
import House, { HouseType } from '../../../foundation/components/scenery/House';
import { SmallSailBoat, FishingBoat, Yacht, SpeedBoat, PatrolBoat } from '../../../foundation/components/scenery';
import { MovementPattern } from '../../../foundation/systems/behaviors/MovingBehavior';
import Birds from '../../../foundation/components/wildlife/Birds';
import { Hangglider as HangGlider } from '../../../foundation/components/vehicles';
import { addMeshAroundArea } from './mesh-utils';
import { generateThermalPair, ThermalGenerationOptions } from './thermal-utils';
import { CloudOptions } from '../../../foundation/components/environment';
import { Theme } from '../../../foundation/types/Theme';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { IThreeComponent } from '../../../foundation/components/base/IThreeComponent';
import { ComponentRegistry } from '../../../foundation/systems/ComponentRegistry';
import { BoatGroupCreator } from './boat-group-creator';
import { BoatConfig, BoatGroupConfig } from './boat-group-types';

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
  'SmallSailBoat': 3,    // Most common - recreational sailing
  'FishingBoat': 2,      // Common - local fishing industry
  'SpeedBoat': 2,        // Common - recreational water sports
  'Yacht': 1,            // Less common - luxury vessels
  'PatrolBoat': 0.8      // Rare but visible - official/security vessels
};

/**
 * Utility function for weighted random selection
 */
function selectWeightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have the same length');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;

  let currentWeight = 0;
  for (let i = 0; i < items.length; i++) {
    currentWeight += weights[i];
    if (randomValue <= currentWeight) {
      return items[i];
    }
  }

  // Fallback to last item (should never reach here with valid weights)
  return items[items.length - 1];
}


class Environment {
  birds!: Birds;
  hg!: HangGlider;
  thermals: Thermal[] = [];
  cloudInstances: Clouds[] = [];
  private componentRegistry: ComponentRegistry = new ComponentRegistry();
  private boatGroupCreator: BoatGroupCreator;
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boatGroupCreator = new BoatGroupCreator(scene, this.componentRegistry);
  }

  updateWrapSpeed(wrapSpeed: number) {
    this.birds && this.birds.updateWrapSpeed(wrapSpeed);
    this.hg && this.hg.updateWrapSpeed(wrapSpeed);
  }

  async addBirds(path: THREE.Vector3[], gui?: any) {
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

  async addHangGlider(path: THREE.Vector3[], gui?: any) {
    this.hg = new HangGlider();
    const hgMesh = await this.hg.load(path, gui);
    this.scene.add(hgMesh);
  }

  async addBoats(water: THREE.Mesh, options?: {
    randomize?: boolean;
    types?: string[];
    weights?: BoatTypeWeights;
    selectionMode?: 'uniform' | 'weighted';
  }) {
    const {
      randomize = true,
      types = ['SmallSailBoat', 'FishingBoat', 'Yacht', 'SpeedBoat', 'PatrolBoat'],
      weights = DEFAULT_BOAT_WEIGHTS,
      selectionMode = 'weighted'
    } = options || {};

    // Create boats for first area (marina/harbor - more variety)
    const group1OfBoats = await this.boatGroupCreator.createRecreationalBoats(water, new THREE.Vector3(7879, 0, -5445), 8, 'random');

    // Create boats for second area (open water - different distribution)
    const group2OfBoats = await this.boatGroupCreator.createRecreationalBoats(water, new THREE.Vector3(8279, 0, -6455), 7, 'random');

    // Fix movement origins for all boats after positioning
    this.updateAllBoatMovementOrigins();
  }


  // Convenience method to add a patrol boat
  async addPatrolBoat(water: THREE.Mesh, position?: THREE.Vector3) {
    const boat = new PatrolBoat({
      radius: 400,
      speed: 0.15,
      floatingScale: 0.8,
    });
    const boatMesh = await this.componentRegistry.register(boat, 'patrolboat');
    const scale = 2.5;
    boatMesh.scale.set(scale, scale, scale);

    // Scale multiplier is handled automatically by the base component

    // Position the boat
    if (position) {
      boatMesh.position.copy(position);
    } else {
      // Default position near the first boat area
      boatMesh.position.set(7879 + 200, 50, -5445 + 200);
    }

    // Random initial rotation
    boatMesh.rotation.y = Math.random() * Math.PI * 2;

    this.scene.add(boatMesh);

    console.log('Added PatrolBoat at position:', boatMesh.position);
    return boat;
  }


  // Convenience methods for backward compatibility
  async addMixedBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false }); // Cycles through types in order
  }

  async addRandomBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: true });
  }

  async addOnlyFishingBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false, types: ['FishingBoat'] });
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
    const meshes = await this.boatGroupCreator.createRecreationalBoats(water, center, count, formation);
    this.updateAllBoatMovementOrigins();
    return meshes;
  }

  async addHouses(terrain: THREE.Mesh) {
    const house = await this.componentRegistry.register(new House({ type: HouseType.Medium }), 'house_medium');
    const house2 = await this.componentRegistry.register(new House({ type: HouseType.Small }), 'house_small');

    addMeshAroundArea(
      [house2, house],
      new THREE.Vector3(6879, 0, -545),
      20,
      terrain,
      this.scene,
      70,
      9
    );
    addMeshAroundArea(
      // famara
      [house, house2],
      new THREE.Vector3(6279, 0, -3155),
      40,
      terrain,
      this.scene,
      40,
      10
    );
    addMeshAroundArea(
      // noruegos
      [house, house2],
      new THREE.Vector3(7827, 0, -3460),
      10,
      terrain,
      this.scene,
      20,
      11
    );
    addMeshAroundArea(
      // tenesar
      [house, house2],
      new THREE.Vector3(-5200, 0, -480),
      10,
      terrain,
      this.scene,
      40,
      9
    );
    addMeshAroundArea(
      // teguise
      [house],
      new THREE.Vector3(5600, 0, 705),
      50,
      terrain,
      this.scene,
      70,
      7
    );
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
      if (component && typeof (component as any).updateMovementOrigin === 'function') {
        (component as any).updateMovementOrigin();
        console.log(`Updated movement origin for component: ${id}`);
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
      if (thermal && typeof (thermal as any).dispose === 'function') {
        (thermal as any).dispose();
      }
    });
    this.thermals.length = 0;

    this.cloudInstances.forEach(cloud => {
      if (cloud && typeof (cloud as any).dispose === 'function') {
        (cloud as any).dispose();
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
