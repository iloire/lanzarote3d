import * as THREE from 'three';

const GRAVITY = 9.81;
const MAX_BANK = THREE.MathUtils.degToRad(35);
/** How fast the bank follows the turn, per second: a wing rolls in over a second or two */
const BANK_RESPONSE = 1.5;
/** The pilot's pendulum under the wing: natural frequency in rad/s (a ~3 s period) and damping ratio */
const SWING_FREQUENCY = 2.1;
const SWING_DAMPING = 0.22;
const MAX_SWING = THREE.MathUtils.degToRad(25);
/** How fast the measured speed and acceleration are smoothed, per second */
const SPEED_SMOOTHING = 3;

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
  private bank = 0;
  private speedMeasured: number | null = null;
  private acceleration = 0;
  private readonly roll = new Pendulum();
  private readonly pitch = new Pendulum();
  // A random phase per pilot so they don't sway in step.
  private time = Math.random() * 100;

  constructor(
    private readonly rig: THREE.Object3D,
    private readonly body: THREE.Object3D,
    private readonly speed: number,
    private readonly pilotSwing?: THREE.Object3D
  ) {}

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
    const lastBank = this.bank;
    this.bank += (targetBank - this.bank) * Math.min(1, deltaTime * BANK_RESPONSE);
    const bankRate = (this.bank - lastBank) / deltaTime;

    // Positive roll about the rig's Z lowers the left wing, which is a left turn here.
    this.body.rotation.z = this.bank + Math.sin(this.time * 0.9) * 0.03;
    this.body.rotation.x = Math.sin(this.time * 0.6) * 0.04;
    this.body.position.y = Math.sin(this.time * 0.35) * 1.5 + Math.sin(this.time * 0.9) * 0.4;

    if (this.pilotSwing) this.swingPilot(this.pilotSwing, deltaTime, bankRate);
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
  }
}
