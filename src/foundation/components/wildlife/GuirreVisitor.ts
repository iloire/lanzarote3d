import * as THREE from 'three';
import { createGullGeometry, GUIRRE } from './Gulls';

export interface SteerLimits {
  /** How hard the bird closes on where it wants to be, per second */
  gain: number;
  /** How quickly its velocity follows the one it wants, per second */
  response: number;
  maxSpeed: number;
  maxAccel: number;
}

const desired = new THREE.Vector3();

/**
 * One step of a bird flying to a moving point: it wants the point's own velocity plus a pull
 * towards it, capped at its top speed, and turns and speeds up towards that within its limits.
 * Far away it flies straight there flat out; close in it settles alongside without overshooting.
 * Moves `pos` and `vel` in place and writes the acceleration it used into `accel`.
 */
export function steer(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  target: THREE.Vector3,
  targetVel: THREE.Vector3,
  dt: number,
  limits: SteerLimits,
  accel: THREE.Vector3
): void {
  desired
    .subVectors(target, pos)
    .multiplyScalar(limits.gain)
    .add(targetVel)
    .clampLength(0, limits.maxSpeed);
  accel.subVectors(desired, vel).multiplyScalar(limits.response).clampLength(0, limits.maxAccel);
  vel.addScaledVector(accel, dt).clampLength(0, limits.maxSpeed);
  pos.addScaledVector(vel, dt);
}

export type VisitorPhase = 'circling' | 'joining' | 'alongside';

export interface GuirreVisitorOptions {
  wingspan?: number;
  /** Radius and airspeed of its circles round `home` */
  radius?: number;
  speed?: number;
  /** Seconds circling between visits, [min, max] */
  circling?: [number, number];
  /** Seconds gliding alongside the companion on each visit, [min, max] */
  alongside?: [number, number];
}

const DEFAULTS: Required<GuirreVisitorOptions> = {
  wingspan: 5,
  radius: 110,
  speed: 11,
  circling: [35, 60],
  alongside: [15, 25],
};

const CIRCLING: SteerLimits = { gain: 0.3, response: 1, maxSpeed: 16, maxAccel: 4 };
const JOINING: SteerLimits = { gain: 0.25, response: 1, maxSpeed: 22, maxAccel: 5 };
const ALONGSIDE: SteerLimits = { gain: 0.6, response: 1.5, maxSpeed: 22, maxAccel: 6 };
/** Gives up a visit it can't complete in this long and goes back to circling */
const JOIN_TIMEOUT = 90;
const MAX_BANK = 0.7;
const GRAVITY = 9.8;

const rand = ([min, max]: [number, number]) => THREE.MathUtils.lerp(min, max, Math.random());

/**
 * A guirre that keeps a paraglider company: it circles its patch of sky for a while, then
 * flies over to the pilot, glides just off one wingtip for a bit, peels away back to its
 * circles and does it all again. Moved on the CPU each frame, as it has to see where the pilot
 * is; a single bird, so that costs nothing.
 */
export class GuirreVisitor {
  readonly mesh: THREE.Mesh;
  private readonly o: Required<GuirreVisitorOptions>;
  private readonly pos = new THREE.Vector3();
  private readonly vel = new THREE.Vector3();
  private readonly accel = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly targetVel = new THREE.Vector3();
  private readonly companionPos = new THREE.Vector3();
  private readonly companionVel = new THREE.Vector3();
  private readonly lastCompanionPos = new THREE.Vector3();
  private readonly side = new THREE.Vector3();
  /** Where it sits off the companion: out past the wingtip and a touch above */
  private readonly sideOffset: number;
  private readonly upOffset: number;
  private phase: VisitorPhase = 'circling';
  private timer: number;
  private angle = 0;
  private turn = 1;
  private wing = 1;
  private bank = 0;

