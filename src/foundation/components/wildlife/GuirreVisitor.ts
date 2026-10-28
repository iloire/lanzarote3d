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

/**
 * Where it flies on a visit, as points off the companion in spans of its wing: [out to the
 * side, up, forward]. The visit's time is shared out between the points in turn; the side is
 * mirrored when it comes in on the other wing.
 */
type VisitPattern = [number, number, number][];

export const VISIT_PATTERNS: Record<string, VisitPattern> = {
  // Off the wingtip, a touch above
  wingtip: [[0.7, 0.25, 0]],
  // Out ahead of the leading edge, as if showing the way
  leading: [[0.6, 0.1, 0.45]],
  // Riding over the top of the canopy, a little behind
  overhead: [[0.15, 0.75, -0.2]],
  // Starts off one wingtip, rises over the canopy and settles off the other
  crossover: [
    [0.7, 0.25, 0],
    [0.1, 0.65, 0],
    [-0.7, 0.25, 0],
  ],
  // Drops back behind the wingtip, then draws up level with it
  overtake: [
    [0.75, 0.3, -0.5],
    [0.7, 0.2, 0.1],
  ],
};

export interface GuirreVisitorOptions {
  /** Its span as a share of the companion's wing: a guirre is ~1.7 m to a paraglider's ~11 m */
  wingspan?: number;
  /** Radius and airspeed of its circles over the companion, and how high above it they are */
  radius?: number;
  speed?: number;
  height?: number;
  /** False for a bird that only keeps the companion distant company, never coming in */
  visits?: boolean;
  /** Seconds keeping away, circling, between visits, [min, max] */
  circling?: [number, number];
  /** Seconds gliding with the companion on each visit, [min, max] */
  alongside?: [number, number];
}

const DEFAULTS: Required<GuirreVisitorOptions> = {
  wingspan: 0.144,
  radius: 200,
  speed: 11,
  height: 150,
  visits: true,
  circling: [20, 40],
  alongside: [15, 25],
};

// Circling over a pilot who is flying along means a faster ground speed downwind
const CIRCLING: SteerLimits = { gain: 0.3, response: 1, maxSpeed: 28, maxAccel: 4 };
const JOINING: SteerLimits = { gain: 0.3, response: 1, maxSpeed: 25, maxAccel: 5 };
const ALONGSIDE: SteerLimits = { gain: 0.6, response: 1.5, maxSpeed: 22, maxAccel: 6 };
/** Gives up a visit it can't complete in this long and goes back to circling */
const JOIN_TIMEOUT = 40;
const MAX_BANK = 0.7;
const GRAVITY = 9.8;

const rand = ([min, max]: [number, number]) => THREE.MathUtils.lerp(min, max, Math.random());

/**
 * A guirre that keeps a paraglider company: it circles well above the pilot for a while,
 * comes down to glide close by for a bit, in one of `VISIT_PATTERNS` and never the same one
 * twice running, climbs away back to its circles and does it all again. The circles travel
 * with the pilot, so it never strays far. Moved on the CPU each frame, as it has to see where
 * the pilot is; a single bird, so that costs nothing.
 */
export class GuirreVisitor {
  readonly mesh: THREE.Mesh;
  private readonly o: Required<GuirreVisitorOptions>;
  private readonly span: number;
  private readonly pos = new THREE.Vector3();
  private readonly vel = new THREE.Vector3();
  private readonly accel = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly targetVel = new THREE.Vector3();
  private readonly companionPos = new THREE.Vector3();
  private readonly companionVel = new THREE.Vector3();
  private readonly lastCompanionPos = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly side = new THREE.Vector3();
  private phase: VisitorPhase = 'circling';
  private timer: number;
  private visitLength = 0;
  private pattern = 'wingtip';
  private angle = 0;
  private turn = 1;
  private wing = 1;
  private bank = 0;

  constructor(
    private readonly companion: THREE.Object3D,
    options: GuirreVisitorOptions = {}
  ) {
    this.o = { ...DEFAULTS, ...options };
    // Sized and placed from the companion's wing, as the gliders are drawn well over life size
    const size = new THREE.Box3().setFromObject(companion).getSize(new THREE.Vector3());
    this.span = Math.max(size.x, size.z, 10);
    const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(createGullGeometry(this.span * this.o.wingspan, GUIRRE), material);
    this.mesh.name = 'guirre-visitor';

    companion.getWorldPosition(this.companionPos);
    this.angle = Math.random() * Math.PI * 2;
    this.pos
      .set(
        Math.cos(this.angle) * this.o.radius,
        this.o.height,
        Math.sin(this.angle) * this.o.radius
      )
      .add(this.companionPos);
    this.vel.set(0, 0, this.o.speed);
    // The first visit comes sooner, so it's seen
    this.timer = rand([10, 20]);
    this.update(0);
  }

  get currentPhase(): VisitorPhase {
    return this.phase;
  }

  get currentPattern(): string {
    return this.pattern;
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
      this.target.set(c * this.o.radius, this.o.height, s * this.o.radius).add(this.companionPos);
      this.targetVel
        .set(-s, 0, c)
        .multiplyScalar(this.turn * this.o.speed)
        .add(this.companionVel);
      if (this.timer <= 0 && this.o.visits) this.startVisit();
    } else {
      const points = VISIT_PATTERNS[this.pattern]!;
      // Joining heads for the first point; alongside steps through them as the visit runs
      const step =
        this.phase === 'joining'
          ? 0
          : Math.min(
              points.length - 1,
              Math.floor((1 - this.timer / this.visitLength) * points.length)
            );
      const [out, up, ahead] = points[step]!;
      this.target
        .copy(this.companionPos)
        .addScaledVector(this.side, this.wing * out * this.span)
        .addScaledVector(this.forward, ahead * this.span);
      this.target.y += up * this.span;
      this.targetVel.copy(this.companionVel);
      if (this.phase === 'joining') {
        if (this.pos.distanceTo(this.target) < this.span * 0.3) {
          this.phase = 'alongside';
          this.visitLength = this.timer = rand(this.o.alongside);
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
    // The companion's heading, flat, and its right: the heading turned a quarter round
    this.forward.set(this.companionVel.x, 0, this.companionVel.z);
    if (this.forward.lengthSq() < 1e-6) this.forward.set(0, 0, 1);
    this.forward.normalize();
    this.side.set(-this.forward.z, 0, this.forward.x);
  }

  private startVisit(): void {
    this.phase = 'joining';
    this.timer = JOIN_TIMEOUT;
    this.wing = Math.random() < 0.5 ? -1 : 1;
    const others = Object.keys(VISIT_PATTERNS).filter(name => name !== this.pattern);
    this.pattern = others[Math.floor(Math.random() * others.length)]!;
  }

  /** Back to circling, picking the circle up from where it is now so it doesn't cut across */
  private leave(): void {
    this.phase = 'circling';
    this.timer = rand(this.o.circling);
    this.angle = Math.atan2(this.pos.z - this.companionPos.z, this.pos.x - this.companionPos.x);
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
