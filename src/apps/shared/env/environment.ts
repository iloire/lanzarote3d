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
import Birds from '../../../foundation/components/wildlife/Birds';
import { Hangglider as HangGlider } from '../../../foundation/components/vehicles';
import { addMeshAroundArea } from './mesh-utils';
import { generateThermalPair, ThermalGenerationOptions } from './thermal-utils';
import { CloudOptions } from '../../../foundation/components/environment';
import { Theme } from '../../../foundation/types/Theme';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { IThreeComponent } from '../../../foundation/components/base/IThreeComponent';

/**
 * Component registry for managing all Three.js component instances
 */
class ComponentRegistry {
  private components: Map<string, IThreeComponent> = new Map();
  private meshToComponentId: Map<THREE.Object3D, string> = new Map();
  private nextId: number = 0;

  /**
   * Register a component and return its mesh
   */
  async register(component: IThreeComponent, prefix: string = 'component'): Promise<THREE.Object3D> {
    const id = `${prefix}_${this.nextId++}`;
    this.components.set(id, component);

    const mesh = await component.load();
    this.meshToComponentId.set(mesh, id);

    return mesh;
  }

  /**
   * Get component by ID
   */
  getComponent(id: string): IThreeComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Get component by mesh
   */
  getComponentByMesh(mesh: THREE.Object3D): IThreeComponent | undefined {
    const id = this.meshToComponentId.get(mesh);
    return id ? this.components.get(id) : undefined;
  }

  /**
   * Get all components of a specific type
   */
  getComponentsByType<T extends IThreeComponent>(type: new (...args: any[]) => T): T[] {
    return Array.from(this.components.values())
      .filter((component): component is T => component instanceof type);
  }

  /**
   * Update all registered components
   */
  update(deltaTime: number): void {
    this.components.forEach(component => {
      if (component.update) {
        component.update(deltaTime);
      }
    });
  }

  /**
   * Dispose all components and clear registry
   */
  dispose(): void {
    this.components.forEach(component => {
      component.dispose();
    });
    this.components.clear();
    this.meshToComponentId.clear();
  }

  /**
   * Get statistics about registered components
   */
  getStats(): { totalComponents: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};

    this.components.forEach(component => {
      const typeName = component.metadata.name;
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    return {
      totalComponents: this.components.size,
      byType
    };
  }
}

class Environment {
  birds!: Birds;
  hg!: HangGlider;
  thermals: Thermal[] = [];
  cloudInstances: Clouds[] = [];
  private componentRegistry: ComponentRegistry = new ComponentRegistry();
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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

  async addBoats(water: THREE.Mesh, options?: { randomize?: boolean; types?: string[] }) {
    const { randomize = true, types = ['SmallSailBoat', 'FishingBoat', 'Yacht', 'SpeedBoat'] } = options || {};

    // Create boats for first area
    const boats1 = await this.createBoatVariety(5, { randomize, types });
    addMeshAroundArea(boats1, new THREE.Vector3(7879, 0, -5445), 4, water, this.scene);

    // Create boats for second area
    const boats2 = await this.createBoatVariety(4, { randomize, types });
    addMeshAroundArea(boats2, new THREE.Vector3(8279, 0, -6455), 3, water, this.scene);
  }

  private async createBoatVariety(count: number, options: { randomize: boolean; types: string[] }): Promise<THREE.Object3D[]> {
    const { randomize, types } = options;
    const boats: THREE.Object3D[] = [];

    for (let i = 0; i < count; i++) {
      let boatType: string;

      if (randomize) {
        // Pick a random boat type
        boatType = types[Math.floor(Math.random() * types.length)];
      } else {
        // Cycle through types in order
        boatType = types[i % types.length];
      }

      const boat = await this.createBoatOfType(boatType);
      if (boat) {
        boats.push(boat);
      }
    }

    return boats;
  }

  private async createBoatOfType(type: string): Promise<THREE.Object3D | null> {
    let boat: any; // Keep as any since boat classes have their own load() methods
    let boatMesh: THREE.Object3D;
    let scale = 3; // Default scale

    switch (type) {
      case 'SmallSailBoat':
        boat = new SmallSailBoat();
        boatMesh = await this.componentRegistry.register(boat, 'smallsailboat');
        scale = 3;
        break;
      case 'FishingBoat':
        boat = new FishingBoat();
        boatMesh = await this.componentRegistry.register(boat, 'fishingboat');
        scale = 2.5; // Fishing boats are already larger
        break;
      case 'Yacht':
        boat = new Yacht();
        boatMesh = await this.componentRegistry.register(boat, 'yacht');
        scale = 2; // Yachts are already quite large
        break;
      case 'SpeedBoat':
        boat = new SpeedBoat();
        boatMesh = await this.componentRegistry.register(boat, 'speedboat');
        scale = 2.8;
        break;
      case 'PatrolBoat':
        boat = new PatrolBoat({
          radius: 300,  // Larger movement radius
          speed: 0.2,   // Slower, more realistic speed
        });
        boatMesh = await this.componentRegistry.register(boat, 'patrolboat');
        scale = 2.5;
        break;
      default:
        console.warn(`Unknown boat type: ${type}`);
        // Fallback to SmallSailBoat
        boat = new SmallSailBoat();
        boatMesh = await this.componentRegistry.register(boat, 'smallsailboat');
        scale = 3;
    }

    // Apply consistent scaling
    boatMesh.scale.set(scale, scale, scale);

    // Update floating animation scale multiplier to match boat scale
    if (boat && typeof boat.setScaleMultiplier === 'function') {
      boat.setScaleMultiplier(scale);
    }

    // Add some random rotation for variety
    boatMesh.rotation.y = Math.random() * Math.PI * 2;

    // Component is now managed by registry - no need to store separately

    return boatMesh;
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

    // Update floating animation scale to match boat scale
    if (boat && typeof boat.setScaleMultiplier === 'function') {
      boat.setScaleMultiplier(scale);
    }

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

  // Convenience methods for specific boat configurations
  async addRandomBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: true });
  }

  async addMixedBoats(water: THREE.Mesh) {
    await this.addBoats(water, { randomize: false }); // Cycles through types in order
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
