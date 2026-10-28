import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { loadParagliders, VehicleLoadResult } from '../home/vehicleLoader';
import { paraglidersVoxel, RIDGE_LOOP_TENSION } from '../home/config';
import { addScatter } from '../../shared/env/scatter';
import { placeLandmarks } from '../../shared/env/landmarks';
import { getTerrainHeight } from '../../shared/env/mesh-utils';
import { LevelOfDetail } from '../../foundation/types/lod';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import Models from '../../foundation/utils/models';
import { DEFAULT_SCENE, RELAX_SCENES, RelaxScene } from './scenes';
import { createLocationSwitcher } from './LocationSwitcher';

const PILOTS = 5;
// Who flies a paramotor where there's no ridge: Abel, whose it is, and pilots in open harnesses
const PARAMOTOR_PILOTS = [
  CharacterType.ABEL,
  CharacterType.BERNT,
  CharacterType.LUC,
  CharacterType.FRANZ,
  CharacterType.JEHOSUA,
];
// The camera drifts this far either side of where it starts, and takes this long to swing back
const SWAY_ANGLE = THREE.MathUtils.degToRad(20);
const SWAY_PERIOD = 90;
// How far the viewer may take the camera unless the place says otherwise: a generated terrain
// ends at its box, so zooming out or panning far would show its edges. Orbiting is always free.
const DEFAULT_LIMITS = { zoomOut: 1.5, pan: 3000 };
const MIN_DISTANCE = 150;
const LOWEST_VIEW = THREE.MathUtils.degToRad(85);
// The camera never goes nearer the ground than this
const GROUND_CLEARANCE = 40;

