import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { getTerrainHeight } from '../../shared/env/mesh-utils';
import { requestFrame, cancelFrame } from '../../foundation/systems/animation/frame';
import { placeHref } from '../relax/places';
import { FLYING_ZONES, zoneScene, zoneTakeoff } from './zones';
import { ZoneMarkers } from './zoneMarkers';
import './flying-zones.css';

// The camera looks down on the island from the south, this high above the horizon; on a tall
// screen it looks north-east instead, up the island's length. It sits back just far enough for
// every takeoff to land inside this share of the screen either way from the middle: less at the
// top, where the page's card and the pins' wings go, and across, where their labels do.
const ELEVATION = THREE.MathUtils.degToRad(58);
const PORTRAIT_HEADING = THREE.MathUtils.degToRad(-45);
const SAFE = { across: 0.72, top: 0.55, bottom: 0.85 };
// It drifts this far either side of north-up, and takes this long to swing back
const SWAY_ANGLE = THREE.MathUtils.degToRad(7);
const SWAY_PERIOD = 120;
// Thinner fog than the theme's, which would hide the island's ends from this far up
const FOG_DENSITY = 0.000006;

/**
 * Lanzarote from above with a paraglider pin on every flying zone (zones.json); a pin opens
 * that zone's scene. The camera sways gently until the viewer takes it over.
 */
class FlyingZonesApp extends TerrainBase {
  private animationId: number | undefined;
  private markers: ZoneMarkers | undefined;
  private card: HTMLElement | undefined;
  private onResize: (() => void) | undefined;

  constructor() {
    const appConfig = getAppConfig('flyingzones');
    if (!appConfig) {
      throw new Error('Flying zones app not found in registry');
    }
    super({ name: appConfig.name, description: appConfig.description });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, scene, controls } = options;
      const base = getDefaultTheme();
      const theme = { ...base, atmosphere: { ...base.atmosphere, fogDensity: FOG_DENSITY } };

      const takeoffs = FLYING_ZONES.map(zone => ({ zone, ...zoneTakeoff(zone) }));
      const middle = (values: number[]) => (Math.min(...values) + Math.max(...values)) / 2;
      const centre = new THREE.Vector3(
        middle(takeoffs.map(({ x }) => x)),
        0,
        middle(takeoffs.map(({ z }) => z))
      );
      const offset = new THREE.Vector3();
      // Where the camera sits from the centre to fit the takeoffs on this screen: a few rounds of
      // projecting them and stepping back or in by how far they spill over or fall short
      const frame = () => {
        const heading = camera.aspect < 1 ? PORTRAIT_HEADING : 0;
        offset
          .set(0, Math.sin(ELEVATION), Math.cos(ELEVATION))
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), heading)
          .setLength(30000);
        const probe = camera.clone();
        probe.updateProjectionMatrix();
        const point = new THREE.Vector3();
        for (let round = 0; round < 6; round++) {
          probe.position.copy(centre).add(offset);
          probe.lookAt(centre);
          probe.updateMatrixWorld();
          const spill = Math.max(
            ...takeoffs.map(({ x, z }) => {
              point.set(x, 0, z).project(probe);
              return Math.max(
                Math.abs(point.x) / SAFE.across,
                point.y / SAFE.top,
                -point.y / SAFE.bottom
              );
            })
          );
          offset.multiplyScalar(spill);
        }
      };
      frame();
      camera.position.copy(centre).add(offset);
      camera.lookAt(centre);

      await this.initializeEnvironment(options);
      await ThemeEngine.apply(options, theme);

      const environment = new Environment(scene);
      await environment.addCloudsFromTheme(theme);
      options.environment = environment;

      const { terrain } = options;
      terrain?.updateMatrixWorld(true);
      this.markers = new ZoneMarkers(
        takeoffs.map(({ zone, x, z }) => {
          const height = terrain ? getTerrainHeight(x, z, terrain) : 0;
          return {
            zone,
            ground: new THREE.Vector3(x, Number.isNaN(height) ? 0 : height, z),
            href: placeHref(zoneScene(zone)),
          };
        })
      );
      this.card = this.createCard();

      controls.enabled = true;
      controls.target.copy(centre);
      controls.screenSpacePanning = false;
      controls.minDistance = offset.length() * 0.2;
      controls.maxDistance = offset.length() * 1.6;
      controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
      controls.update();

      this.onResize = frame;
      window.addEventListener('resize', frame);
      this.startAnimationLoop(options, controls, centre, offset);
      console.log(`✅ ${this.config.name} loaded: ${FLYING_ZONES.length} zones`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /** The page's name and what to do on it */
  private createCard(): HTMLElement {
    const card = document.createElement('header');
    card.className = 'zones-card';
    card.innerHTML = `
      <p class="zones-card__place">Lanzarote</p>
      <h1>Where we fly</h1>
      <p>${FLYING_ZONES.length} flying zones round the island. Pick one to watch the gliders soar it.</p>`;
    document.body.appendChild(card);
    return card;
  }

  private startAnimationLoop(
    { renderer, scene, camera }: StoryOptions,
    controls: OrbitControls,
    centre: THREE.Vector3,
    offset: THREE.Vector3
  ): void {
    const up = new THREE.Vector3(0, 1, 0);
    let swaying = true;
    controls.addEventListener('start', () => {
      swaying = false;
    });
    let elapsed = 0;
    let lastTime: number | null = null;
    const animate = (now: number) => {
      try {
        const deltaTime = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        elapsed += deltaTime;
        if (swaying) {
          const angle = SWAY_ANGLE * Math.sin((elapsed / SWAY_PERIOD) * Math.PI * 2);
          camera.position.copy(centre).add(offset.clone().applyAxisAngle(up, angle));
          camera.lookAt(centre);
        } else {
          OrbitControlsHelper.update(controls);
        }
        this.renderFrame(renderer, scene, camera);
        camera.updateMatrixWorld();
        // North-up when the camera is due south of what it looks at
        const heading = Math.atan2(
          camera.position.x - controls.target.x,
          camera.position.z - controls.target.z
        );
        this.markers?.place(camera, heading);
        this.animationId = requestFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    this.animationId = requestFrame(animate);
  }

  public override dispose(): void {
    if (this.animationId) {
      cancelFrame(this.animationId);
      this.animationId = undefined;
    }
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    this.onResize = undefined;
    this.markers?.dispose();
    this.markers = undefined;
    this.card?.remove();
    this.card = undefined;
    super.dispose();
  }
}

const flyingZonesApp = new FlyingZonesApp();

const FlyingZones = {
  load: async (options: StoryOptions) => flyingZonesApp.load(options),
  dispose: () => flyingZonesApp.dispose(),
};

export default FlyingZones;
