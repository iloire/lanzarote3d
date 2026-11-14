import * as THREE from 'three';
import Environment, {
  FAMARA_GULL_FLOCKS,
  LANZAROTE_TOWNS,
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
import type { RoadTraffic } from '../../shared/env/roadTraffic';
import { WindFarm, HUB } from '../../shared/env/windFarm';
import {
  disposeChristmas,
  roofLights,
  spiralLights,
  townTrees,
  twinkleLights,
} from '../../shared/env/christmasLights';
import { LANDMARK_SCALE } from '../../shared/env/landmarks';
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
  CAMERA_REFRAME,
  LA_GRACIOSA,
  BIRTHDAY_FLIGHT,
  isEmbedded,
  isHeroEmbed,
  HERO,
  CAMERA_AIM_OFFSET,
  CAMERA_ARRIVAL_OFFSET,
  FREE_FLIGHT,
  CAMERA_CHASE,
  PARAGLIDER_SPEED,
} from './config';
import type { PilotCamera } from './config';
import { loadParagliders, loadHangglider, loadCessna, loadHercules } from './vehicleLoader';
import { setupCameraAnimation, applyFloatingMotion } from './cameraAnimation';
import { BackdropSway, CameraFollow, Reframe } from './cameraFollow';
import { FreeFlight } from './freeFlight';
import { getTerrainHeight } from '../../shared/env/mesh-utils';
import { createTitleOverlay } from './TitleOverlay';
import { createPilotPicker } from './PilotPicker';
import { pilotFromSearch, searchWithPilot } from './pilotParam';
import type { ParagliderMotion } from './paragliderMotion';
import type { SmokeTrail } from '../../foundation/components/effects/SmokeTrail';
import { GuirreVisitor } from '../../foundation/components/wildlife/GuirreVisitor';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import { birthdayPilots } from './birthdays';
import { withChristmasWings } from './christmasWings';
import { SANTA_FLIGHT } from './santa';
import { isChristmas } from '../../shared/christmas';
import { ConfettiBurst } from '../../foundation/components/effects/Confetti';
import { HeroEmbed } from './heroEmbed';
import { createLocationSwitcher } from '../relax/LocationSwitcher';
import { createSoundControls } from '../relax/soundControls';
import { SleighBells } from '../relax/sleighBells';
import { SparkleTrail } from '../../foundation/components/effects/SparkleTrail';
import { pickerPlaces } from '../relax/scenes';
import { HOME_PLACE } from '../relax/places';
import { listenForClicks, listenForWingClicks } from './wingClicks';
import { requestFrame, cancelFrame } from '../../foundation/systems/animation/frame';

/**
 * Home App - Landing scene with the voxel title
 */
class HomeApp extends TerrainBase {
  private environment: Environment | undefined;
  private guirres: GuirreVisitor[] = [];
  private confetti: ConfettiBurst[] = [];
  private removeConfettiClick: (() => void) | null = null;
  private removeWingClicks: (() => void) | null = null;
  private animationId: number | undefined;
  private traffic: RoadTraffic | undefined;
  private windFarm: WindFarm | undefined;
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
  private removeSwitcher: (() => void) | undefined;
  private removeSound: (() => void) | undefined;
  /** Everyone the camera can follow, paragliders then the hangglider, with how each banks */
  private pilots: {
    mesh: THREE.Object3D;
    motion?: ParagliderMotion;
    /** What the camera follows, if not the mesh's path: the hangglider's body, through his loops */
    focus?: THREE.Object3D;
    /** Framing of their own, if not the paragliders' */
    camera?: PilotCamera;
    /** The loop they fly, and their own flight while someone flies them with the arrows */
    path?: FlyingBehavior;
    flight?: FreeFlight;
  }[] = [];
  /** Which of `pilots` the camera follows */
  private leadIndex = 0;
  /** The arrows held down, which fly the pilot the camera follows */
  private readonly arrows = new Set<string>();
  private removeArrowKeys: (() => void) | null = null;
  /** Santa's rig at Christmas, and his bells once the sound is on */
  private santa: THREE.Object3D | undefined;
  private bells: SleighBells | undefined;
  /** At Christmas the towns' trees and fairy lights, and the lights up the wind turbines */
  private christmasLights: THREE.Group | undefined;
  /** At Christmas Blay's loops leave a trail of sparkles */
  private sparkles: { trail: SparkleTrail; motion: ParagliderMotion } | undefined;
  /** Set when the scene is a page's hero background */
  private hero: HeroEmbed | null = null;

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