/** The fields that are set, so a spread over defaults doesn't overwrite them with undefined */
const definedOnly = <T extends object>(values: T | undefined): Partial<T> =>
  Object.fromEntries(
    Object.entries(values ?? {}).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

/**
 * Pick a place (?location=lanzarote | tenerife | el-hierro | castejon-de-sos | rio-de-janeiro | new-york)
 * and watch a few gliders soar its ridge, or paramotors fly its streets, while the camera drifts slowly
 * from side to side. Dragging takes over the camera.
 */
class RelaxApp extends TerrainBase {
  private animationId: number | undefined;
  private gliders: VehicleLoadResult[] = [];
  private removeSwitcher: (() => void) | undefined;

  constructor() {
    const appConfig = getAppConfig('relax');
    if (!appConfig) {
      throw new Error('Relax app not found in registry');
    }
    super({ name: appConfig.name, description: appConfig.description });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, scene, renderer, controls } = options;
      const asked = new URLSearchParams(window.location.search).get('location') ?? DEFAULT_SCENE;
      const id = asked in RELAX_SCENES ? asked : DEFAULT_SCENE;
      const relax = RELAX_SCENES[id]!;
      this.location = relax.location;
      this.removeSwitcher = createLocationSwitcher(
        Object.entries(RELAX_SCENES).map(([key, scene]) => ({
          id: key,
          name: scene.location.name,
          region: scene.region,
        })),
        id
      );

      const theme = getDefaultTheme();
      await ThemeEngine.apply(options, theme);
      camera.position.copy(relax.camera.position);
      camera.lookAt(relax.camera.target);
      await this.initializeEnvironment(options);

      controls.enabled = true;
      controls.target.copy(relax.camera.target);
      this.limitControls(controls, relax);
      controls.update();

      const environment = new Environment(scene);
      await environment.addCloudsFromTheme(theme, relax.clouds, relax.cloudBase);
      options.environment = environment;

      if (relax.city) {
        const city = await Models.loadGltf(relax.city);
        scene.add(city.scene);
      }

      const pilots = relax.paramotor
        ? PARAMOTOR_PILOTS.flatMap(pilot =>
            paraglidersVoxel
              .filter(({ options }) => options.pilot.characterType === pilot)
              .slice(0, 1)
              .map(({ options }) => ({ options: { ...options, paramotor: true } }))
          )
        : paraglidersVoxel.slice(0, PILOTS);
      this.gliders = await loadParagliders(
        scene,
        pilots.map(({ options }, i) => ({
          options,
          startProgress: i / pilots.length,
          // Each a little higher and further out, so they don't fly through each other
          pathOffset: new THREE.Vector3(0, i * 25, 0),
        })),
        (error, context) => this.handleError(error, context),
        { waypoints: relax.loop, tension: RIDGE_LOOP_TENSION }
      );

      const { terrain } = options;
      if (terrain && (relax.towns || relax.scatter || relax.landmarks)) {
        // Houses and scatter are dropped onto the ground, so its matrices must be current
        renderer.render(scene, camera);
        if (relax.towns) {
          await environment.addTownsFromConfig(relax.towns, terrain, true, LevelOfDetail.ULTRA_LOW);
        }
        if (relax.scatter) addScatter(scene, terrain, relax.scatter);
        if (relax.landmarks) {
          const { list, anchor } = relax.landmarks;
          placeLandmarks(terrain, list, anchor).forEach(landmark => scene.add(landmark));
        }
      }

      this.startAnimationLoop(renderer, scene, camera, controls, relax, terrain);
      console.log(`✅ ${this.config.name} loaded: ${relax.location.name}`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /** Keep the viewer near the gliders: a little zoom, all the way round, panning held below */
  private limitControls(controls: OrbitControls, relax: RelaxScene): void {
    const offset = relax.camera.position.clone().sub(relax.camera.target);
    const { zoomOut } = { ...DEFAULT_LIMITS, ...definedOnly(relax.limits) };
    // Pan over the ground like a map, not up and down the screen into the hills
    controls.screenSpacePanning = false;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = offset.length() * zoomOut;
    controls.maxPolarAngle = LOWEST_VIEW;
  }

  /**
   * Pull a pan back within the place's pan limit of the start, and lift the camera and what it looks at
   * clear of the ground
   */
  private holdCamera(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    start: THREE.Vector3,
    pan: number,
    terrain?: THREE.Mesh
  ): void {
    const drift = controls.target.clone().sub(start);
    if (drift.length() > pan) {
      const excess = drift.setLength(drift.length() - pan);
      controls.target.sub(excess);
      camera.position.sub(excess);
    }
    if (!terrain) return;
    for (const point of [camera.position, controls.target]) {
      const ground = getTerrainHeight(point.x, point.z, terrain);
      if (!isNaN(ground) && point.y < ground + GROUND_CLEARANCE) {
        point.y = ground + GROUND_CLEARANCE;
      }
    }
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    relax: RelaxScene,
    terrain?: THREE.Mesh
  ): void {
    const motions = this.gliders.flatMap(g => (g.motion ? [g.motion] : []));
    const { pan } = { ...DEFAULT_LIMITS, ...definedOnly(relax.limits) };
    const offset = relax.camera.position.clone().sub(relax.camera.target);
    const up = new THREE.Vector3(0, 1, 0);
    let swaying = true;
    controls.addEventListener('start', () => {
      swaying = false;
    });

    let lastTime: number | null = null;
    let elapsed = 0;
    const animate = (now: number) => {
      try {
        const deltaTime = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        elapsed += deltaTime;
        motions.forEach(motion => motion.update(deltaTime));

        if (swaying) {
          const angle = SWAY_ANGLE * Math.sin((elapsed / SWAY_PERIOD) * Math.PI * 2);
          camera.position.copy(relax.camera.target).add(offset.clone().applyAxisAngle(up, angle));
          camera.lookAt(relax.camera.target);
        } else {
          OrbitControlsHelper.update(controls);
          this.holdCamera(camera, controls, relax.camera.target, pan, terrain);
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
    this.removeSwitcher?.();
    this.removeSwitcher = undefined;
    this.gliders.forEach(g => g.flyingBehavior?.dispose());
    this.gliders = [];
    super.dispose();
  }
}

const relaxApp = new RelaxApp();

const Relax = {
  load: async (options: StoryOptions) => relaxApp.load(options),
  dispose: () => relaxApp.dispose(),
};

export default Relax;
