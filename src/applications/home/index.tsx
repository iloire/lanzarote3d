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
import { LevelOfDetail } from '../../foundation/types/lod';
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
import { createNavigationBoxes } from './NavigationBoxes';

/**
 * Home App - Landing page with navigation to paragliding services
 * Based on famara-animation with added navigation UI
 */
class HomeApp extends TerrainBase {
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
  private cleanupNavigationBoxes: (() => void) | null = null;

  constructor() {
    const appConfig = getAppConfig('home');
    if (!appConfig) {
      throw new Error('Home app not found in registry');
    }
    super({
      name: appConfig.name,
      description: appConfig.description,
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
      },
      performance: {
        monitoring: true,
        logIntervalMs: 12000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, controls, scene, renderer } = options;
      const initialCameraPosition = new THREE.Vector3(-2000, 2200, 5000);
      camera.position.copy(initialCameraPosition);
      const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();
      camera.lookAt(pgPos);
      if (controls) {
        controls.target.copy(pgPos);
        controls.update();
      }

      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { terrain, water } = options;

      const canvas = renderer.domElement;
      const originalOpacity = canvas.style.opacity;
      canvas.style.opacity = '0';

      renderer.render(scene, camera);

      const paragliderResults = await loadParagliders(
        scene,
        paraglidersVoxel,
        this.handleError.bind(this),
        ANIMATION_DURATION_MS
      );
      this.paragliderMeshes = paragliderResults.map((r) => r.mesh);

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

      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0.7);

      await this.environment.addCloudsFromTheme(thermals, theme);

      await this.environment.addTownsFromConfig(LANZAROTE_TOWNS, terrain, true, LevelOfDetail.ULTRA_LOW);

      const roadOffset = 200;

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

      const road2 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_FAMARA.x + roadOffset, 0, TOWN_FAMARA.z),
          new THREE.Vector3(6705.5, 0, -3263.7),
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

