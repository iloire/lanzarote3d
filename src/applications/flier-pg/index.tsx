import * as THREE from 'three';
import { Paraglider } from '../../foundation/components/vehicles';
import Weather, { WeatherOptions } from '../../foundation/components/physics/Weather';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { ParagliderController } from '../../foundation/controllers/ParagliderController';
import { logger } from '../../foundation/utils/logger';

const KMH_TO_MS = 3.6;

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / KMH_TO_MS,
  lclLevel: 1800,
};

/**
 * Paraglider Workshop Demo - Showcases paraglider physics simulation
 * Now using modern ParagliderController with composition-based architecture
 */
class ParagliderWorkshopApp extends WorkshopDemoBase {
  private controller?: ParagliderController;
  private mesh?: THREE.Object3D;

  constructor() {
    super({
      name: 'Paraglider Workshop',
      description: 'Workshop demo showcasing paraglider physics simulation with weather system',
      requiredComponents: ['terrain'], // This demo needs terrain for physics
      ground: {
        create: false, // Don't create ground plane, use terrain instead
      },
      lighting: {
        sunPosition: 12,
        
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, gui, controls } = options;

      // This demo needs terrain for physics, but workshop demos don't load it automatically
      // We need to load terrain if not available
      if (!options.terrain) {
        logger.warn(
          'Terrain required for paraglider physics demo - this demo may not work properly without terrain'
        );
      }

      const initialCamPos = new THREE.Vector3(6800, 870, -475);
      const initialPGPos = new THREE.Vector3(6900, 970, -475);

      const gliderOptions = {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        numeroCajones: 40,
      };
      const pilotOptions = {};
      const pgFlyable = new Paraglider({
        glider: gliderOptions,
        pilot: pilotOptions,
      });

      this.mesh = await pgFlyable.load(gui);
      const scale = 0.1;
      this.mesh.scale.set(scale, scale, scale);
      this.mesh.position.copy(initialPGPos);
      scene.add(this.mesh);

      const weather = new Weather(WEATHER_SETTINGS);
      weather.addGui(gui);

      // Create modern ParagliderController with composition
      this.controller = new ParagliderController({
        flyable: pgFlyable,
        physics: {
          glidingRatio: 9,
          trimSpeed: 35 / KMH_TO_MS,
          fullSpeedBarSpeed: 45 / KMH_TO_MS,
          bigEarsSpeed: 27 / KMH_TO_MS,
        },
        weather,
        terrain: options.terrain!, // Workshop demos should have terrain
        water: options.water!,
        thermals: [],
        trackTrajectory: true,
        antiCrashMode: false,
      });

      // Legacy camera animation - check if camera has animateTo method
      if ('animateTo' in camera && typeof (camera as any).animateTo === 'function') {
        (camera as any).animateTo(initialCamPos, initialPGPos, 200, controls);
      } else {
        // Fallback for cameras without animateTo
        camera.position.copy(initialCamPos);
        camera.lookAt(initialPGPos);
        controls.target.copy(initialPGPos);
        controls.update();
      }

      // Start the paraglider controller (uses requestAnimationFrame internally)
      this.controller.start();

      // Start animation loop with custom update function
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        if (this.mesh) {
          const lookAt = this.mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
          camera.lookAt(lookAt);
        }
      });

      this.isLoaded = true;
      logger.info(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  public override dispose(): void {
    logger.debug(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Dispose controller resources (stops requestAnimationFrame)
    if (this.controller) {
      this.controller.dispose();
      this.controller = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const paragliderWorkshopApp = new ParagliderWorkshopApp();

// Export in the expected format for the Stories system
const ParagliderWorkshop = {
  load: async (options: StoryOptions) => {
    return paragliderWorkshopApp.load(options);
  },
  dispose: () => {
    return paragliderWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return paragliderWorkshopApp.getAppInfo();
  },
};

export default ParagliderWorkshop;
