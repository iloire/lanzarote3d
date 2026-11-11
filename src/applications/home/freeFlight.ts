import * as THREE from 'three';

export type FreeFlightSettings = {
  /** The fastest the pilot turns with an arrow held, in rad/s */
  turnRate: number;
  /** How fast the turn follows the arrows, per second: a wing rolls in gently */
  turnResponse: number;
  /** Speed with ↑ (speed bar) and ↓ (brakes), as a share of the pilot's own */
  speedBar: number;
  brakes: number;
  /** How fast the speed follows, per second */
  speedResponse: number;
  /** Metres a second the pilot sinks on the speed bar, and climbs on the brakes in the lift */
  sink: number;
  climb: number;
  /** How fast the climb or sink follows, per second */
  verticalResponse: number;
  /** The ridge lift holds the pilot at least this many metres over the ground or sea */
  clearance: number;
  /** And never above this height */
  ceiling: number;
  /** Seconds between ground height checks, which raycast the terrain */
  groundInterval: number;
  /** Flying back to the loop, the share of the pilot's speed they chase it at */
  returnSpeed: number;
  /** Metres from their place on the loop at which the pilot is handed back to it */
  handBack: number;
};

/** The path flight a pilot is taken off, and handed back to */
export type PathFlight = {
  readonly waypointPath: THREE.Curve<THREE.Vector3> | null;
  setWaypointProgress(progress: number): void;
  start(): void;
  stop(): void;
};

/** Which arrows are held: turn is +1 for left, pitch +1 for the speed bar (↑), -1 for brakes (↓) */
export type FlightInput = { turn: number; pitch: number };

const UP = new THREE.Vector3(0, 1, 0);
const SAMPLES = 400;
const wrap = (angle: number) =>
  THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;

/**
 * Lets someone fly a pilot themselves: takes the rig off its loop and turns, speeds up and
 * slows it after the arrows, gently, as a paraglider flies. The ridge lift keeps it clear of
 * the ground. ParagliderMotion banks and swings it from the rig's moves as on the loop.
 * Released, the pilot flies back to the loop on its own and rejoins it.
 */
export class FreeFlight {
  /** Which arrows are held; only read while steering */
  readonly input: FlightInput = { turn: 0, pitch: 0 };
  private yaw: number;
  private turnRate = 0;
  private flightSpeed: number;
  private climbRate = 0;
  private ground = 0;
  private groundIn = 0;
  /** Where on the loop the pilot is heading back to, 0 to 1, or null while steering */
  private ghost: number | null = null;
  private readonly forward = new THREE.Vector3();
  private readonly turned = new THREE.Quaternion();
  private readonly ahead = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  constructor(
    private readonly rig: THREE.Object3D,
    private readonly path: PathFlight,
    private readonly speed: number,
    private readonly settings: FreeFlightSettings,
    /** The ground's height under (x, z), NaN off the terrain */
    private readonly groundHeight: (x: number, z: number) => number
  ) {
    path.stop();
    // The rig flies along -Z; yaw grows as it turns left
    this.forward.set(0, 0, -1).applyQuaternion(rig.quaternion);
    this.yaw = Math.atan2(-this.forward.x, -this.forward.z);
    this.flightSpeed = speed;
  }

  /** True while flying back to the loop on its own */
  get returning(): boolean {
    return this.ghost !== null;
  }

  /** Lets go: the pilot heads for the nearest point of the loop, a little ahead of it */
  release(): void {
    const curve = this.path.waypointPath;
    if (!curve) return;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < SAMPLES; i++) {
      const distance = curve.getPoint(i / SAMPLES, this.target).distanceTo(this.rig.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i / SAMPLES;
      }
    }
    // Aim ahead by the distance off, so the pilot meets the loop rather than turning back to it
    this.ghost = best + bestDistance / curve.getLength();
  }

  /** Takes the pilot back from flying home */
  steer(): void {
    this.ghost = null;
  }

  /** Advances by `deltaTime` seconds; false once the pilot is back on the loop */
  update(deltaTime: number): boolean {
    if (deltaTime <= 0) return true;
    const s = this.settings;
    const { position } = this.rig;
    let turnGoal: number;
    let speedGoal: number;
    let climbGoal: number;

    const curve = this.path.waypointPath;
    if (this.ghost !== null && curve) {
      const length = curve.getLength();
      this.ghost = THREE.MathUtils.euclideanModulo(
        this.ghost + (this.speed * deltaTime) / length,
        1
      );
      curve.getPoint(this.ghost, this.target);
      if (position.distanceTo(this.target) < s.handBack) {
        this.path.setWaypointProgress(this.ghost);
        this.path.start();
        return false;
      }
      const bearing = Math.atan2(position.x - this.target.x, position.z - this.target.z);
      turnGoal = THREE.MathUtils.clamp(wrap(bearing - this.yaw) * 1.5, -1, 1) * s.turnRate;
      speedGoal = this.speed * s.returnSpeed;
      climbGoal = THREE.MathUtils.clamp(this.target.y - position.y, -s.sink, s.climb);
    } else {
      turnGoal = this.input.turn * s.turnRate;
      speedGoal =
        this.speed * (this.input.pitch > 0 ? s.speedBar : this.input.pitch < 0 ? s.brakes : 1);
      climbGoal = this.input.pitch > 0 ? -s.sink : this.input.pitch < 0 ? s.climb : 0;
    }

    this.turnRate += (turnGoal - this.turnRate) * Math.min(1, deltaTime * s.turnResponse);
    this.flightSpeed += (speedGoal - this.flightSpeed) * Math.min(1, deltaTime * s.speedResponse);
    this.climbRate += (climbGoal - this.climbRate) * Math.min(1, deltaTime * s.verticalResponse);
    this.yaw += this.turnRate * deltaTime;

    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    position.addScaledVector(this.forward, this.flightSpeed * deltaTime);
    position.y += this.climbRate * deltaTime;

    // The lift off the slope, or over the sea, lifts the pilot clear rather than let them land
    this.groundIn -= deltaTime;
    if (this.groundIn <= 0) {
      this.groundIn = s.groundInterval;
      this.ahead.copy(position).addScaledVector(this.forward, this.flightSpeed * 3);
      this.ground = Math.max(
        0,
        this.groundHeight(position.x, position.z) || 0,
        this.groundHeight(this.ahead.x, this.ahead.z) || 0
      );
    }
    const floor = this.ground + s.clearance;
    if (position.y < floor) position.y += (floor - position.y) * Math.min(1, deltaTime);
    if (position.y > s.ceiling) position.y = s.ceiling;
    if (this.climbRate < 0 && position.y < floor) this.climbRate = 0;

    // Level, facing the way it flies; the slerp hides the loop's slope at the takeover
    this.turned.setFromAxisAngle(UP, this.yaw);
    this.rig.quaternion.slerp(this.turned, Math.min(1, deltaTime * 3));
    return true;
  }
}
