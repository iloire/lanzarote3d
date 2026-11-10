import * as THREE from 'three';
import { getTerrainHeight } from '../../../shared/env/mesh-utils';

export interface GiantRobotSettings {
  /** World units from its feet to the top of its head */
  height: number;
  /** World units a second once it's into its stride */
  speed: number;
  /** Seconds it takes to rise up out of the ground at the first point */
  riseSeconds: number;
  /** The closed loop it runs, in world x/z; it rises at the first point */
  route: { x: number; z: number }[];
}

/** One limb: a pivot at the joint with a box hanging below it, and the next joint at its end */
const limb = (
  material: THREE.Material,
  width: number,
  length: number,
  depth: number
): { pivot: THREE.Group; end: THREE.Group } => {
  const pivot = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, length, depth), material);
  box.position.y = -length / 2;
  pivot.add(box);
  const end = new THREE.Group();
  end.position.y = -length;
  pivot.add(end);
  return { pivot, end };
};

const box = (
  material: THREE.Material,
  [w, h, d]: [number, number, number],
  [x, y, z]: [number, number, number]
): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
};

type Side = { hip: THREE.Group; knee: THREE.Group; shoulder: THREE.Group; elbow: THREE.Group };

/**
 * A giant robot, built at a height of 1 and scaled up, that rises out of the ground and then
 * runs a loop round the island with its feet on the terrain (or the sea floor at sea level).
 * Faces +z; `focus` follows its chest, for a camera to chase.
 */
export class GiantRobot {
  readonly mesh = new THREE.Group();
  /** A point at chest height that moves with it */
  readonly focus = new THREE.Object3D();

  private readonly curve: THREE.CatmullRomCurve3;
  private readonly length: number;
  private readonly hips = new THREE.Group();
  private readonly torso = new THREE.Group();
  private readonly head = new THREE.Group();
  private readonly sides: [Side, Side];
  private readonly materials: THREE.Material[];
  private readonly at = new THREE.Vector3();
  private readonly tangent = new THREE.Vector3();
  private state: 'waiting' | 'rising' | 'running' = 'waiting';
  private delay = 0;
  private time = 0;
  /** Arc length run along the loop, in world units */
  private travelled = 0;
  private velocity = 0;
  /** Radians through the stride: one left and one right step per turn */
  private phase = 0;
  private groundY = NaN;
  private yaw = 0;

  constructor(
    private readonly terrain: THREE.Mesh,
    private readonly settings: GiantRobotSettings
  ) {
    this.mesh.name = 'giant-robot';
    this.focus.name = 'robot';
    this.curve = new THREE.CatmullRomCurve3(
      settings.route.map(({ x, z }) => new THREE.Vector3(x, 0, z)),
      true,
      'centripetal'
    );
    this.length = this.curve.getLength();

    const armour = new THREE.MeshStandardMaterial({
      color: 0x8a929c,
      metalness: 0.7,
      roughness: 0.35,
      flatShading: true,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x2b2f36,
      metalness: 0.5,
      roughness: 0.6,
      flatShading: true,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: 0xd8462b,
      metalness: 0.3,
      roughness: 0.5,
      flatShading: true,
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0xff3a1a });
    this.materials = [armour, dark, trim, glow];

    // Hips at 0.48, legs 0.24 + 0.22 + a 0.03 foot below them, body and head above
    this.hips.position.y = 0.48;
    this.hips.add(box(dark, [0.3, 0.08, 0.16], [0, 0, 0]));
    this.torso.position.y = 0.03;
    this.hips.add(this.torso);
    this.torso.add(box(dark, [0.2, 0.1, 0.13], [0, 0.06, 0]));
    this.torso.add(box(armour, [0.38, 0.22, 0.22], [0, 0.21, 0]));
    this.torso.add(box(trim, [0.2, 0.08, 0.02], [0, 0.22, 0.115]));
    this.torso.add(box(glow, [0.06, 0.06, 0.02], [0, 0.22, 0.125]));
    this.head.position.y = 0.33;
    this.torso.add(this.head);
    this.head.add(box(dark, [0.06, 0.03, 0.06], [0, 0.015, 0]));
    this.head.add(box(armour, [0.13, 0.11, 0.13], [0, 0.085, 0]));
    this.head.add(box(glow, [0.11, 0.022, 0.02], [0, 0.095, 0.066]));
    this.head.add(box(trim, [0.012, 0.09, 0.012], [0.045, 0.18, -0.03]));

    const side = (sign: 1 | -1): Side => {
      const thigh = limb(armour, 0.1, 0.24, 0.12);
      thigh.pivot.position.set(sign * 0.09, -0.02, 0);
      this.hips.add(thigh.pivot);
      const shin = limb(armour, 0.09, 0.22, 0.11);
      thigh.end.add(shin.pivot);
      shin.pivot.add(box(trim, [0.1, 0.05, 0.03], [0, -0.04, 0.06]));
      shin.end.add(box(dark, [0.11, 0.03, 0.18], [0, -0.005, 0.03]));

      const pad = box(trim, [0.12, 0.07, 0.15], [sign * 0.25, 0.33, 0]);
      this.torso.add(pad);
      const upper = limb(armour, 0.07, 0.18, 0.08);
      upper.pivot.position.set(sign * 0.25, 0.3, 0);
      this.torso.add(upper.pivot);
      const fore = limb(armour, 0.075, 0.16, 0.085);
      upper.end.add(fore.pivot);
      fore.end.add(box(dark, [0.08, 0.07, 0.08], [0, -0.03, 0]));
      return { hip: thigh.pivot, knee: shin.pivot, shoulder: upper.pivot, elbow: fore.pivot };
    };
    this.sides = [side(1), side(-1)];

    this.mesh.add(this.hips);
    this.mesh.scale.setScalar(settings.height);
    this.mesh.visible = false;
    this.curve.getPointAt(0, this.at);
    this.mesh.position.copy(this.at);
    this.focus.position.copy(this.at).setY(settings.height * 0.6);
  }

