import * as THREE from 'three';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ProceduralRoad } from '../../foundation/components/scenery';
import { logger } from '../../foundation/utils/logger';
import {
  paraglidersVoxel,
  hanggliderConfig,
  cessnaConfig,
  herculesConfig,
  SHOW_HANGGLIDER,
  SHOW_CESSNA,
  SHOW_HERCULES,
  ANIMATION_DURATION_MS,
  birdPath,
} from './config';
import {
  loadParagliders,
  loadHangglider,
  loadCessna,
  loadHercules,
  VehicleLoadResult,
} from './vehicleLoader';
import {
  setupCameraAnimation,
  applyFloatingMotion,
} from './cameraAnimation';

/**
 * Animation Demo - Restored original animation with voxel paraglider
 * Third app converted to use AppBase architecture
 */
class AnimationApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private hanggliderMesh: THREE.Object3D | undefined;
  private cessnaMesh: THREE.Object3D | undefined;
  private herculesMesh: THREE.Object3D | undefined;
  private isAnimating: boolean = false;
  private flyingBehavior: FlyingBehavior | undefined;
  private hanggliderFlyingBehavior: FlyingBehavior | undefined;
  private cessnaFlyingBehavior: FlyingBehavior | undefined;
  private herculesFlyingBehavior: FlyingBehavior | undefined;

  constructor() {
    const appConfig = getAppConfig('animation');
    if (!appConfig) {
      throw new Error('Animation app not found in registry');
    }
    super({
      // Use metadata from app registry
      name: appConfig.name,
      description: appConfig.description,
      // App-specific configuration
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: true, // Fog handled by theme system
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 12000, // Log performance every 12 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from DemoBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from DemoBase
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      // Apply theme to scene
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Increase fog for more atmospheric effect
      scene.fog = new THREE.Fog(
        0x87CEEB, // Sky blue color
        3000,     // Start fog closer for more atmosphere
        12000     // End fog sooner for denser effect
      );

      // Load voxel paragliders with proper tracking
      const paragliderResults = await loadParagliders(
        scene,
        paraglidersVoxel,
        this.handleError.bind(this)
      );
      this.paragliderMeshes = paragliderResults.map((r) => r.mesh);

      // Load hangglider if enabled
      if (SHOW_HANGGLIDER) {
        const hanggliderResult = await loadHangglider(
          scene,
          hanggliderConfig,
          ANIMATION_DURATION_MS,
          this.handleError.bind(this)
        );
        if (hanggliderResult) {
          this.hanggliderMesh = hanggliderResult.mesh;
          this.hanggliderFlyingBehavior = hanggliderResult.flyingBehavior;
        }
      }

      // Load Cessna if enabled
      if (SHOW_CESSNA) {
        const cessnaResult = await loadCessna(
          scene,
          cessnaConfig,
          ANIMATION_DURATION_MS,
          this.handleError.bind(this)
        );
        if (cessnaResult) {
          this.cessnaMesh = cessnaResult.mesh;
          this.cessnaFlyingBehavior = cessnaResult.flyingBehavior;
        }
      }

      // Load Hercules if enabled
      if (SHOW_HERCULES) {
        const herculesResult = await loadHercules(
          scene,
          herculesConfig,
          ANIMATION_DURATION_MS,
          this.handleError.bind(this)
        );
        if (herculesResult) {
          this.herculesMesh = herculesResult.mesh;
          this.herculesFlyingBehavior = herculesResult.flyingBehavior;
        }
      }

      // must render before adding env
      renderer.render(scene, camera);

      // Set up environment using theme
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0.7);

      // Add environment elements using theme
      await this.environment.addCloudsFromTheme(thermals, theme);
      // this.environment.addTrees(terrain);
      const housePositions = await this.environment.addHouses(terrain);

      // Create road connecting the neighborhoods
      if (housePositions.length >= 2) {
        // Add intermediate waypoints for better road routing
        const roadControlPoints = [
          housePositions[0], // Suburban area near paraglider
          housePositions[1], // Famara coastal village
          new THREE.Vector3(6705.5, 0, -3263.7), // Intermediate point 1
          housePositions[2], // Noruegos rural settlement
          housePositions[3], // Teguise town center
        ];

        const road = new ProceduralRoad({
          controlPoints: roadControlPoints,
          terrain,
          width: 8,
          segments: 150,
          roadColor: '#f2f2f2',
          showCenterLine: true,
          showEdgeLines: true,
          heightOffset: 5,
          opacity: 0.2,
          transparent: true
        });

        const roadMesh = await road.load();
        scene.add(roadMesh);
        logger.info('✅ Road connecting neighborhoods created');
      }

      this.environment.addRandomBoats(water); // Use randomized boat types for variety

      // Make environment available for theme switching
      options.environment = this.environment;

      await this.environment.addBirds(birdPath);

      // Setup camera animation sequence
      this.setupCameraAnimation(camera, controls, renderer, scene);

      this.isLoaded = true;
      const vehicleCount = this.paragliderMeshes.length +
        (this.hanggliderMesh ? 1 : 0) +
        (this.cessnaMesh ? 1 : 0) +
        (this.herculesMesh ? 1 : 0);
      logger.info(
        `✅ ${this.config.name} loaded successfully with ${vehicleCount} flying vehicles`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupCameraAnimation(
    camera: THREE.Camera,
    controls: OrbitControls,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ): void {
    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera, controls);

    // Setup and execute camera animation
    const animationState = setupCameraAnimation(camera, controls, {
      targetPosition: pgPos,
      animationDurationMs: ANIMATION_DURATION_MS,
      onAnimationStart: () => {
        this.isAnimating = true;
      },
      onAnimationComplete: () => {
        this.isAnimating = false;
      },
    });
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls
  ): void {
    const startTime = Date.now();

    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Apply floating motion
        applyFloatingMotion(camera, startTime, this.isAnimating);

        // Update controls for damping to work
        OrbitControlsHelper.update(controls);

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  public override dispose(): void {
    logger.debug(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Stop flying behavior
    if (this.flyingBehavior) {
      this.flyingBehavior.dispose();
      this.flyingBehavior = undefined;
    }

    // Stop hangglider flying behavior
    if (this.hanggliderFlyingBehavior) {
      this.hanggliderFlyingBehavior.dispose();
      this.hanggliderFlyingBehavior = undefined;
    }

    // Stop Cessna flying behavior
    if (this.cessnaFlyingBehavior) {
      this.cessnaFlyingBehavior.dispose();
      this.cessnaFlyingBehavior = undefined;
    }

    // Stop Hercules flying behavior
    if (this.herculesFlyingBehavior) {
      this.herculesFlyingBehavior.dispose();
      this.herculesFlyingBehavior = undefined;
    }

    // Stop animator if running
    if (this.isAnimating) {
      this.isAnimating = false;
    }

    // Dispose paraglider meshes
    this.paragliderMeshes.forEach(mesh => {
      // Dispose geometry and materials if they exist
      mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.paragliderMeshes.length = 0;

    // Dispose hangglider mesh
    if (this.hanggliderMesh) {
      this.hanggliderMesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.hanggliderMesh = undefined;
    }

    // Dispose Cessna mesh
    if (this.cessnaMesh) {
      this.cessnaMesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.cessnaMesh = undefined;
    }

    // Dispose Hercules mesh
    if (this.herculesMesh) {
      this.herculesMesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.herculesMesh = undefined;
    }

    // Dispose environment resources
    if (this.environment) {
      this.environment = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const animationApp = new AnimationApp();

// Export in the expected format for the Stories system
const Animation = {
  load: async (options: StoryOptions) => {
    return animationApp.load(options);
  },
  dispose: () => {
    return animationApp.dispose();
  },
  getAppInfo: () => {
    return animationApp.getAppInfo();
  },
};

export default Animation;