      // Whoever's birthday it is flies out past everyone, halfway to La Graciosa
      const birthdays = birthdayPilots(new Date(), window.location.search);
      const paragliderResults = await loadParagliders(
        scene,
        (isChristmas()
          ? [...withChristmasWings(paraglidersVoxel), SANTA_FLIGHT]
          : paraglidersVoxel
        ).map(p =>
          birthdays.includes(p.options.pilot.characterType) ? { ...p, ...BIRTHDAY_FLIGHT } : p
        ),
        this.handleError.bind(this)
      );
      this.paragliderMeshes = paragliderResults.map(r => r.mesh);
      this.paragliderFlyingBehaviors = paragliderResults.flatMap(r =>
        r.flyingBehavior ? [r.flyingBehavior] : []
      );
      this.paragliderMotions = paragliderResults.flatMap(r => (r.motion ? [r.motion] : []));
      this.pilots = paragliderResults.map(({ mesh, motion, flyingBehavior }) => ({
        mesh,
        motion,
        path: flyingBehavior,
      }));

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
          if (hanggliderResult.motion && isChristmas()) {
            const trail = new SparkleTrail({ size: 0.4, spread: 1.5 });
            scene.add(trail.points);
            this.sparkles = { trail, motion: hanggliderResult.motion };
          }
          this.pilots.push({
            mesh: hanggliderResult.mesh,
            motion: hanggliderResult.motion,
            focus: hanggliderResult.motion?.body,
            camera: hanggliderConfig.camera,
            path: hanggliderResult.flyingBehavior,
          });
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

      const houses = await this.environment.addTownsFromConfig(
        LANZAROTE_TOWNS,
        terrain,
        true,
        LevelOfDetail.ULTRA_LOW
      );

      const { roads, traffic } = await createIslandRoads(terrain);
      roads.forEach(road => scene.add(road));
      scene.add(traffic.mesh);
      this.traffic = traffic;
      this.windFarm = new WindFarm(terrain);
      scene.add(this.windFarm.group);
      if (isChristmas()) {
        // A tree in every town, lights round half the houses and wound up the wind turbines
        const lights = townTrees(
          LANZAROTE_TOWNS.map(town => town.position),
          terrain
        );
        lights.add(twinkleLights(roofLights(houses), 0.9));
        const tower = HUB * LANDMARK_SCALE;
        lights.add(
          twinkleLights(
            this.windFarm.bases.flatMap(base =>
              spiralLights(base, tower, [2.2 * LANDMARK_SCALE, 1.3 * LANDMARK_SCALE], 6, 60)
            ),
            1.6
          )
        );
        scene.add(lights);
        this.christmasLights = lights;
      }
      logger.info(`${roads.length} roads connecting the Famara towns, ${traffic.count} cars`);

      const landmarks = createLandmarks(terrain);
      landmarks.forEach(landmark => scene.add(landmark));
      scene.add(createFerryCrossing());

      this.environment.addRandomBoats(water);

      options.environment = this.environment;

