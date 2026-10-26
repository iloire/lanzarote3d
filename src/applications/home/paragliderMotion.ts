import * as THREE from 'three';

const GRAVITY = 9.81;
const MAX_BANK = THREE.MathUtils.degToRad(35);
/** How fast the bank follows the turn, per second: a wing rolls in over a second or two */
const BANK_RESPONSE = 1.5;

/**
 * Makes a paraglider fly like one on top of the path it follows: it banks into turns by the
 * coordinated-turn angle for its speed, and the pilot swings gently under the wing and rides
 * small lift bumps. It moves `body`, a group inside the rig that FlyingBehavior steers.
 */
export class ParagliderMotion {
  private readonly forward = new THREE.Vector3();
  private lastHeading: number | null = null;
  private bank = 0;
  // A random phase per pilot so they don't sway in step.
  private time = Math.random() * 100;

  constructor(
    private readonly rig: THREE.Object3D,
    private readonly body: THREE.Object3D,
    private readonly speed: number
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
    this.bank += (targetBank - this.bank) * Math.min(1, deltaTime * BANK_RESPONSE);

    // Positive roll about the rig's Z lowers the left wing, which is a left turn here.
    this.body.rotation.z = this.bank + Math.sin(this.time * 0.9) * 0.03;
    this.body.rotation.x = Math.sin(this.time * 0.6) * 0.04;
    this.body.position.y = Math.sin(this.time * 0.35) * 1.5 + Math.sin(this.time * 0.9) * 0.4;
  }
}
