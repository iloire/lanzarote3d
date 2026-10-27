import * as THREE from 'three';

const GRAVITY = 9.81;
const MAX_BANK = THREE.MathUtils.degToRad(35);
/** The most a wingover may add the path's bank up to */
const MAX_WINGOVER_BANK = THREE.MathUtils.degToRad(80);
/** How fast the bank follows the turn, per second: a wing rolls in over a second or two */
const BANK_RESPONSE = 1.5;
/** The pilot's pendulum under the wing: natural frequency in rad/s (a ~3 s period) and damping ratio */
const SWING_FREQUENCY = 2.1;
const SWING_DAMPING = 0.22;
const MAX_SWING = THREE.MathUtils.degToRad(25);
/** How fast the measured speed and acceleration are smoothed, per second */
const SPEED_SMOOTHING = 3;

/**
 * Wingovers flown on top of the path, now and then: the wing weaves `sway` to each side once a
 * `period`, banking up to `bank` as it turns back at each end, where it also climbs `climb`
 * above the path, and diving through the middle. A burst is a random whole number of them
 * between `turns`, eased in and out over half a period, then the pilot rests for a random time
 * between `rest`, in seconds.
 */
export type WingoverSettings = {
  period: number;
  sway: number;
  climb: number;
  bank: number;
  turns: [number, number];
  rest: [number, number];
};

/**
 * A twist thrown now and then: holding the risers, the pilot spins half a turn round the hang
 * line to fly looking backwards while the wing flies on. The spin takes `spin` seconds each
 * way, the pilot holds it for a random time between `hold`, spins back the way they came and
 * rests for a random time between `rest`, in seconds.
 */
export type TwistSettings = {
  spin: number;
  hold: [number, number];
  rest: [number, number];
};

const randomBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/**
 * A damped pendulum, integrated in absolute angle: it is pulled towards `target` and damped
 * against the motion of its pivot, so the pilot lags a moving wing, overshoots and settles.
 */
class Pendulum {
  angle = 0;
  private rate = 0;

  step(deltaTime: number, target: number, targetRate: number): void {
    const acceleration =
      -SWING_FREQUENCY * SWING_FREQUENCY * (this.angle - target) -
      2 * SWING_DAMPING * SWING_FREQUENCY * (this.rate - targetRate);
    this.rate += acceleration * deltaTime;
    this.angle += this.rate * deltaTime;
  }
}

/**
 * Makes a paraglider fly like one on top of the path it follows: it banks into turns by the
 * coordinated-turn angle for its speed, and the pilot swings gently under the wing and rides
 * small lift bumps. It moves `body`, a group inside the rig that FlyingBehavior steers.
 *
 * Given `pilotSwing`, a pivot at the carabiners that the pilot hangs from (X right, Y up, -Z
 * forward), the pilot also swings on a pendulum of its own: the wing rolls into a turn first
 * and the pilot swings out after it, overshoots and settles; speeding up or slowing down
 * swings the pilot back or forward.
 */
export class ParagliderMotion {
  private readonly forward = new THREE.Vector3();
  private readonly lastPosition = new THREE.Vector3();
  private lastHeading: number | null = null;
  /** The bank the path's turns call for */
  private pathBank = 0;
  /** That plus the wingover's, which the wing flies */
  private bank = 0;
  private speedMeasured: number | null = null;
  private acceleration = 0;
  private readonly roll = new Pendulum();
  private readonly pitch = new Pendulum();
  // A random phase per pilot so they don't sway in step.
  private time = Math.random() * 100;
  /** Seconds into the current burst of wingovers, or null while resting */
  private burstTime: number | null = null;
  private burstLength = 0;
  private restLeft: number;
  private readonly weaveLast = { x: 0, y: 0 };
  /** Seconds into the current twist, or null while facing forward */
  private twistTime: number | null = null;
  private twistLength = 0;
  private twistDirection = 1;
  private twistRestLeft: number;

  constructor(
    private readonly rig: THREE.Object3D,
    private readonly body: THREE.Object3D,
    private readonly speed: number,
    private readonly pilotSwing?: THREE.Object3D,
    private readonly wingover?: WingoverSettings,
    private readonly twist?: TwistSettings
  ) {
    // Yaw before banking and pitching, as a wing weaving across its path does
    body.rotation.order = 'YXZ';
    // The pilot twists round the hang line first, then swings on it
    if (pilotSwing) pilotSwing.rotation.order = 'XZY';
    // Somewhere into a rest, so the pilots don't start their wingovers together
    this.restLeft = wingover ? Math.random() * wingover.rest[1] : 0;
    this.twistRestLeft = twist ? Math.random() * twist.rest[1] : 0;
  }

  /** The wing's bank in radians, positive in a left turn */
  get bankAngle(): number {
    return this.bank;
  }

  /** Twists now, if this pilot twists and isn't already, instead of waiting out the rest */
  startTwist(): void {
    if (this.twistTime === null) this.twistRestLeft = 0;
  }