      this.environment.addGulls(FAMARA_GULL_FLOCKS);
      this.environment.addRavens(RISCO_RAVEN_FLOCKS);
      // The pair of guirres keep Magne company: one circles well above him, now and then
      // coming down to glide alongside; its mate only ever circles a little further off. On a
      // pilot's birthday they escort the birthday pilot instead, and visit twice as often.
      const birthdayRigs = birthdays
        .map(pilot => scene.getObjectByName(`paraglider-${pilot}`))
        .filter((rig): rig is THREE.Object3D => rig !== undefined);
      const birthdayPilot = birthdayRigs[0];
      const companion = birthdayPilot ?? scene.getObjectByName(`paraglider-${CharacterType.MAGNE}`);
      if (companion) {
        const circling: [number, number] = birthdayPilot ? [10, 20] : [20, 40];
        this.guirres = [
          new GuirreVisitor(companion, { circling }),
          new GuirreVisitor(companion, { visits: false, radius: 260, height: 190 }),
        ];
        this.guirres.forEach(guirre => scene.add(guirre.mesh));
      }
      if (birthdayRigs.length) this.listenForConfetti(renderer.domElement, birthdayRigs);
      this.removeWingClicks = listenForWingClicks(renderer.domElement, camera, this.pilots);

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
          this.targetController.addTarget(this.hanggliderMesh, 'Blay');
        }

        createCameraTargetUI(this.targetController, controls);
      }

      if (!isEmbedded()) {
        this.removeTitleOverlay = createTitleOverlay();
        // The home page is the relax site's Lanzarote: the same place picker, wind and music
        this.removeSwitcher = createLocationSwitcher(pickerPlaces(HOME_PLACE), HOME_PLACE);
        // At Christmas Santa's sleigh bells ring with the wind, louder as the camera nears him
        this.santa = scene.getObjectByName(`paraglider-${SANTA_FLIGHT.name}`);
        this.removeSound = createSoundControls(
          false,
          this.santa ? [() => (this.bells = new SleighBells())] : []
        );
      }

      if (!isEmbedded() && !this.targetController) this.listenForArrows(controls);
      this.setupCameraAnimation(camera, controls, renderer, scene, terrain);

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
    scene: THREE.Scene,
    terrain: THREE.Mesh | undefined
  ): void {
    // ?pilot= picks who the fly-in lands on, by number or by the rig's name (e.g. bernt, blay)
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

    if (isHeroEmbed()) {
      // A background has no time for the fly-in: start beside the pilot, already following
      this.hero = new HeroEmbed(camera as THREE.PerspectiveCamera, HERO);
      controls.target.copy(lead.position).add(CAMERA_AIM_OFFSET);
      camera.position.copy(controls.target).add(CAMERA_ARRIVAL_OFFSET);
      controls.update();
      this.startAnimationLoop(renderer, scene, camera, controls, terrain);
      return;
    }

    // Flagged before the first frame: the sway would otherwise lock onto the camera's far-off
    // starting angle in the moment before the fly-in, and snap back to it when it lands
    this.isAnimating = true;
    this.startAnimationLoop(renderer, scene, camera, controls, terrain);

    setupCameraAnimation(camera, controls, {
      target: lead,
      animationDurationMs: ANIMATION_DURATION_MS,
      onAnimationComplete: () => {
        this.isAnimating = false;
        // A pilot who twists (Bernt) shows it off as the camera arrives, and again when picked
        this.pilots[this.leadIndex]?.motion?.startTwist();
        // The arrows only steer the follow camera, so they appear once the intro has landed
        if (!isEmbedded() && !this.targetController && this.pilots.length > 1) {
          this.removePilotPicker = createPilotPicker(this.pilots.length, this.leadIndex, index => {
            // Whoever was being flown flies back to their loop on their own
            this.pilots[this.leadIndex]?.flight?.release();
            this.leadIndex = index;
            this.pilots[index]?.motion?.startTwist();
            // Keeps the address on the pilot in view, so it can be shared
            history.replaceState(null, '', searchWithPilot(window.location.search, index));
          });
        }
      },
    });
  }

  /**
   * The arrows fly the pilot the camera follows, so they no longer pan the camera. Ignored while
   * typing, e.g. in the place picker's search.
   */
  private listenForArrows(controls: OrbitControls): void {
    controls.stopListenToKeyEvents();
    const isArrow = (key: string) => key.startsWith('Arrow');
    const onDown = (e: KeyboardEvent) => {
      const target = e.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (!isArrow(e.key) || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      this.arrows.add(e.key);
    };
    const onUp = (e: KeyboardEvent) => {
      if (isArrow(e.key)) this.arrows.delete(e.key);
    };
    const onBlur = () => this.arrows.clear();
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    this.removeArrowKeys = () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      this.arrows.clear();
      controls.listenToKeyEvents(window);
    };
  }

  /**
   * A click on the scene, not a drag of the camera, throws a puff of confetti from the pilot
   * the camera is following, as long as it's their birthday; anyone else, nothing happens.
   */
  private listenForConfetti(canvas: HTMLCanvasElement, birthdayRigs: THREE.Object3D[]): void {
    this.removeConfettiClick = listenForClicks(canvas, () => {
      const rig = this.pilots[this.leadIndex]?.mesh;
      if (this.isAnimating || !rig || !birthdayRigs.includes(rig)) return;
      // From the carabiners, between pilot and wing, sized from the wing (~11 m at life size)
      const origin = new THREE.Vector3();
      rig.getObjectByName('pilot-swing')?.getWorldPosition(origin);
      const span = new THREE.Box3().setFromObject(rig).getSize(new THREE.Vector3());
      const burst = new ConfettiBurst(rig.worldToLocal(origin), Math.max(span.x, span.z) / 11);
      rig.add(burst.mesh);
      this.confetti.push(burst);
      window.gtag?.('event', 'birthday_confetti', {});
    });
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls,
    terrain: THREE.Mesh | undefined
  ): void {
    const startTime = Date.now();
    let lastTime: number | null = null;
    const follow = new CameraFollow(CAMERA_FOLLOW);
    const cameraMove = new THREE.Vector3();
    let wasFollowing = false;
    let heroShown = false;
    let followed = this.pilots[this.leadIndex];
    // Sways the camera with La Graciosa behind the pilots until someone takes the controls
    const sway = new BackdropSway(LA_GRACIOSA, CAMERA_SWAY);
    let swaying = true;
    // Picking another pilot brings the camera back to that pilot's best view, however it was
    // left, unless someone grabs the controls on the way
    const reframe = new Reframe(CAMERA_REFRAME);
    // While someone flies the lead, the camera swings round behind them, off a point ahead
    const chaseAhead = new THREE.Vector3();
    const chase = new BackdropSway(chaseAhead, CAMERA_CHASE);
    let chasing = false;
    const heading = new THREE.Vector3();
    const groundHeight = (x: number, z: number) =>
      terrain ? getTerrainHeight(x, z, terrain) : NaN;
    controls.addEventListener('start', () => {
      swaying = false;
      chasing = false;
      reframe.stop();
    });
    /** Flies the lead after the arrows, taking them off their loop on the first press */
    const flyLead = () => {
      const pilot = this.pilots[this.leadIndex];
      if (!pilot?.path || this.arrows.size === 0) {
        if (pilot?.flight) pilot.flight.input.turn = pilot.flight.input.pitch = 0;
        return;
      }
      if (!pilot.flight) {
        const speed = pilot.motion?.speed ?? PARAGLIDER_SPEED;
        pilot.flight = new FreeFlight(pilot.mesh, pilot.path, speed, FREE_FLIGHT, groundHeight);
        window.gtag?.('event', 'pilot_fly', { pilot: this.leadIndex + 1 });
      } else if (pilot.flight.returning) pilot.flight.steer();
      const held = (key: string) => (this.arrows.has(key) ? 1 : 0);
      pilot.flight.input.turn = held('ArrowLeft') - held('ArrowRight');
      pilot.flight.input.pitch = held('ArrowUp') - held('ArrowDown');
      if (!chasing && !reframe.running) {
        chasing = true;
        swaying = false;
        chase.restart();
      }
    };
    const framing = new THREE.Spherical();
    const frameOffset = new THREE.Vector3();
    /** The fly-in's view of `pilot`, at their own distance, with La Graciosa behind them */
    const bestView = (pilot: (typeof this.pilots)[number]) => {
      framing.setFromVector3(CAMERA_ARRIVAL_OFFSET);
      framing.radius = pilot.camera?.distance ?? framing.radius;
      framing.theta = sway.centre(pilot.mesh.position);
      return frameOffset.setFromSpherical(framing);
    };
    const focusPoint = new THREE.Vector3();
    /** Where the camera follows `pilot`: their body if it leaves the path, else the path */
    const focusOf = (pilot: (typeof this.pilots)[number]) => {
      if (!pilot.focus) return pilot.mesh.position;
      // This frame's flight and motion have moved it since the last render
      pilot.focus.updateWorldMatrix(true, false);
      return pilot.focus.getWorldPosition(focusPoint);
    };
    const sparkleAt = new THREE.Vector3();
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

        if (this.hero?.paused) {
          this.animationId = requestFrame(animate);
          return;
        }

        if (this.targetController) {
          this.targetController.update(deltaTime);
        }

        this.traffic?.update(deltaTime);
        if (this.sparkles) {
          const { trail, motion } = this.sparkles;
          trail.update(deltaTime, motion.body.getWorldPosition(sparkleAt), motion.looping);
        }
        if (this.santa) this.bells?.setDistance(camera.position.distanceTo(this.santa.position));
        this.windFarm?.update(deltaTime);

        // Free flights move their rigs before the motions read how they turned
        if (!this.isAnimating) flyLead();
        this.pilots.forEach(pilot => {
          if (pilot.flight && !pilot.flight.update(deltaTime)) pilot.flight = undefined;
        });
        this.paragliderMotions.forEach(motion => motion.update(deltaTime));
        this.guirres.forEach(guirre => guirre.update(deltaTime));
        this.confetti = this.confetti.filter(burst => {
          if (burst.update(deltaTime)) return true;
          burst.dispose();
          return false;
        });

        // Carry the camera after the lead pilot on a spring; the intro animation places it itself.
        const following = !this.isAnimating && !this.targetController;
        if (following) {
          const pilot = this.pilots[this.leadIndex];
          if (!wasFollowing) {
            follow.reset(focusOf(pilot), pilot.camera?.follow);
            // The fly-in lands at the paragliders' framing; a pilot framed his own way (Blay)
            // closes in on it
            if (pilot.camera) {
              frameOffset.subVectors(camera.position, controls.target);
              reframe.start(pilot.camera.aim, frameOffset.setLength(pilot.camera.distance));
            }
          } else if (pilot !== followed) {
            follow.retarget(focusOf(pilot));
            // The sway takes over again from the centre of its swing once the camera is there
            swaying = false;
            chasing = false;
            reframe.start(pilot.camera?.aim ?? CAMERA_AIM_OFFSET, bestView(pilot));
          }
          followed = pilot;
          follow.update(
            deltaTime,
            focusOf(pilot),
            pilot.motion?.bankAngle ?? 0,
            cameraMove,
            pilot.camera?.follow
          );
          camera.position.add(cameraMove);
          controls.target.add(cameraMove);
          if (reframe.update(deltaTime, camera.position, controls.target, follow.anchor)) {
            sway.restart();
            swaying = true;
          }
          if (chasing && !reframe.running) {
            heading.set(0, 0, -1).applyQuaternion(pilot.mesh.quaternion).setY(0);
            chaseAhead.copy(pilot.mesh.position).addScaledVector(heading.normalize(), 10000);
            chase.update(deltaTime, camera.position, controls.target);
          } else if (swaying && !reframe.running) {
            sway.update(deltaTime, camera.position, controls.target);
          }
          applyFloatingMotion(camera, startTime, this.isAnimating);
        }
        // During the fly-in, learn the lead's speed so the follow takes over moving with them
        else if (this.isAnimating) follow.observe(deltaTime, focusOf(this.pilots[this.leadIndex]));
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
        // The hero's lean and the roll are undone after the frame so the orbit controls never see them.
        this.hero?.update(deltaTime);
        if (following) this.hero?.apply(controls.target);
        if (following) camera.rotateZ(follow.roll);
        this.renderFrame(renderer, scene, renderCamera);
        if (following) camera.rotateZ(-follow.roll);
        if (following) this.hero?.restore();
        if (this.hero && !heroShown) {
          heroShown = true;
          this.hero.ready();
        }
        this.animationId = requestFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    this.animationId = requestFrame(animate);
  }

  public override dispose(): void {
    logger.debug(`Disposing ${this.config.name}`);

    if (this.removeTitleOverlay) {
      this.removeTitleOverlay();
      this.removeTitleOverlay = null;
    }
    this.removeSwitcher?.();
    this.removeSwitcher = undefined;
    this.removeSound?.();
    this.removeSound = undefined;
    this.bells = undefined;
    this.sparkles?.trail.dispose();
    this.sparkles = undefined;
    this.santa = undefined;

    this.hero?.dispose();
    this.hero = null;

    if (this.removePilotPicker) {
      this.removePilotPicker();
      this.removePilotPicker = null;
    }
    this.removeArrowKeys?.();
    this.removeArrowKeys = null;
    this.pilots.length = 0;
    this.leadIndex = 0;

    if (this.animationId) {
      cancelFrame(this.animationId);
      this.animationId = undefined;
    }

    this.traffic?.dispose();
    this.traffic = undefined;
    this.windFarm?.dispose();
    this.windFarm = undefined;
    if (this.christmasLights) disposeChristmas(this.christmasLights);
    this.christmasLights = undefined;

    this.paragliderFlyingBehaviors.forEach(behavior => behavior.dispose());
    this.paragliderFlyingBehaviors.length = 0;
    this.paragliderMotions.length = 0;

    this.guirres.forEach(guirre => guirre.dispose());
    this.guirres.length = 0;
    this.removeConfettiClick?.();
    this.removeConfettiClick = null;
    this.removeWingClicks?.();
    this.removeWingClicks = null;
    this.confetti.forEach(burst => burst.dispose());
    this.confetti.length = 0;

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