  /** Starts it rising after `delay` seconds */
  wake(delay = 0): void {
    if (this.state !== 'waiting') return;
    this.delay = delay;
    this.state = 'rising';
    this.time = 0;
  }

  update(deltaTime: number): void {
    if (this.state === 'waiting') return;
    if (this.delay > 0) {
      this.delay -= deltaTime;
      return;
    }
    this.time += deltaTime;
    const { height, speed, riseSeconds } = this.settings;

    if (this.state === 'running') {
      // Eases into its stride over the first few seconds
      this.velocity = Math.min(speed, this.velocity + speed * 0.25 * deltaTime);
      this.travelled = (this.travelled + this.velocity * deltaTime) % this.length;
    }
    const u = this.travelled / this.length;
    this.curve.getPointAt(u, this.at);
    this.curve.getTangentAt(u, this.tangent);

    const ground = getTerrainHeight(this.at.x, this.at.z, this.terrain);
    // Out at sea it wades on the sea floor at sea level
    const target = Number.isNaN(ground) ? 0 : Math.max(ground, 0);
    this.groundY = Number.isNaN(this.groundY)
      ? target
      : this.groundY + (target - this.groundY) * Math.min(1, deltaTime * 4);

    const wantYaw = Math.atan2(this.tangent.x, this.tangent.z);
    if (this.state === 'rising' && this.time <= deltaTime) this.yaw = wantYaw;
    let turn = wantYaw - this.yaw;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    this.yaw += turn * Math.min(1, deltaTime * 2);

    let sink = 0;
    if (this.state === 'rising') {
      const t = Math.min(1, this.time / riseSeconds);
      // Out of the ground with a slow start, a heave in the middle and a settle at the top
      sink = -height * 1.05 * (1 - t * t * (3 - 2 * t));
      this.mesh.visible = true;
      // Looks round as it comes up
      this.head.rotation.y = Math.sin(this.time * 1.3) * 0.5 * (1 - t);
      if (t >= 1) {
        this.state = 'running';
        this.head.rotation.y = 0;
      }
    }

    this.mesh.position.set(this.at.x, this.groundY + sink, this.at.z);
    this.mesh.rotation.y = this.yaw;
    this.pose(deltaTime);

    this.focus.position.set(this.at.x, this.groundY + sink + height * 0.6, this.at.z);
  }

  /** Swings the legs and arms through a running stride matched to its speed */
  private pose(deltaTime: number): void {
    const stride = this.settings.height * 0.9;
    this.phase += (this.velocity / stride) * Math.PI * 2 * deltaTime;
    const run = this.velocity / this.settings.speed;
    this.sides.forEach(({ hip, knee, shoulder, elbow }, i) => {
      const p = this.phase + i * Math.PI;
      const swing = Math.sin(p);
      // Forward is a negative turn about x; the knee only folds back, most as the leg comes through
      hip.rotation.x = -swing * 0.7 * run;
      knee.rotation.x = Math.max(0, Math.cos(p)) * 1.3 * run;
      shoulder.rotation.x = swing * 0.8 * run;
      elbow.rotation.x = -(0.4 + 0.6 * run);
    });
    // Bounces twice a stride, leans into the run and twists against the arms
    this.hips.position.y = 0.48 + Math.abs(Math.cos(this.phase)) * 0.025 * run;
    this.torso.rotation.x = 0.18 * run;
    this.torso.rotation.y = Math.sin(this.phase) * 0.12 * run;
  }

  dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
    this.materials.forEach(material => material.dispose());
    this.mesh.removeFromParent();
    this.focus.removeFromParent();
  }
}
