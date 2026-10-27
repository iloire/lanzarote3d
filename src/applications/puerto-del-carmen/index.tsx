import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { LevelOfDetail } from '../../foundation/types/lod';
import { Harbour } from '../../foundation/components/scenery';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import { mooredBerths } from '../../shared/env/boat-group-utils';
import { loadParagliders } from '../home/vehicleLoader';
import { ParagliderMotion } from '../home/paragliderMotion';
import { HARBOUR_FEATURES, NORTH_QUAY, PONTOONS } from './harbour';
import { CameraShot } from './cameraShot';
import {
  BERTH_SPACING,
  BOATS_OUTSIDE,
  CAMERA,
  HARBOUR_GULLS,
  HARBOUR_PLACEMENT,
  INTRO_SHOT,
  PLAYA_QUEMADA_LOOP,
  PLAYA_QUEMADA_PILOT,
  PONTOON_BERTH_OFFSET,
  PONTOON_BOATS,
  QUAY_BERTH_OFFSET,
  QUAY_BOATS,
  TOWN,
} from './config';

/**
 * Puerto del Carmen, on the south-east coast: the white town along the seafront and up the
 * slope, the real harbour traced from OpenStreetMap with boats at its pontoons and quay, and one
 * paraglider soaring above Playa Quemada to the west. It opens with a shot from the pilot down
 * the coast and into the harbour (INTRO_SHOT).
 */
class PuertoDelCarmenApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private flyingBehaviors: FlyingBehavior[] = [];
  private paragliderMotions: ParagliderMotion[] = [];
  /** The opening shot while it runs, and how to end it early */
  private intro: { shot: CameraShot; time: number; pilot: THREE.Object3D } | undefined;
  private endIntro: (() => void) | undefined;

  constructor() {
    const appConfig = getAppConfig('puertodelcarmen');
    if (!appConfig) {
      throw new Error('Puerto del Carmen app not found in registry');
    }
    super({
      name: appConfig.name,
      description: appConfig.description,
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, scene, renderer, controls } = options;

      const theme = getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      camera.position.copy(CAMERA.position);
      camera.lookAt(CAMERA.lookAt);

      await this.initializeEnvironment(options);

      const { terrain, water } = options;

      controls.enabled = true;
      OrbitControlsHelper.focusOnTarget(
        controls,
        CAMERA.lookAt,
        ORBIT_CONTROLS_PRESETS['landscape']
      );

      // Hide the canvas while loading so nothing pops in
      const canvas = renderer.domElement;
      const originalOpacity = canvas.style.opacity;
      canvas.style.opacity = '0';

      // Render once so the terrain's matrices are up to date for the height raycasts
      renderer.render(scene, camera);

      this.environment = new Environment(scene);
      await this.environment.addCloudsFromTheme(theme);

      // The harbour goes in before the town, so it is merged with it
      const harbour = await new Harbour({ features: HARBOUR_FEATURES }).load();
      harbour.position.copy(HARBOUR_PLACEMENT.centre);
      harbour.rotation.y = HARBOUR_PLACEMENT.rotation;
      scene.add(harbour);
      await this.environment.addTownsFromConfig(TOWN, terrain, true, LevelOfDetail.ULTRA_LOW);

      await this.addHarbourBoats(water);
      options.environment = this.environment;
      this.environment.addGulls(HARBOUR_GULLS);

      const pilots = await loadParagliders(
        scene,
        [PLAYA_QUEMADA_PILOT],
        (error, context) => this.handleError(error, context),
        PLAYA_QUEMADA_LOOP
      );
      this.flyingBehaviors = pilots.flatMap(p => (p.flyingBehavior ? [p.flyingBehavior] : []));
      this.paragliderMotions = pilots.flatMap(p => (p.motion ? [p.motion] : []));

      // ?intro=0 opens on the harbour without the opening shot
      const pilot = pilots[0]?.mesh;
      if (pilot && new URLSearchParams(window.location.search).get('intro') !== '0') {
        this.startIntro(pilot, camera, controls, canvas);
      }

      this.startAnimationLoop(renderer, scene, camera, controls);

      canvas.style.opacity = originalOpacity || '1';
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /** Boats moored on both sides of every pontoon and along the north quay, and a few outside */
  private async addHarbourBoats(water: THREE.Mesh): Promise<void> {
    if (!this.environment) return;
    const pontoonBerths = PONTOONS.flatMap(([root, tip]) =>
      [-PONTOON_BERTH_OFFSET, PONTOON_BERTH_OFFSET].flatMap(offset =>
        mooredBerths(root, tip, BERTH_SPACING, offset)
      )
    );
    const pontoonBoats = pontoonBerths.map((_, i) => PONTOON_BOATS[i % PONTOON_BOATS.length]!);
    await this.environment.addMooredBoats(pontoonBoats, pontoonBerths);

    const [west, east] = NORTH_QUAY;
    const quayBerths = mooredBerths(west, east, BERTH_SPACING * 1.4, QUAY_BERTH_OFFSET);
    await this.environment.addMooredBoats(QUAY_BOATS, quayBerths);

    await this.environment.addBoatsAround(
      water,
      BOATS_OUTSIDE.center,
      BOATS_OUTSIDE.count,
      BOATS_OUTSIDE.scale
    );
  }

  /**
   * Runs the opening shot with the orbit controls off. When it ends, or someone clicks or
   * scrolls, the controls take over from wherever the camera is, aimed where it was looking.
   */
  private startIntro(
    pilot: THREE.Object3D,
    camera: THREE.Camera,
    controls: OrbitControls,
    canvas: HTMLCanvasElement
  ): void {
    this.intro = { shot: new CameraShot(INTRO_SHOT), time: 0, pilot };
    controls.enabled = false;
    this.placeCamera(camera, controls);

    const events = ['pointerdown', 'wheel'] as const;
    this.endIntro = () => {
      events.forEach(type => canvas.removeEventListener(type, end));
      this.intro = undefined;
      this.endIntro = undefined;
      controls.enabled = true;
      OrbitControlsHelper.focusOnTarget(
        controls,
        controls.target.clone(),
        ORBIT_CONTROLS_PRESETS['landscape']
      );
    };
    const end = () => this.endIntro?.();
    events.forEach(type => canvas.addEventListener(type, end));
  }

  /** Puts the camera where the opening shot has it now, and aims it */
  private placeCamera(camera: THREE.Camera, controls: OrbitControls): void {
    if (!this.intro) return;
    const { position, lookAt } = this.intro.shot.at(this.intro.time, this.intro.pilot.position);
    camera.position.copy(position);
    camera.lookAt(lookAt);
    controls.target.copy(lookAt);
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls
  ): void {
    let lastTime: number | null = null;
    const animate = (now: number) => {
      try {
        // A capped step, so returning to the tab doesn't jump
        const deltaTime = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        this.paragliderMotions.forEach(motion => motion.update(deltaTime));

        if (this.intro) {
          this.intro.time += deltaTime;
          this.placeCamera(camera, controls);
          if (this.intro.time >= this.intro.shot.duration) this.endIntro?.();
        } else {
          OrbitControlsHelper.update(controls);
        }

        this.renderFrame(renderer, scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }

  public override dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    this.endIntro?.();
    this.flyingBehaviors.forEach(behavior => behavior.dispose());
    this.flyingBehaviors = [];
    this.paragliderMotions = [];
    this.environment = undefined;
    super.dispose();
  }
}

const app = new PuertoDelCarmenApp();

const PuertoDelCarmen = {
  load: async (options: StoryOptions) => app.load(options),
  dispose: () => app.dispose(),
};

export default PuertoDelCarmen;