      const road3 = new ProceduralRoad({
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

      const road4 = new ProceduralRoad({
        controlPoints: [
          new THREE.Vector3(TOWN_TEGUISE.x, 0, TOWN_TEGUISE.z - roadOffset),
          new THREE.Vector3(TOWN_TEGUISE_TOP.x, 0, TOWN_TEGUISE_TOP.z + roadOffset),
        ],
        terrain,
        width: 8,
        segments: 40,
        roadColor: '#f2f2f2',
        showCenterLine: true,
        showEdgeLines: true,
        heightOffset: 5,
        opacity: 0.2,
        transparent: true
      });

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
      logger.info('4 roads connecting neighborhoods created');

      this.environment.addRandomBoats(water);

      options.environment = this.environment;

      await this.environment.addBirds(birdPath);

      if (SHOW_CAMERA_TARGET_UI) {
        this.targetController = new CameraTargetController(
          camera.fov,
          (camera as THREE.PerspectiveCamera).aspect,
          camera.near,
          camera.far
        );
        this.targetController.position.copy(camera.position);
        this.targetController.rotation.copy(camera.rotation);

        this.targetController.setMode(CameraMode.Static);

        logger.info(`Adding ${this.paragliderMeshes.length} paraglider(s) to camera targets`);
        if (this.paragliderMeshes.length > 0) {
          this.paragliderMeshes.forEach((mesh, index) => {
            this.targetController?.addTarget(mesh, `Paraglider ${index + 1}`);
            logger.info(`Added Paraglider ${index + 1} as camera target`);
          });
        }
        if (this.cessnaMesh) {
          this.targetController.addTarget(this.cessnaMesh, 'Cessna');
        }
        if (this.herculesMesh) {
          this.targetController.addTarget(this.herculesMesh, 'Hercules');
        }
        if (this.hanggliderMesh) {
          this.targetController.addTarget(this.hanggliderMesh, 'Hangglider');
        }

        createCameraTargetUI(this.targetController, controls);
      }

      // Setup navigation boxes UI
      this.setupNavigationUI();

      this.setupCameraAnimation(camera, controls, renderer, scene);

      canvas.style.opacity = originalOpacity || '1';

      this.isLoaded = true;
      const vehicleCount = this.paragliderMeshes.length +
        (this.hanggliderMesh ? 1 : 0) +
        (this.cessnaMesh ? 1 : 0) +
        (this.herculesMesh ? 1 : 0);
      logger.info(
        `${this.config.name} loaded successfully with ${vehicleCount} flying vehicles`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupNavigationUI(): void {
    // Create container for navigation boxes
    let container = document.getElementById('navigation-boxes');
    if (!container) {
      container = document.createElement('div');
      container.id = 'navigation-boxes';
      document.body.appendChild(container);
    }

    // Mount the React component
    this.cleanupNavigationBoxes = createNavigationBoxes(container);
    logger.info('Navigation boxes UI created');
  }

  private setupCameraAnimation(
    camera: THREE.Camera,
    controls: OrbitControls,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ): void {
    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();

    this.startAnimationLoop(renderer, scene, camera, controls);

    setupCameraAnimation(camera, controls, {
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
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        this.updatePerformance();

        if (this.targetController) {
          this.targetController.update(deltaTime);
        }

        if (!this.targetController) {
          applyFloatingMotion(camera, startTime, this.isAnimating);
        }

        OrbitControlsHelper.update(controls);

        if (this.environment && this.environment.birds) {
          this.environment.birds.update(deltaTime);
        }

        if (this.cessnaSmokeTrail && this.cessnaMesh && this.cessnaFlyingBehavior) {
          const velocity = this.cessnaFlyingBehavior.getVelocity();
          const enginePos = new THREE.Vector3();
          this.cessnaMesh.getWorldPosition(enginePos);
          const direction = new THREE.Vector3(1, 0, 0);
          direction.applyQuaternion(this.cessnaMesh.quaternion);
          enginePos.sub(direction.multiplyScalar(3));

          this.cessnaSmokeTrail.update(deltaTime, enginePos, velocity);
        }

        if (this.herculesSmokeTrail && this.herculesMesh && this.herculesFlyingBehavior) {
          const velocity = this.herculesFlyingBehavior.getVelocity();
          const enginePos = new THREE.Vector3();
          this.herculesMesh.getWorldPosition(enginePos);
          const direction = new THREE.Vector3(1, 0, 0);
          direction.applyQuaternion(this.herculesMesh.quaternion);
          enginePos.sub(direction.multiplyScalar(5));

          this.herculesSmokeTrail.update(deltaTime, enginePos, velocity);
        }

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
    logger.debug(`Disposing ${this.config.name}`);

    // Cleanup navigation boxes UI
    if (this.cleanupNavigationBoxes) {
      this.cleanupNavigationBoxes();
      this.cleanupNavigationBoxes = null;
    }

    // Remove the navigation container from DOM
    const container = document.getElementById('navigation-boxes');
    if (container) {
      container.remove();
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.flyingBehavior) {
      this.flyingBehavior.dispose();
      this.flyingBehavior = undefined;
    }

    if (this.hanggliderFlyingBehavior) {
      this.hanggliderFlyingBehavior.dispose();
      this.hanggliderFlyingBehavior = undefined;
    }

    if (this.cessnaFlyingBehavior) {
      this.cessnaFlyingBehavior.dispose();
      this.cessnaFlyingBehavior = undefined;
    }

    if (this.cessnaSmokeTrail) {
      this.cessnaSmokeTrail.dispose();
      this.cessnaSmokeTrail = undefined;
    }

    if (this.herculesFlyingBehavior) {
      this.herculesFlyingBehavior.dispose();
      this.herculesFlyingBehavior = undefined;
    }

    if (this.herculesSmokeTrail) {
      this.herculesSmokeTrail.dispose();
      this.herculesSmokeTrail = undefined;
    }

    if (this.isAnimating) {
      this.isAnimating = false;
    }

    this.paragliderMeshes.forEach(mesh => {
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

    if (this.environment) {
      this.environment = undefined;
    }

    super.dispose();
  }
}

const homeApp = new HomeApp();

const Home = {
  load: async (options: StoryOptions) => {
    return homeApp.load(options);
  },
  dispose: () => {
    return homeApp.dispose();
  },
  getAppInfo: () => {
    return homeApp.getAppInfo();
  },
};

export default Home;