  update(deltaTime: number): void {
    if (deltaTime <= 0) return;
    this.time += deltaTime;

    // The rig flies along -Z; heading grows as it turns left.
    this.forward.set(0, 0, -1).applyQuaternion(this.rig.quaternion);
    const heading = Math.atan2(this.forward.x, this.forward.z);
    let turnRate = 0;
    if (this.lastHeading !== null) {
      const delta = THREE.MathUtils.euclideanModulo(
        heading - this.lastHeading + Math.PI,
        Math.PI * 2
      );
      turnRate = (delta - Math.PI) / deltaTime;
    }
    this.lastHeading = heading;

    const targetBank = THREE.MathUtils.clamp(
      Math.atan((this.speed * turnRate) / GRAVITY),
      -MAX_BANK,
      MAX_BANK
    );
    this.pathBank += (targetBank - this.pathBank) * Math.min(1, deltaTime * BANK_RESPONSE);
    const weave = this.flyWingover(deltaTime);
    const lastBank = this.bank;
    this.bank = THREE.MathUtils.clamp(
      this.pathBank + weave.bank,
      -MAX_WINGOVER_BANK,
      MAX_WINGOVER_BANK
    );
    const bankRate = (this.bank - lastBank) / deltaTime;

    // Positive roll about the rig's Z lowers the left wing, which is a left turn here.
    this.body.rotation.z = this.bank + Math.sin(this.time * 0.9) * 0.03;
    this.body.rotation.x = weave.pitch + Math.sin(this.time * 0.6) * 0.04;
    this.body.rotation.y = weave.yaw;
    this.body.position.x = weave.x;
    this.body.position.y =
      weave.y + Math.sin(this.time * 0.35) * 1.5 + Math.sin(this.time * 0.9) * 0.4;

    if (this.pilotSwing) this.swingPilot(this.pilotSwing, deltaTime, bankRate);
  }

  /**
   * Where the wingover puts the wing off the path, and how it is turned. Across the path it
   * runs x = sway·sin φ, so it turns hardest, and banks most, at the ends, where it is also
   * highest: y = -climb·cos 2φ. Both are eased in and out at the ends of a burst, and heading
   * and pitch follow the wing's movement.
   */
  private flyWingover(deltaTime: number): {
    x: number;
    y: number;
    bank: number;
    yaw: number;
    pitch: number;
  } {
    const still = { x: 0, y: 0, bank: 0, yaw: 0, pitch: 0 };
    if (!this.wingover) return still;
    const { period, sway, climb, bank, turns, rest } = this.wingover;

    if (this.burstTime === null) {
      this.restLeft -= deltaTime;
      if (this.restLeft > 0) return still;
      this.burstTime = 0;
      this.burstLength = period * Math.round(randomBetween(turns));
      this.weaveLast.x = this.weaveLast.y = 0;
    }
    this.burstTime += deltaTime;
    const time = this.burstTime;
    if (time >= this.burstLength) {
      this.burstTime = null;
      this.restLeft = randomBetween(rest);
      return still;
    }

    const ease = period / 2;
    const envelope =
      THREE.MathUtils.smoothstep(time, 0, ease) *
      THREE.MathUtils.smoothstep(this.burstLength - time, 0, ease);
    const phase = (time * Math.PI * 2) / period;
    const x = envelope * sway * Math.sin(phase);
    const y = -envelope * climb * Math.cos(phase * 2);
    const vx = (x - this.weaveLast.x) / deltaTime;
    const vy = (y - this.weaveLast.y) / deltaTime;
    this.weaveLast.x = x;
    this.weaveLast.y = y;
    return {
      x,
      y,
      // Out to the right it turns back left, which is a positive bank
      bank: envelope * bank * Math.sin(phase),
      yaw: -Math.atan(vx / this.speed),
      pitch: Math.atan(vy / this.speed),
    };
  }

  private swingPilot(pilotSwing: THREE.Object3D, deltaTime: number, bankRate: number): void {
    // The path's real speed varies along the curve, so measure it rather than trust `speed`.
    // FlyingBehavior steps on its own frames, so both speed and acceleration are smoothed.
    const smoothing = Math.min(1, deltaTime * SPEED_SMOOTHING);
    if (this.speedMeasured === null) {
      this.speedMeasured = this.speed;
    } else {
      const speed = this.rig.position.distanceTo(this.lastPosition) / deltaTime;
      const lastSpeed = this.speedMeasured;
      this.speedMeasured += (speed - this.speedMeasured) * smoothing;
      const acceleration = (this.speedMeasured - lastSpeed) / deltaTime;
      this.acceleration += (acceleration - this.acceleration) * smoothing;
    }
    this.lastPosition.copy(this.rig.position);

    // In a steady turn the pilot hangs in line with the banked wing; the roll pendulum only
    // shows while the bank is changing. Speeding up leaves the pilot behind the wing.
    this.roll.step(deltaTime, this.bank, bankRate);
    this.pitch.step(deltaTime, -Math.atan(this.acceleration / GRAVITY), 0);

    // Relative to the wing; positive Z roll swings the pilot right, positive X pitch forward.
    pilotSwing.rotation.z = THREE.MathUtils.clamp(
      this.roll.angle - this.bank,
      -MAX_SWING,
      MAX_SWING
    );
    pilotSwing.rotation.x = THREE.MathUtils.clamp(this.pitch.angle, -MAX_SWING, MAX_SWING);
    pilotSwing.rotation.y = this.twistAngle(deltaTime);
  }

  /** How far the pilot is turned round the hang line, eased in and out of each spin */
  private twistAngle(deltaTime: number): number {
    if (!this.twist) return 0;
    const { spin, hold, rest } = this.twist;

    if (this.twistTime === null) {
      this.twistRestLeft -= deltaTime;
      if (this.twistRestLeft > 0) return 0;
      this.twistTime = 0;
      this.twistLength = spin * 2 + randomBetween(hold);
      this.twistDirection = Math.random() < 0.5 ? -1 : 1;
    }
    this.twistTime += deltaTime;
    const time = this.twistTime;
    if (time >= this.twistLength) {
      this.twistTime = null;
      this.twistRestLeft = randomBetween(rest);
      return 0;
    }

    const turned =
      THREE.MathUtils.smoothstep(time, 0, spin) *
      THREE.MathUtils.smoothstep(this.twistLength - time, 0, spin);
    return this.twistDirection * Math.PI * turned;
  }
}
