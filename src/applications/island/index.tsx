import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { TerrainBase } from '../../shared/TerrainBase';
import Environment from '../../shared/env/environment';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Island Workshop Demo - Simple island view demo with full terrain
 */
class IslandWorkshopApp extends TerrainBase {
  private animationId: number | undefined;
  private environment: Environment | null = null;
  private showCars: boolean = false; // Flag to control car visibility, disabled by default

  constructor() {
    super({
      name: 'Island Workshop',
      description: 'Simple workshop demo showcasing island environment view',
      requiredComponents: ['sky', 'water', 'terrain'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      await this.initializeEnvironment(options);
      const { camera, scene, renderer, controls } = options;

      // Initialize environment for car management
      this.environment = new Environment(scene);

      // Add some cars to drive around the island if terrain is available and cars are enabled
      if (options.terrain && this.showCars) {
        await this.addCarsToIsland(options.terrain);
      }

      // Set camera to view the island from a distance
      camera.position.set(-21200, 2500, 23000);

      // Enable orbit controls for navigation with boundaries
      controls.enabled = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;

      // Set control boundaries appropriate for the 20000x scaled island
      controls.minDistance = 500; // Minimum zoom to prevent going too close
      controls.maxDistance = 50000; // Maximum zoom out to keep island visible

      // Pan limits to keep camera focused on island area
      controls.maxPolarAngle = Math.PI * 0.8; // Prevent going too far below horizon
      controls.minPolarAngle = Math.PI * 0.1; // Prevent going too high above

      // If sky is available, set controls target to sun position, otherwise center on island
      if (options.sky) {
        controls.target = options.sky.getSunPosition();
      } else {
        controls.target.set(0, 0, 0); // Center on island
      }
      controls.update();

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      const carStatus = this.showCars ? 'with cars enabled' : 'with cars disabled';
      console.log(`✅ ${this.config.name} loaded successfully ${carStatus}`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Enable or disable cars in the island demo
   */
  public setCarsEnabled(enabled: boolean): void {
    this.showCars = enabled;
    console.log(`🚗 Cars ${enabled ? 'enabled' : 'disabled'} for ${this.config.name}`);
  }

  /**
   * Add cars to drive around the island terrain
   */
  private async addCarsToIsland(terrain: THREE.Mesh): Promise<void> {
    if (!this.environment) return;

    try {
      // The island is scaled 20000x, so we need larger cars and better positioning
      // Camera is at (-21200, 2500, 23000) looking at the island

      // Import the MovementPattern enum properly
      const { MovementPattern } = await import(
        '../../foundation/systems/behaviors/MovingBehavior'
      );
      const { TerrainDrivingMode } = await import(
        '../../foundation/systems/behaviors/TerrainFollowingBehavior'
      );

      // Create custom car configs with smaller scales (10% of previous size)
      const largeCars = [
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.CIRCULAR,
          speed: 0.2,
          radius: 2000,
          scale: 5, // 50 * 0.1 = 5
          bodyColor: '#FF0000',
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const,
        },
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.LINEAR,
          speed: 0.15,
          radius: 1500,
          scale: 5, // 50 * 0.1 = 5
          bodyColor: '#00FF00',
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const,
        },
        {
          type: 'AutonomousCar' as const,
          enableMovement: true,
          speed: 0.1,
          scale: 6, // 60 * 0.1 = 6
          bodyColor: '#0000FF',
          drivingMode: TerrainDrivingMode.EXPLORATION,
          explorationRadius: 3000,
        },
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.RANDOM_DRIFT,
          speed: 0.12,
          radius: 1800,
          scale: 4.5, // 45 * 0.1 = 4.5
          bodyColor: '#FFFF00',
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const,
        },
      ];

      // Area 1: Visible area closer to camera view
      await this.environment.createCarGroup(terrain, largeCars, {
        center: new THREE.Vector3(-5000, 0, 5000), // Closer to camera view
        formation: 'random',
        spacing: 800,
        groupRadius: 2000,
        terrain,
      });

      // Area 2: Another visible area
      const moreCars = [
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.CIRCULAR,
          speed: 0.14,
          radius: 2500,
          scale: 1,
          bodyColor: '#FF00FF',
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const,
        },
        {
          type: 'AutonomousCar' as const,
          enableMovement: true,
          speed: 0.08,
          scale: 1,
          bodyColor: '#00FFFF',
          drivingMode: TerrainDrivingMode.PATROL,
          explorationRadius: 2000,
        },
      ];

      await this.environment.createCarGroup(terrain, moreCars, {
        center: new THREE.Vector3(3000, 0, -2000),
        formation: 'circle',
        spacing: 1000,
        groupRadius: 1500,
        terrain,
      });

      console.log('✅ Large-scale cars added to island terrain for visibility');

      // Debug: Check if cars are moving after a delay
      setTimeout(() => {
        if (this.environment) {
          const stats = this.environment.getComponentStats();
          console.log('🚗 Car components:', stats);
          console.log('🎯 Environment should be updating cars in animation loop');
        }
      }, 2000);
    } catch (error) {
      console.warn('⚠️ Failed to add cars to island:', error);
    }
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls
  ): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Update environment (cars, boats, etc.)
        if (this.environment) {
          this.environment.update(0.016); // Assuming ~60fps
        }

        // Update controls for damping
        controls.update();

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Dispose environment and all cars
    if (this.environment) {
      this.environment.dispose();
      this.environment = null;
    }

    super.dispose();
  }
}

const islandWorkshopApp = new IslandWorkshopApp();

const Island = {
  load: async (options: StoryOptions) => {
    return islandWorkshopApp.load(options);
  },
  dispose: () => {
    return islandWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return islandWorkshopApp.getAppInfo();
  },
};

export default Island;
