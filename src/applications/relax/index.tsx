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
import { getTerrainHeight } from '../../shared/env/mesh-utils';
import { LevelOfDetail } from '../../foundation/types/lod';
import { DEFAULT_SCENE, RELAX_SCENES, RelaxScene } from './scenes';

const PILOTS = 5;
// The camera drifts this far either side of where it starts, and takes this long to swing back
const SWAY_ANGLE = THREE.MathUtils.degToRad(20);
const SWAY_PERIOD = 90;
// How far the viewer may take the camera: a terrain ends at its box, so zooming out, panning
// far or orbiting round behind the hills would show its edges.
const MAX_ZOOM_OUT = 1.5;
const MIN_DISTANCE = 150;
const DEFAULT_ORBIT = 60;
const PAN_LIMIT = 3000;
const LOWEST_VIEW = THREE.MathUtils.degToRad(85);
// The camera never goes nearer the ground than this
const GROUND_CLEARANCE = 40;

/**
 * Pick a place (?location=lanzarote | tenerife | rio-de-janeiro) and watch a few gliders soar its ridge
 * while the camera drifts slowly from side to side. Dragging takes over the camera.
 */
class RelaxApp extends TerrainBase {
  private animationId: number | undefined;
  private gliders: VehicleLoadResult[] = [];

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
      const id = new URLSearchParams(window.location.search).get('location') ?? DEFAULT_SCENE;
      const relax = RELAX_SCENES[id] ?? RELAX_SCENES[DEFAULT_SCENE]!;
      this.location = relax.location;

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
      await environment.addCloudsFromTheme(theme, relax.clouds);
      options.environment = environment;

      this.gliders = await loadParagliders(
        scene,
        paraglidersVoxel.slice(0, PILOTS).map(({ options }, i) => ({
          options,
          startProgress: i / PILOTS,
          // Each a little higher and further out, so they don't fly through each other
          pathOffset: new THREE.Vector3(0, i * 25, 0),
        })),
        (error, context) => this.handleError(error, context),
        { waypoints: relax.loop, tension: RIDGE_LOOP_TENSION }
      );

      const { terrain } = options;
      if (terrain && (relax.towns || relax.scatter)) {
        // Houses and scatter are dropped onto the ground, so its matrices must be current
        renderer.render(scene, camera);
        if (relax.towns) {
          await environment.addTownsFromConfig(relax.towns, terrain, true, LevelOfDetail.ULTRA_LOW);
        }
        if (relax.scatter) addScatter(scene, terrain, relax.scatter);
      }

      this.startAnimationLoop(renderer, scene, camera, controls, relax, terrain);
      console.log(`✅ ${this.config.name} loaded: ${relax.location.name}`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /** Keep the viewer near the gliders: a little zoom, the scene's orbit, panning held below */
  private limitControls(controls: OrbitControls, relax: RelaxScene): void {
    const offset = relax.camera.position.clone().sub(relax.camera.target);
    const azimuth = Math.atan2(offset.x, offset.z);
    const orbit = relax.orbit ?? DEFAULT_ORBIT;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = offset.length() * MAX_ZOOM_OUT;
    controls.minAzimuthAngle = orbit >= 180 ? -Infinity : azimuth - THREE.MathUtils.degToRad(orbit);
    controls.maxAzimuthAngle = orbit >= 180 ? Infinity : azimuth + THREE.MathUtils.degToRad(orbit);
    controls.maxPolarAngle = LOWEST_VIEW;
  }

  /** Pull a pan back within PAN_LIMIT of the start, and lift the camera clear of the ground */
  private holdCamera(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    start: THREE.Vector3,
    terrain?: THREE.Mesh
  ): void {
    const drift = controls.target.clone().sub(start);
    if (drift.length() > PAN_LIMIT) {
      const excess = drift.setLength(drift.length() - PAN_LIMIT);
      controls.target.sub(excess);
      camera.position.sub(excess);
    }
    if (!terrain) return;
    const ground = getTerrainHeight(camera.position.x, camera.position.z, terrain);
    if (!isNaN(ground) && camera.position.y < ground + GROUND_CLEARANCE) {
      camera.position.y = ground + GROUND_CLEARANCE;
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
          this.holdCamera(camera, controls, relax.camera.target, terrain);
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
