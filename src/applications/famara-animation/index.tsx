import * as THREE from 'three';
import Environment, {
  LANZAROTE_TOWNS,
  TOWN_TEGUISE_TOP,
  TOWN_FAMARA,
  TOWN_NORUEGOS,
  TOWN_TEGUISE,
  TOWN_LA_CALETA,
} from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import { CameraTargetController, CameraMode } from '../../foundation/systems/scene/CameraTargetController';
import { createCameraTargetUI } from '../../foundation/components/ui/CameraTargetUI';
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
  SHOW_CAMERA_TARGET_UI,
  ANIMATION_DURATION_MS,
  birdPath,
} from './config';
import {
  loadParagliders,
  loadHangglider,
  loadCessna,
  loadHercules,
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
  private cessnaSmokeTrail: any | undefined;
  private herculesSmokeTrail: any | undefined;
  private targetController: CameraTargetController | null = null;

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
      // Set camera to initial animation position FIRST to avoid jarring transition
      const { camera, controls, scene, renderer } = options;
      const initialCameraPosition = new THREE.Vector3(-2000, 2200, 5000);
      camera.position.copy(initialCameraPosition);
      const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();
      camera.lookAt(pgPos);
      if (controls) {
        controls.target.copy(pgPos);
        controls.update();
      }

      // Apply theme and fog BEFORE loading environment to ensure visual consistency
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Set fog early to avoid visual pop-in
      scene.fog = new THREE.Fog(
        0x87CEEB, // Sky blue color
        3000,     // Start fog closer for more atmosphere
        12000     // End fog sooner for denser effect
      );

      // Initialize core systems from DemoBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from DemoBase
      await this.initializeEnvironment(options);

      const { terrain, water } = options;

      // Hide canvas during loading to prevent visual pop-in
      const canvas = renderer.domElement;
      const originalOpacity = canvas.style.opacity;
      canvas.style.opacity = '0';

      // Render once with theme/fog applied for terrain height calculations
      renderer.render(scene, camera);

      // Load voxel paragliders with proper tracking
      const paragliderResults = await loadParagliders(
        scene,
        paraglidersVoxel,
        this.handleError.bind(this),
        ANIMATION_DURATION_MS
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
          this.cessnaSmokeTrail = cessnaResult.smokeTrail;
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
          this.herculesSmokeTrail = herculesResult.smokeTrail;
        }
      }

      // Set up environment using theme
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0.7);

      // Add environment elements using theme
      await this.environment.addCloudsFromTheme(thermals, theme);
      // this.environment.addTrees(terrain);

      // Create Lanzarote towns using the predefined configuration
      await this.environment.addTownsFromConfig(LANZAROTE_TOWNS, terrain);

      // Create individual roads connecting each pair of towns
      // Roads stop ~200 units before town centers to avoid passing through houses
      const roadOffset = 200;

      // Road 1: Teguise top to Famara
      const road1 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_TEGUISE_TOP.x, 0, TOWN_TEGUISE_TOP.z - roadOffset),
          new THREE.Vector3(TOWN_FAMARA.x, 0, TOWN_FAMARA.z + roadOffset),
        ],
        terrain,
        width: 8,
        segments: 50,
        roadColor: '#f2f2f2',
        showCenterLine: true,
        showEdgeLines: true,
        heightOffset: 5,
        opacity: 0.2,
        transparent: true
      });

      // Road 2: Famara to Noruegos (via intermediate point)
      const road2 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_FAMARA.x + roadOffset, 0, TOWN_FAMARA.z),
          new THREE.Vector3(6705.5, 0, -3263.7), // Intermediate point
          new THREE.Vector3(TOWN_NORUEGOS.x - roadOffset, 0, TOWN_NORUEGOS.z),
        ],
        terrain,
        width: 8,
        segments: 80,
        roadColor: '#f2f2f2',
        showCenterLine: true,
        showEdgeLines: true,
        heightOffset: 5,
        opacity: 0.2,
        transparent: true
      });

      // Road 3: Noruegos to Teguise
      const road3 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_NORUEGOS.x, 0, TOWN_NORUEGOS.z + roadOffset),
          new THREE.Vector3(TOWN_TEGUISE.x + roadOffset, 0, TOWN_TEGUISE.z),
        ],
        terrain,
        width: 8,
        segments: 50,
        roadColor: '#f2f2f2',
        showCenterLine: true,
        showEdgeLines: true,
        heightOffset: 5,
        opacity: 0.2,
        transparent: true
      });

      // Road 4: La Caleta to Famara
      const road4 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_LA_CALETA.x + roadOffset, 0, TOWN_LA_CALETA.z),
          new THREE.Vector3(TOWN_FAMARA.x - roadOffset, 0, TOWN_FAMARA.z),
        ],
        terrain,
        width: 8,
        segments: 60,
        roadColor: '#f2f2f2',
        showCenterLine: true,
        showEdgeLines: true,
        heightOffset: 5,
        opacity: 0.2,
        transparent: true
      });

      // Load and add all roads to scene
      const [roadMesh1, roadMesh2, roadMesh3, roadMesh4] = await Promise.all([
        road1.load(),
        road2.load(),
        road3.load(),
        road4.load(),
      ]);

      scene.add(roadMesh1);
      scene.add(roadMesh2);
      scene.add(roadMesh3);
      scene.add(roadMesh4);
      logger.info('✅ 4 roads connecting neighborhoods created');

      this.environment.addRandomBoats(water); // Use randomized boat types for variety

      // Make environment available for theme switching
      options.environment = this.environment;

      await this.environment.addBirds(birdPath);

      // Setup Camera Target Controller if enabled
      if (SHOW_CAMERA_TARGET_UI) {
        this.targetController = new CameraTargetController(
          camera.fov,
          (camera as THREE.PerspectiveCamera).aspect,
          camera.near,
          camera.far
        );
        this.targetController.position.copy(camera.position);
        this.targetController.rotation.copy(camera.rotation);

        // Set to Static mode by default
        this.targetController.setMode(CameraMode.Static);

        // Add all flying vehicles as targets
        logger.info(`🎯 Adding ${this.paragliderMeshes.length} paraglider(s) to camera targets`);
        if (this.paragliderMeshes.length > 0) {
          this.paragliderMeshes.forEach((mesh, index) => {
            this.targetController?.addTarget(mesh, `🪂 Paraglider ${index + 1}`);
            logger.info(`✅ Added Paraglider ${index + 1} as camera target`);
          });
        }
        if (this.cessnaMesh) {
          this.targetController.addTarget(this.cessnaMesh, '✈️ Cessna');
        }
        if (this.herculesMesh) {
          this.targetController.addTarget(this.herculesMesh, '✈️ Hercules');
        }
        if (this.hanggliderMesh) {
          this.targetController.addTarget(this.hanggliderMesh, '🪂 Hangglider');
        }

        // Create UI for camera controls
        createCameraTargetUI(this.targetController, controls);
      }

      // Setup camera animation sequence
      this.setupCameraAnimation(camera, controls, renderer, scene);

      // Restore canvas visibility after everything is loaded
      canvas.style.opacity = originalOpacity || '1';

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
    let lastTime = Date.now();

    const animate = () => {
      try {
        // Calculate deltaTime
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        // Update performance monitoring
        this.updatePerformance();

        // Update Camera Target Controller if enabled
        if (this.targetController) {
          this.targetController.update(deltaTime);
        }

        // Apply floating motion (only if not using camera controller)
        if (!this.targetController) {
          applyFloatingMotion(camera, startTime, this.isAnimating);
        }

        // Update controls for damping to work
        OrbitControlsHelper.update(controls);

        // Update smoke trails
        if (this.cessnaSmokeTrail && this.cessnaMesh && this.cessnaFlyingBehavior) {
          const velocity = this.cessnaFlyingBehavior.getVelocity();
          // Get engine position (front of the plane)
          const enginePos = new THREE.Vector3();
          this.cessnaMesh.getWorldPosition(enginePos);
          // Offset to engine exhaust position (behind the engine)
          const direction = new THREE.Vector3(1, 0, 0); // Forward direction
          direction.applyQuaternion(this.cessnaMesh.quaternion);
          enginePos.sub(direction.multiplyScalar(3)); // Offset behind

          this.cessnaSmokeTrail.update(deltaTime, enginePos, velocity);
        }

        if (this.herculesSmokeTrail && this.herculesMesh && this.herculesFlyingBehavior) {
          const velocity = this.herculesFlyingBehavior.getVelocity();
          const enginePos = new THREE.Vector3();
          this.herculesMesh.getWorldPosition(enginePos);
          const direction = new THREE.Vector3(1, 0, 0);
          direction.applyQuaternion(this.herculesMesh.quaternion);
          enginePos.sub(direction.multiplyScalar(5)); // Larger offset for bigger plane

          this.herculesSmokeTrail.update(deltaTime, enginePos, velocity);
        }

        // Render with appropriate camera
        // Use original camera during initial animation, then switch to controller if available
        const renderCamera = (this.isAnimating || !this.targetController) ? camera : this.targetController;
        renderer.render(scene, renderCamera);
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

    // Dispose Cessna smoke trail
    if (this.cessnaSmokeTrail) {
      this.cessnaSmokeTrail.dispose();
      this.cessnaSmokeTrail = undefined;
    }

    // Stop Hercules flying behavior
    if (this.herculesFlyingBehavior) {
      this.herculesFlyingBehavior.dispose();
      this.herculesFlyingBehavior = undefined;
    }

    // Dispose Hercules smoke trail
    if (this.herculesSmokeTrail) {
      this.herculesSmokeTrail.dispose();
      this.herculesSmokeTrail = undefined;
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
