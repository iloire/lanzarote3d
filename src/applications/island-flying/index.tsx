import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { TerrainBase } from '../../shared/TerrainBase';
import { logger } from '../../foundation/utils/logger';
import {
  Paraglider,
  Hangglider,
  Cessna,
  Jet,
  Airliner,
} from '../../foundation/components/vehicles';
import {
  FlyingBehavior,
  FlightPattern,
} from '../../foundation/systems/behaviors/FlyingBehavior';
import { CameraTargetController, CameraMode } from '../../foundation/systems/scene/CameraTargetController';
import { createCameraTargetUI } from '../../foundation/components/ui/CameraTargetUI';

interface FlyingVehicle {
  mesh: THREE.Object3D;
  behavior: FlyingBehavior;
  type: string;
}

/**
 * Island Flying Demo - Multiple aircraft flying freely around the island
 * Features various aircraft types with autonomous FlyingBehavior
 */
class IslandFlyingApp extends TerrainBase {
  private animationId: number | undefined;
  private vehicles: FlyingVehicle[] = [];
  private targetController: CameraTargetController | null = null;

  constructor() {
    super({
      name: 'Island Flying',
      description: 'Multiple aircraft flying freely around Lanzarote island',
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
      const { camera, scene, renderer, controls, gui } = options;

      // Replace camera with CameraTargetController
      this.targetController = new CameraTargetController(
        camera.fov,
        camera.aspect,
        camera.near,
        camera.far
      );
      this.targetController.position.set(-21200, 3500, 23000);
      this.targetController.rotation.copy(camera.rotation);

      // Replace in scene
      scene.remove(camera);
      scene.add(this.targetController);

      // Update options camera reference
      options.camera = this.targetController;

      // Update controls to use new camera
      controls.object = this.targetController;
      controls.enabled = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;

      // Set control boundaries appropriate for the island scale
      controls.minDistance = 500;
      controls.maxDistance = 50000;
      controls.maxPolarAngle = Math.PI * 0.8;
      controls.minPolarAngle = Math.PI * 0.1;

      // Center on island
      if (options.sky) {
        controls.target = options.sky.getSunPosition();
      } else {
        controls.target.set(0, 0, 0);
      }
      controls.update();

      // Add flying vehicles
      await this.addFlyingVehicles(scene);

      // Add GUI controls for camera
      this.targetController.addGui(gui);

      // Create React UI for target switching
      createCameraTargetUI(this.targetController, controls, (targetIndex, mode) => {
        logger.info(`📷 Switched to target ${targetIndex} in ${mode} mode`);
      });

      // Set initial camera to follow first vehicle
      if (this.vehicles.length > 0) {
        this.targetController.switchToTarget(0, CameraMode.Follow, 0, controls);
      }

      this.startAnimationLoop(renderer, scene, controls);

      this.isLoaded = true;
      logger.info(
        `✅ ${this.config.name} loaded with ${this.vehicles.length} flying vehicles`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Add various flying vehicles with random counts (3-7 of each type)
   */
  private async addFlyingVehicles(scene: THREE.Scene): Promise<void> {
    const flightPatterns = [
      FlightPattern.CIRCULAR,
      FlightPattern.FIGURE_EIGHT,
      FlightPattern.FREE_ROAM,
    ];

    // Random count helper (3-7)
    const randomCount = () => Math.floor(Math.random() * 5) + 3;

    // Colors for variety
    const colors = [
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FFFF00',
      '#FF00FF',
      '#00FFFF',
      '#FFA500',
      '#800080',
      '#FFC0CB',
    ];

    try {
      // Add Paragliders
      const paragliderCount = randomCount();
      for (let i = 0; i < paragliderCount; i++) {
        await this.addVehicle(
          scene,
          'Paraglider',
          Paraglider,
          {
            glider: {
              wingColor: colors[i % colors.length],
              linesColor: '#333333',
              wingspan: 240,
            },
            pilot: {
              bodyColor: colors[(i + 1) % colors.length],
              scale: 15,
            },
          },
          flightPatterns[i % flightPatterns.length],
          {
            altitude: 800 + Math.random() * 400,
            radius: 2000 + Math.random() * 3000,
            speed: 3 + Math.random() * 2,
          }
        );
      }

      // Add Hanggliders
      const hanggliderCount = randomCount();
      for (let i = 0; i < hanggliderCount; i++) {
        await this.addVehicle(
          scene,
          'Hangglider',
          Hangglider,
          {
            wingColor: colors[i % colors.length],
            wingspan: 200,
            scale: 12,
          },
          flightPatterns[i % flightPatterns.length],
          {
            altitude: 700 + Math.random() * 400,
            radius: 2500 + Math.random() * 3000,
            speed: 4 + Math.random() * 2,
          }
        );
      }

      // Add Cessnas
      const cessnaCount = randomCount();
      for (let i = 0; i < cessnaCount; i++) {
        await this.addVehicle(
          scene,
          'Cessna',
          Cessna,
          {
            scale: 25,
            bodyColor: colors[i % colors.length],
          },
          flightPatterns[i % flightPatterns.length],
          {
            altitude: 1000 + Math.random() * 500,
            radius: 3000 + Math.random() * 4000,
            speed: 5 + Math.random() * 3,
          }
        );
      }

      // Add Jets
      const jetCount = randomCount();
      for (let i = 0; i < jetCount; i++) {
        await this.addVehicle(
          scene,
          'Jet',
          Jet,
          {
            scale: 30,
            bodyColor: colors[i % colors.length],
          },
          flightPatterns[i % flightPatterns.length],
          {
            altitude: 1200 + Math.random() * 600,
            radius: 4000 + Math.random() * 5000,
            speed: 8 + Math.random() * 4,
          }
        );
      }

      // Add Airliners
      const airlinerCount = randomCount();
      for (let i = 0; i < airlinerCount; i++) {
        await this.addVehicle(
          scene,
          'Airliner',
          Airliner,
          {
            scale: 40,
            bodyColor: colors[i % colors.length],
          },
          flightPatterns[i % flightPatterns.length],
          {
            altitude: 1500 + Math.random() * 800,
            radius: 5000 + Math.random() * 6000,
            speed: 10 + Math.random() * 5,
          }
        );
      }

      logger.info(
        `✈️ Added vehicles: ${paragliderCount} paragliders, ${hanggliderCount} hanggliders, ${cessnaCount} Cessnas, ${jetCount} jets, ${airlinerCount} airliners`
      );
    } catch (error) {
      logger.error('Failed to add flying vehicles:', error);
    }
  }

  /**
   * Add a single flying vehicle with FlyingBehavior
   */
  private async addVehicle(
    scene: THREE.Scene,
    type: string,
    VehicleClass: any,
    vehicleConfig: any,
    flightPattern: FlightPattern,
    flightParams: { altitude: number; radius: number; speed: number }
  ): Promise<void> {
    try {
      const vehicle = new VehicleClass(vehicleConfig);
      const loadResult = await vehicle.load();

      // Get mesh - unified approach works for all vehicle types
      // Both modern (SimpleThreeComponent) and legacy return mesh from load()
      const mesh = loadResult;

      if (mesh) {
        // Random starting position around the island
        const angle = Math.random() * Math.PI * 2;
        const distance = flightParams.radius;
        const startX = Math.cos(angle) * distance;
        const startZ = Math.sin(angle) * distance;

        mesh.position.set(startX, flightParams.altitude, startZ);
        scene.add(mesh);

        // Create flying behavior
        const behavior = new FlyingBehavior({
          pattern: flightPattern,
          speed: flightParams.speed,
          turnSpeed: 2 + Math.random() * 2,
          flightRadius: flightParams.radius,
          minHeight: flightParams.altitude - 200,
          maxHeight: flightParams.altitude + 200,
          centerPoint: new THREE.Vector3(0, 0, 0),
          autoStart: true,
        });

        behavior.attachTo(mesh);
        behavior.start();

        this.vehicles.push({ mesh, behavior, type });

        // Add to camera targets with emoji and type
        const emoji = this.getVehicleEmoji(type);
        this.targetController?.addTarget(mesh, `${emoji} ${type}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to add ${type}:`, error);
      // Re-throw to make failures visible during development
      if (error instanceof Error) {
        logger.error(`Error details: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Get emoji for vehicle type
   */
  private getVehicleEmoji(type: string): string {
    const emojis: Record<string, string> = {
      Paraglider: '🪂',
      Hangglider: '🪂',
      Cessna: '✈️',
      Jet: '✈️',
      Airliner: '✈️',
    };
    return emojis[type] || '✈️';
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    controls: any
  ): void {
    const animate = () => {
      try {
        this.updatePerformance();

        // Update camera controller
        if (this.targetController) {
          this.targetController.update(0.016);
        }

        // FlyingBehavior updates itself via its own animation loop
        // No need to manually update behaviors here

        controls.update();

        // Render with camera controller
        if (this.targetController) {
          renderer.render(scene, this.targetController);
        }

        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  public override dispose(): void {
    logger.debug(`🧹 Disposing ${this.config.name}`);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Stop all flying behaviors to prevent memory leaks
    for (const vehicle of this.vehicles) {
      vehicle.behavior.stop();
    }
    this.vehicles = [];

    // Clean up camera controller
    this.targetController = null;

    super.dispose();
  }
}

const islandFlyingApp = new IslandFlyingApp();

const IslandFlying = {
  load: async (options: StoryOptions) => {
    return islandFlyingApp.load(options);
  },
  dispose: () => {
    return islandFlyingApp.dispose();
  },
  getAppInfo: () => {
    return islandFlyingApp.getAppInfo();
  },
};

export default IslandFlying;
