import * as THREE from 'three';

export interface HeroSettings {
  /** How far right the lead pilot sits, as a fraction of the frame width from the centre */
  frameShift: number;
  /** Largest swing of the camera round the pilot as the host's pointer reaches an edge */
  yaw: number;
  pitch: number;
  /** How quickly the camera catches up with the pointer, per second */
  response: number;
}

/** Messages the host page posts to the scene: its pointer, and whether the hero is on screen */
type HostMessage =
  | { type: 'lz:pointer'; x: number; y: number }
  | { type: 'lz:visible'; visible: boolean };

const isHostMessage = (data: unknown): data is HostMessage => {
  const m = data as HostMessage | null;
  if (m?.type === 'lz:pointer') return Number.isFinite(m.x) && Number.isFinite(m.y);
  return m?.type === 'lz:visible' && typeof m.visible === 'boolean';
};

/**
 * The home scene as a page's hero background (?embed=hero). The host page can't click
 * through to the scene, so it posts its pointer instead, -1..1 on each axis, and the camera
 * leans round the pilot after it. The frame is shifted so the pilot flies to the right of
 * the host's text, and the host hears `lz:ready` once there's a picture worth showing. While
 * the host has scrolled the hero away the scene stops drawing.
 */
export class HeroEmbed {
  private readonly pointer = new THREE.Vector2();
  private readonly lean = new THREE.Vector2();
  private readonly savedPosition = new THREE.Vector3();
  private readonly savedQuaternion = new THREE.Quaternion();
  private readonly offset = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();
  /** The host has scrolled the hero out of view */
  paused = false;
  private readonly onMessage = (e: MessageEvent) => {
    if (e.source !== window.parent || !isHostMessage(e.data)) return;
    if (e.data.type === 'lz:visible') {
      this.paused = !e.data.visible;
      return;
    }
    this.pointer.set(
      THREE.MathUtils.clamp(e.data.x, -1, 1),
      THREE.MathUtils.clamp(e.data.y, -1, 1)
    );
  };
  private readonly onResize = () => this.frame();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly settings: HeroSettings
  ) {
    window.addEventListener('message', this.onMessage);
    // After the app's own resize handler, which resets the aspect
    window.addEventListener('resize', this.onResize);
    this.frame();
  }

  /** Tells the host page the scene is drawn */
  ready(): void {
    window.parent.postMessage({ type: 'lz:ready' }, '*');
  }

  /** Eases the lean towards the pointer */
  update(deltaTime: number): void {
    this.lean.lerp(this.pointer, 1 - Math.exp(-this.settings.response * deltaTime));
  }

  /** Swings the camera round `target` by the lean, until `restore` */
  apply(target: THREE.Vector3): void {
    this.savedPosition.copy(this.camera.position);
    this.savedQuaternion.copy(this.camera.quaternion);
    this.spherical.setFromVector3(this.offset.subVectors(this.camera.position, target));
    this.spherical.theta -= this.lean.x * this.settings.yaw;
    this.spherical.phi = THREE.MathUtils.clamp(
      this.spherical.phi + this.lean.y * this.settings.pitch,
      0.1,
      Math.PI - 0.1
    );
    this.camera.position.copy(target).add(this.offset.setFromSpherical(this.spherical));
    this.camera.lookAt(target);
  }

  restore(): void {
    this.camera.position.copy(this.savedPosition);
    this.camera.quaternion.copy(this.savedQuaternion);
  }

  dispose(): void {
    window.removeEventListener('message', this.onMessage);
    window.removeEventListener('resize', this.onResize);
    this.camera.clearViewOffset();
  }

  /** A lens shift: the pilot at the centre of the view lands right of the frame's centre */
  private frame(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.setViewOffset(width, height, -this.settings.frameShift * width, 0, width, height);
  }
}
