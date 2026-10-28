import * as THREE from 'three';
import Environment, {
  FAMARA_GULL_FLOCKS,
  LANZAROTE_TOWNS,
  RISCO_GUIRRE_FLOCKS,
  RISCO_RAVEN_FLOCKS,
} from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import {
  CameraTargetController,
  CameraMode,
} from '../../foundation/systems/scene/CameraTargetController';
import { createCameraTargetUI } from '../../foundation/components/ui/CameraTargetUI';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createIslandRoads } from '../../shared/env/roads';
import { createLandmarks } from '../../shared/env/landmarks';
import { createFerryCrossing } from '../../shared/env/ferry';
import { LevelOfDetail } from '../../foundation/types/lod';
import { logger } from '../../foundation/utils/logger';
import {
  paraglidersVoxel,
  RIDGE_LOOP,
  hanggliderConfig,
  cessnaConfig,
  herculesConfig,
  SHOW_HANGGLIDER,
  SHOW_CESSNA,
  SHOW_HERCULES,
  SHOW_CAMERA_TARGET_UI,
  ANIMATION_DURATION_MS,
  CAMERA_FOLLOW,
  LEAD_PILOT,
  CAMERA_SWAY,
  CAMERA_ZOOM_IN,
  LA_GRACIOSA,
  isEmbedded,
} from './config';
import { loadParagliders, loadHangglider, loadCessna, loadHercules } from './vehicleLoader';
import { setupCameraAnimation, applyFloatingMotion } from './cameraAnimation';
import { BackdropSway, CameraFollow, ZoomIn } from './cameraFollow';
import { createTitleOverlay } from './TitleOverlay';
import { createPilotPicker } from './PilotPicker';
import { pilotFromSearch, searchWithPilot } from './pilotParam';
import type { ParagliderMotion } from './paragliderMotion';
import type { SmokeTrail } from '../../foundation/components/effects/SmokeTrail';
import { GuirreVisitor } from '../../foundation/components/wildlife/GuirreVisitor';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';

/**
 * Home App - Landing scene with the voxel title
 * Based on famara-animation with a title overlay
 */
class HomeApp extends TerrainBase {
  private environment: Environment | undefined;
  private guirreVisitor: GuirreVisitor | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private paragliderFlyingBehaviors: FlyingBehavior[] = [];
  private paragliderMotions: ParagliderMotion[] = [];
  private hanggliderMesh: THREE.Object3D | undefined;
  private cessnaMesh: THREE.Object3D | undefined;
  private herculesMesh: THREE.Object3D | undefined;
  private isAnimating: boolean = false;
  private hanggliderFlyingBehavior: FlyingBehavior | undefined;
  private cessnaFlyingBehavior: FlyingBehavior | undefined;
  private herculesFlyingBehavior: FlyingBehavior | undefined;
  private cessnaSmokeTrail: SmokeTrail | undefined;
  private herculesSmokeTrail: SmokeTrail | undefined;
  private targetController: CameraTargetController | null = null;
  private removeTitleOverlay: (() => void) | null = null;
  private removePilotPicker: (() => void) | null = null;
  /** Everyone the camera can follow, paragliders then the hangglider, with how each banks */
  private pilots: { mesh: THREE.Object3D; motion?: ParagliderMotion }[] = [];
  /** Which of `pilots` the camera follows */
  private leadIndex = 0;

