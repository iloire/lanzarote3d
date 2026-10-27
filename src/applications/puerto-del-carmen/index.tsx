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
import {
  BERTH_SPACING,
  BOATS_OUTSIDE,
  CAMERA,
  HARBOUR_GULLS,
  HARBOUR_PLACEMENT,
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
 * paraglider soaring above Playa Quemada to the west.
 */
class PuertoDelCarmenApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private flyingBehaviors: FlyingBehavior[] = [];
  private paragliderMotions: ParagliderMotion[] = [];

  constructor() {
    const appConfig = getAppConfig('puertodelcarmen');
    if (!appConfig) {
      throw new Error('Puerto del Carmen app not found in registry');
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
        logIntervalMs: 10000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, scene, renderer, controls } = options;

      const theme = getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      camera.position.copy(CAMERA.position);
      camera.lookAt(CAMERA.lookAt);

      this.initializeCore(options);
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
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0);
      await this.environment.addCloudsFromTheme(thermals, theme);

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

      this.startAnimationLoop(renderer, scene, camera, controls);

      canvas.style.opacity = originalOpacity || '1';
      this.isLoaded = true;
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

    await this.environment.addBoatsAround(water, BOATS_OUTSIDE.center, BOATS_OUTSIDE.count);
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

        this.updatePerformance();
        this.paragliderMotions.forEach(motion => motion.update(deltaTime));
        OrbitControlsHelper.update(controls);

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
  getAppInfo: () => app.getAppInfo(),
};

export default PuertoDelCarmen;
