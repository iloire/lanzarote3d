import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;

/** The bank at which the inside brake is fully pulled */
const FULL_BRAKE_BANK = deg(40);
/** The brake both hands hold in straight flight, and how much the outside hand lets up */
const TRIM_BRAKE = 0.15;
const OUTSIDE_RELEASE = 0.1;
/** How fast the hands follow, per second: quicker than the wing banks, so they lead it */
const HAND_RESPONSE = 4;
/** At a full pull the upper arm drops this far at the shoulder and the forearm tips forward */
const SHOULDER_DROP = deg(40);
const FOREARM_TIP = deg(55);
/**
 * Twisted half round under the risers, the pilot still holds the brakes, which hang from the
 * untwisted wing: the arms come up and cross in front of the face. At a full half turn the upper
 * arms rise this far and swing this far forward, the forearms lean in this far from upright, and
 * one crosses in front of the other.
 */
const TWIST_ARM_RAISE = deg(70);
const TWIST_ARM_FORWARD = deg(60);
const TWIST_FOREARM_LEAN = deg(60);
const TWIST_FOREARM_CROSS = deg(10);
/** How far the pilot looks into a turn at full brake, and how fast the head turns, per second */
const LOOK_INTO_TURN = deg(45);
const HEAD_RESPONSE = 2.5;
/** How much of the pilot's lean the head takes back to keep the horizon level */
const HEAD_LEVELLING = 0.4;
/** Now and then the pilot glances round, for `GLANCE` seconds, every `GLANCE_EVERY` */
const GLANCE: [number, number] = [1.2, 2.5];
const GLANCE_EVERY: [number, number] = [4, 12];
const GLANCE_YAW = deg(70);
const GLANCE_DOWN = deg(25);

const randomBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/** One side's arm: the pivot at the shoulder and the one at the elbow */
type Arm = { side: 1 | -1; shoulder: THREE.Object3D; elbow: THREE.Object3D; brake: number };

/**
 * Moves a pilot cut into parts (3d-characters vox-to-obj.mjs --parts, hinged by PilotVoxel):
 * the hands work the brakes, pulling the inside one into a turn just before the wing banks,
 * and the head looks into the turn, keeps the horizon level and glances round now and then.
 *
 * Parts are found by name under `pilot`, in the model's own frame: X to the pilot's left, Y
 * up, Z forward. A pilot without them is left alone.
 */
export class PilotPose {
  private readonly head?: THREE.Object3D;
  private readonly arms: Arm[] = [];
  private headYaw = 0;
  private headPitch = 0;
  private glanceLeft = 0;
  private glanceYaw = 0;
  private glancePitch = 0;
  private restLeft = randomBetween(GLANCE_EVERY);

  static from(pilot: THREE.Object3D): PilotPose | undefined {
    return pilot.getObjectByName('head') || pilot.getObjectByName('arm-left')
      ? new PilotPose(pilot)
      : undefined;
  }

  private constructor(pilot: THREE.Object3D) {
    this.head = pilot.getObjectByName('head');
    (['left', 'right'] as const).forEach(name => {
      const shoulder = pilot.getObjectByName(`arm-${name}`);
      const elbow = pilot.getObjectByName(`forearm-${name}`);
      if (shoulder && elbow) {
        elbow.rotation.order = 'ZXY';
        this.arms.push({ side: name === 'left' ? 1 : -1, shoulder, elbow, brake: TRIM_BRAKE });
      }
    });
  }

  /**
   * `bank` is the bank the pilot is asking the wing for, positive to the left; `lean` is how
   * far the pilot hangs over to the left, and `twist` how far round the hang line he is turned,
   * in radians.
   */
  update(deltaTime: number, bank: number, lean: number, twist = 0): void {
    // 0 facing forward, 1 a full half turn round
    const twisted = Math.min(1, Math.abs(twist) / Math.PI);
    const crossing = Math.sign(twist) || 1;
    const turn = THREE.MathUtils.clamp(bank / FULL_BRAKE_BANK, -1, 1);
    const handStep = Math.min(1, deltaTime * HAND_RESPONSE);
    this.arms.forEach(arm => {
      const inside = turn * arm.side;
      const target = THREE.MathUtils.clamp(
        TRIM_BRAKE + (inside > 0 ? inside * (1 - TRIM_BRAKE) : inside * OUTSIDE_RELEASE),
        0,
        1
      );
      arm.brake += (target - arm.brake) * handStep;
      // Positive Z turns the right arm (-X) down and the left one up
      const drop = arm.brake * SHOULDER_DROP * (1 - twisted);
      const raise = TWIST_ARM_RAISE * twisted;
      arm.shoulder.rotation.z = arm.side * (raise - drop);
      // Positive X tips the arm forward
      arm.shoulder.rotation.x = TWIST_ARM_FORWARD * twisted;
      // The forearm stays upright as the upper arm drops, and tips forward to pull the brake;
      // twisted, it leans in before the face, one in front of the other as they cross
      arm.elbow.rotation.z = arm.side * (drop - raise + TWIST_FOREARM_LEAN * twisted);
      arm.elbow.rotation.x =
        arm.brake * FOREARM_TIP * (1 - twisted) +
        arm.side * crossing * TWIST_FOREARM_CROSS * twisted;
    });

    if (!this.head) return;
    if (this.glanceLeft > 0) {
      this.glanceLeft -= deltaTime;
      if (this.glanceLeft <= 0) this.restLeft = randomBetween(GLANCE_EVERY);
    } else if ((this.restLeft -= deltaTime) <= 0) {
      this.glanceLeft = randomBetween(GLANCE);
      this.glanceYaw = (Math.random() * 2 - 1) * GLANCE_YAW;
      this.glancePitch = Math.random() * GLANCE_DOWN;
    }
    const glancing = this.glanceLeft > 0;
    // Positive Y turns the face (+Z) to the left, positive X tips it down
    const yaw = glancing ? this.glanceYaw : turn * LOOK_INTO_TURN;
    const pitch = glancing ? this.glancePitch : 0;
    const headStep = Math.min(1, deltaTime * HEAD_RESPONSE);
    this.headYaw += (yaw - this.headYaw) * headStep;
    this.headPitch += (pitch - this.headPitch) * headStep;
    this.head.rotation.set(this.headPitch, this.headYaw, lean * HEAD_LEVELLING, 'YXZ');
  }
}