  constructor() {
    const appConfig = getAppConfig('home');
    if (!appConfig) {
      throw new Error('Home app not found in registry');
    }
    super({
      name: appConfig.name,
      description: appConfig.description,
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, controls, scene, renderer } = options;
      const initialCameraPosition = new THREE.Vector3(-2000, 2200, 5000);
      camera.position.copy(initialCameraPosition);
      const pgPos = RIDGE_LOOP[0].clone();
      camera.lookAt(pgPos);
      if (controls) {
        controls.target.copy(pgPos);
        controls.update();
      }

      const theme = getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      await this.initializeEnvironment(options);

      const { terrain, water } = options;

      const canvas = renderer.domElement;
      const originalOpacity = canvas.style.opacity;
      canvas.style.opacity = '0';

      renderer.render(scene, camera);

      const paragliderResults = await loadParagliders(
        scene,
        paraglidersVoxel,
        this.handleError.bind(this)
      );
      this.paragliderMeshes = paragliderResults.map(r => r.mesh);
      this.paragliderFlyingBehaviors = paragliderResults.flatMap(r =>
        r.flyingBehavior ? [r.flyingBehavior] : []
      );
      this.paragliderMotions = paragliderResults.flatMap(r => (r.motion ? [r.motion] : []));
      this.pilots = paragliderResults.map(({ mesh, motion }) => ({ mesh, motion }));

      if (SHOW_HANGGLIDER) {
        const hanggliderResult = await loadHangglider(
          scene,
          hanggliderConfig,
          this.handleError.bind(this)
        );
        if (hanggliderResult) {
          this.hanggliderMesh = hanggliderResult.mesh;
          this.hanggliderFlyingBehavior = hanggliderResult.flyingBehavior;
          if (hanggliderResult.motion) this.paragliderMotions.push(hanggliderResult.motion);
          this.pilots.push({ mesh: hanggliderResult.mesh, motion: hanggliderResult.motion });
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
      await this.environment.addCloudsFromTheme(theme);

      await this.environment.addTownsFromConfig(
        LANZAROTE_TOWNS,
        terrain,
        true,
        LevelOfDetail.ULTRA_LOW
      );

      const roads = await createIslandRoads(terrain);
      roads.forEach(road => scene.add(road));
      logger.info(`${roads.length} roads connecting the Famara towns created`);

      const landmarks = createLandmarks(terrain);
      landmarks.forEach(landmark => scene.add(landmark));
      scene.add(createFerryCrossing());

      this.environment.addRandomBoats(water);

      options.environment = this.environment;

      this.environment.addGulls(FAMARA_GULL_FLOCKS);
      this.environment.addRavens(RISCO_RAVEN_FLOCKS);
      // One of the pair keeps circling; the other comes over to glide with Magne now and then
      this.environment.addGuirres(RISCO_GUIRRE_FLOCKS.map(flock => ({ ...flock, count: 1 })));
      const magne = scene.getObjectByName(`paraglider-${CharacterType.MAGNE}`);
      if (magne && RISCO_GUIRRE_FLOCKS[0]) {
        this.guirreVisitor = new GuirreVisitor(RISCO_GUIRRE_FLOCKS[0].center, magne);
        scene.add(this.guirreVisitor.mesh);
      }

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

      if (!isEmbedded()) {
        this.removeTitleOverlay = createTitleOverlay();
      }

      this.setupCameraAnimation(camera, controls, renderer, scene);

      canvas.style.opacity = originalOpacity || '1';

      const vehicleCount =
        this.paragliderMeshes.length +
        (this.hanggliderMesh ? 1 : 0) +
        (this.cessnaMesh ? 1 : 0) +
        (this.herculesMesh ? 1 : 0);
      logger.info(`${this.config.name} loaded successfully with ${vehicleCount} flying vehicles`);
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
    // ?pilot= picks who the fly-in lands on, by number or by the rig's name (e.g. bernt)
    const names = this.pilots.map(({ mesh }) => mesh.name.replace(/^paraglider-/, ''));
    this.leadIndex = pilotFromSearch(
      window.location.search,
      names,
      Math.max(0, names.indexOf(LEAD_PILOT))
    );
    const lead = this.pilots[this.leadIndex]?.mesh;
    if (!lead) {
      throw new Error('No paraglider loaded for the camera to follow');
    }

    this.startAnimationLoop(renderer, scene, camera, controls);

    setupCameraAnimation(camera, controls, {
      target: lead,
      animationDurationMs: ANIMATION_DURATION_MS,
      onAnimationStart: () => {
        this.isAnimating = true;
      },
      onAnimationComplete: () => {
        this.isAnimating = false;
        // A pilot who twists (Bernt) shows it off as the camera arrives, and again when picked
        this.pilots[this.leadIndex]?.motion?.startTwist();
        // The arrows only steer the follow camera, so they appear once the intro has landed
        if (!isEmbedded() && !this.targetController && this.pilots.length > 1) {
          this.removePilotPicker = createPilotPicker(this.pilots.length, this.leadIndex, index => {
            this.leadIndex = index;
            this.pilots[index]?.motion?.startTwist();
            // Keeps the address on the pilot in view, so it can be shared
            history.replaceState(null, '', searchWithPilot(window.location.search, index));
          });
        }
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
    let lastTime: number | null = null;
    const follow = new CameraFollow(CAMERA_FOLLOW);
    const cameraMove = new THREE.Vector3();
    let wasFollowing = false;
    let followed = this.pilots[this.leadIndex];
    // Sways the camera with La Graciosa behind the pilots until someone takes the controls
    const sway = new BackdropSway(LA_GRACIOSA, CAMERA_SWAY);
    let swaying = true;
    // Picking another pilot after zooming out closes back in, unless someone grabs the controls
    const zoomIn = new ZoomIn(CAMERA_ZOOM_IN);
    controls.addEventListener('start', () => {
      swaying = false;
      zoomIn.stop();
    });
    const enginePos = new THREE.Vector3();
    const tail = new THREE.Vector3();

    // Puffs smoke from `tailOffset` behind the aircraft's origin, reusing the scratch vectors
    const updateSmoke = (
      trail: SmokeTrail,
      mesh: THREE.Object3D,
      behavior: FlyingBehavior,
      tailOffset: number,
      deltaTime: number
    ) => {
      mesh.getWorldPosition(enginePos);
      tail.set(1, 0, 0).applyQuaternion(mesh.quaternion);
      enginePos.addScaledVector(tail, -tailOffset);
      trail.update(deltaTime, enginePos, behavior.getVelocity());
    };

    const animate = (now: number) => {
      try {
        // The frame's own timestamp, and a capped step so returning to the tab doesn't jump
        const deltaTime = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (this.targetController) {
          this.targetController.update(deltaTime);
        }

        this.paragliderMotions.forEach(motion => motion.update(deltaTime));
        this.guirreVisitor?.update(deltaTime);

        // Carry the camera after the lead pilot on a spring; the intro animation places it itself.
        const following = !this.isAnimating && !this.targetController;
        if (following) {
          const pilot = this.pilots[this.leadIndex];
          if (!wasFollowing) follow.reset(pilot.mesh.position);
          else if (pilot !== followed) {
            follow.retarget(pilot.mesh.position);
            zoomIn.start();
          }
          followed = pilot;
          follow.update(deltaTime, pilot.mesh.position, pilot.motion?.bankAngle ?? 0, cameraMove);
          camera.position.add(cameraMove);
          controls.target.add(cameraMove);
          zoomIn.update(deltaTime, camera.position, controls.target);
          if (swaying) sway.update(deltaTime, camera.position, controls.target);
          applyFloatingMotion(camera, startTime, this.isAnimating);
        }
        wasFollowing = following;

        OrbitControlsHelper.update(controls);

        if (this.cessnaSmokeTrail && this.cessnaMesh && this.cessnaFlyingBehavior) {
          updateSmoke(
            this.cessnaSmokeTrail,
            this.cessnaMesh,
            this.cessnaFlyingBehavior,
            3,
            deltaTime
          );
        }
        if (this.herculesSmokeTrail && this.herculesMesh && this.herculesFlyingBehavior) {
          updateSmoke(
            this.herculesSmokeTrail,
            this.herculesMesh,
            this.herculesFlyingBehavior,
            5,
            deltaTime
          );
        }

        const renderCamera =
          this.isAnimating || !this.targetController ? camera : this.targetController;
        // The roll is undone after the frame so the orbit controls never see it.
        if (following) camera.rotateZ(follow.roll);
        this.renderFrame(renderer, scene, renderCamera);
        if (following) camera.rotateZ(-follow.roll);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }

  public override dispose(): void {
    logger.debug(`Disposing ${this.config.name}`);

    if (this.removeTitleOverlay) {
      this.removeTitleOverlay();
      this.removeTitleOverlay = null;
    }

    if (this.removePilotPicker) {
      this.removePilotPicker();
      this.removePilotPicker = null;
    }
    this.pilots.length = 0;
    this.leadIndex = 0;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    this.paragliderFlyingBehaviors.forEach(behavior => behavior.dispose());
    this.paragliderFlyingBehaviors.length = 0;
    this.paragliderMotions.length = 0;

    this.guirreVisitor?.dispose();
    this.guirreVisitor = undefined;

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
};

export default Home;