  constructor(
    private readonly home: THREE.Vector3,
    private readonly companion: THREE.Object3D,
    options: GuirreVisitorOptions = {}
  ) {
    this.o = { ...DEFAULTS, ...options };
    const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(createGullGeometry(this.o.wingspan, GUIRRE), material);
    this.mesh.name = 'guirre-visitor';

    const size = new THREE.Box3().setFromObject(companion).getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z, this.o.wingspan * 2);
    this.sideOffset = span * 0.9;
    this.upOffset = span * 0.25;

    companion.getWorldPosition(this.companionPos);
    this.pos.set(home.x + this.o.radius, home.y, home.z);
    this.vel.set(0, 0, this.o.speed);
    // The first visit comes sooner, so it's seen
    this.timer = rand([10, 20]);
    this.update(0);
  }

  get currentPhase(): VisitorPhase {
    return this.phase;
  }

  get position(): THREE.Vector3 {
    return this.pos;
  }

  update(dt: number): void {
    this.trackCompanion(dt);
    this.timer -= dt;

    if (this.phase === 'circling') {
      this.angle += (this.turn * this.o.speed * dt) / this.o.radius;
      const c = Math.cos(this.angle);
      const s = Math.sin(this.angle);
      this.target.set(
        this.home.x + c * this.o.radius,
        this.home.y,
        this.home.z + s * this.o.radius
      );
      this.targetVel.set(-s, 0, c).multiplyScalar(this.turn * this.o.speed);
      if (this.timer <= 0) this.startVisit();
    } else {
      this.target
        .copy(this.companionPos)
        .addScaledVector(this.side, this.wing * this.sideOffset)
        .setY(this.target.y + this.upOffset);
      this.targetVel.copy(this.companionVel);
      if (this.phase === 'joining') {
        if (this.pos.distanceTo(this.target) < this.sideOffset * 0.6) {
          this.phase = 'alongside';
          this.timer = rand(this.o.alongside);
        } else if (this.timer <= 0) {
          this.leave();
        }
      } else if (this.timer <= 0) {
        this.leave();
      }
    }

    const limits =
      this.phase === 'circling' ? CIRCLING : this.phase === 'joining' ? JOINING : ALONGSIDE;
    if (dt > 0) steer(this.pos, this.vel, this.target, this.targetVel, dt, limits, this.accel);
    this.orient(dt);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  private trackCompanion(dt: number): void {
    this.lastCompanionPos.copy(this.companionPos);
    this.companion.getWorldPosition(this.companionPos);
    if (dt > 0) {
      const raw = this.lastCompanionPos.sub(this.companionPos).divideScalar(-dt);
      this.companionVel.lerp(raw, 1 - Math.exp(-dt * 3));
    }
    // The companion's right, flat: its heading turned a quarter round
    this.side.set(-this.companionVel.z, 0, this.companionVel.x);
    if (this.side.lengthSq() < 1e-6) this.side.set(1, 0, 0);
    this.side.normalize();
  }

  private startVisit(): void {
    this.phase = 'joining';
    this.timer = JOIN_TIMEOUT;
    this.wing = Math.random() < 0.5 ? -1 : 1;
  }

  /** Back to circling, picking the circle up from where it is now so it doesn't cut across */
  private leave(): void {
    this.phase = 'circling';
    this.timer = rand(this.o.circling);
    this.angle = Math.atan2(this.pos.z - this.home.z, this.pos.x - this.home.x);
    this.turn = Math.random() < 0.5 ? -1 : 1;
  }

  /** Nose along its flight path, banked into the turn as a glider would be */
  private orient(dt: number): void {
    const v = this.vel;
    const flat = Math.hypot(v.x, v.z);
    if (flat < 0.1) return;
    // Rate of turn from the sideways part of the acceleration; a coordinated turn's bank
    const yawRate = (v.z * this.accel.x - v.x * this.accel.z) / (flat * flat);
    const bank = THREE.MathUtils.clamp(Math.atan((-yawRate * flat) / GRAVITY), -MAX_BANK, MAX_BANK);
    this.bank += (bank - this.bank) * (1 - Math.exp(-dt * 2));
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(-Math.atan2(v.y, flat), Math.atan2(v.x, v.z), this.bank, 'YXZ');
  }
}
