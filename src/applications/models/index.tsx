import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { sharedUniforms } from '../../foundation/rendering/sharedUniforms';
import { MODEL_CATALOG, ModelEntry } from './catalog';
import './models.css';

const PARAM = 'model';

/**
 * Model viewer - shows one scene model at a time on a turntable, framed to its size, with its
 * dimensions and triangle count. Pick from the list or step with ← / →; ?model=<id> links to one,
 * and ?lod=ultra_low|low|medium|high picks the detail of buildings and cacti (HIGH by default).
 */
class ModelsViewer extends WorkshopDemoBase {
  private options!: StoryOptions;
  private current?: { entry: ModelEntry; object: THREE.Object3D; dispose?: () => void };
  private grid?: THREE.GridHelper;
  private panel?: HTMLDivElement;
  private info?: HTMLDivElement;
  private loadToken = 0;

  constructor() {
    super({
      name: 'Models',
      description: 'Every model of the scenes, one at a time',
      ground: { create: false },
      helpers: false,
      lighting: { sunPosition: 12 },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    this.options = options;
    this.initializeCore(options);

    const { controls, renderer, scene, camera } = options;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    this.buildPanel();
    window.addEventListener('keydown', this.onKeyDown);

    const requested = new URLSearchParams(window.location.search).get(PARAM);
    const first = MODEL_CATALOG.find(m => m.id === requested) ?? MODEL_CATALOG[0];
    if (first) await this.show(first);

    // Shader-animated models (the gulls) run off the clock the render pipeline ticks in the scenes
    const clock = new THREE.Clock();
    this.startAnimationLoop(renderer, scene, camera, controls, () => {
      sharedUniforms.uTime.value += clock.getDelta();
    });
  }

  private async show(entry: ModelEntry): Promise<void> {
    const token = ++this.loadToken;
    const component = entry.create();
    const object = await component.load();
    if (token !== this.loadToken) {
      component.dispose?.();
      return;
    }

    this.clearCurrent();
    object.scale.multiplyScalar(entry.scale ?? 1);

    // Stand the model on the grid, centred under the orbit target
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Group();
    object.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
    pivot.add(object);
    this.options.scene.add(pivot);
    this.current = { entry, object: pivot, dispose: () => component.dispose?.() };

    const size = box.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.z, size.y);
    this.grid = new THREE.GridHelper(extent * 2, 20, 0x666666, 0xaaaaaa);
    this.options.scene.add(this.grid);
    this.frame(size);

    this.updatePanel(entry, size, countTriangles(pivot));
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, entry.id);
    window.history.replaceState(null, '', url);
  }

  /** Point the camera at the model from three-quarters above, far enough to fit it */
  private frame(size: THREE.Vector3): void {
    const { camera, controls } = this.options;
    const target = new THREE.Vector3(0, size.y / 2, 0);
    const radius = size.length() / 2;
    const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.1;
    const direction = new THREE.Vector3(1, 0.6, 1).normalize();

    camera.position.copy(target).addScaledVector(direction, distance);
    controls.target.copy(target);
    controls.minDistance = radius * 0.5;
    controls.maxDistance = distance * 4;
    controls.update();
  }

  private clearCurrent(): void {
    if (this.current) {
      this.options.scene.remove(this.current.object);
      this.current.dispose?.();
      this.current = undefined;
    }
    if (this.grid) {
      this.options.scene.remove(this.grid);
      this.grid.dispose();
      this.grid = undefined;
    }
  }

  private step(delta: number): void {
    const index = MODEL_CATALOG.findIndex(m => m.id === this.current?.entry.id);
    const next = MODEL_CATALOG[(index + delta + MODEL_CATALOG.length) % MODEL_CATALOG.length];
    if (next) void this.show(next);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') this.step(1);
    if (event.key === 'ArrowLeft') this.step(-1);
    if (event.key === ' ') this.options.controls.autoRotate = !this.options.controls.autoRotate;
  };

  private buildPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'models-panel';

    const groups = new Map<string, ModelEntry[]>();
    MODEL_CATALOG.forEach(m => groups.set(m.group, [...(groups.get(m.group) ?? []), m]));
    groups.forEach((entries, group) => {
      const heading = document.createElement('h3');
      heading.textContent = group;
      panel.appendChild(heading);
      entries.forEach(entry => {
        const button = document.createElement('button');
        button.textContent = entry.name;
        button.dataset['id'] = entry.id;
        button.addEventListener('click', () => void this.show(entry));
        panel.appendChild(button);
      });
    });

    const hint = document.createElement('p');
    hint.className = 'models-hint';
    hint.textContent = '← → step · space spins';
    panel.appendChild(hint);

    const info = document.createElement('div');
    info.className = 'models-info';
    document.body.appendChild(info);
    document.body.appendChild(panel);
    this.panel = panel;
    this.info = info;
  }

  private updatePanel(entry: ModelEntry, size: THREE.Vector3, triangles: number): void {
    this.panel?.querySelectorAll('button').forEach(b => {
      b.classList.toggle('selected', b.dataset['id'] === entry.id);
    });
    if (this.info) {
      const dims = [size.x, size.y, size.z].map(v => v.toFixed(1)).join(' × ');
      this.info.innerHTML = `<strong>${entry.name}</strong><span>${dims} units · ${triangles.toLocaleString()} triangles</span>`;
    }
  }

  public override dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.clearCurrent();
    this.panel?.remove();
    this.info?.remove();
    super.dispose();
  }
}

function countTriangles(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry as THREE.BufferGeometry;
    const vertices = geometry.index ? geometry.index.count : geometry.attributes['position']?.count;
    const instances = child instanceof THREE.InstancedMesh ? child.count : 1;
    triangles += Math.floor((vertices ?? 0) / 3) * instances;
  });
  return triangles;
}

const viewer = new ModelsViewer();

const Models = {
  load: (options: StoryOptions) => viewer.load(options),
  dispose: () => viewer.dispose(),
};

export default Models;
