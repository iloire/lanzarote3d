import * as THREE from 'three';

export type CameraFollowSettings = {
  /** Seconds the spring takes to catch up; at a steady speed it trails by speed × smoothTime */
  smoothTime: number;
  /** Seconds the spring takes when switching to another lead, easing back to smoothTime */
  switchTime: number;
  /** Seconds of the lead's flight the camera aims ahead at; above smoothTime it leads, below it lags */
  lookAhead: number;
  /** How fast the measured lead velocity is smoothed, per second */
  velocityResponse: number;
  /** The share of the lead's bank the camera rolls with */
  rollShare: number;
  /** How fast the camera roll follows, per second */
  rollResponse: number;
};

/**
 * Follows the lead pilot on a critically damped spring instead of rigidly: it chases a point a
 * little ahead along the lead's flight, so the camera eases into the pilot's moves, swings
 * into turns ahead of them and never overshoots. `move` says how far to carry the camera and
 * its orbit target this frame, which leaves orbiting and zooming to the user. It also rolls the
 * camera gently with the lead's bank.
 */
export class CameraFollow {
  /** Where the camera is aimed: the spring's end, chasing the point ahead of the lead */
  readonly anchor = new THREE.Vector3();
  /** Radians to roll the camera about its view axis */
  roll = 0;
  /** The spring's current settle time: switchTime just after a switch, smoothTime once settled */
  private springTime: number;
  private readonly anchorVelocity = new THREE.Vector3();
  private readonly leadVelocity = new THREE.Vector3();
  private readonly lastLead = new THREE.Vector3();
  private readonly goal = new THREE.Vector3();
  private readonly step = new THREE.Vector3();
  private readonly before = new THREE.Vector3();

  constructor(private readonly settings: CameraFollowSettings) {
    this.springTime = settings.smoothTime;
  }

  /** Starts following from where the lead is now, at rest, so taking over doesn't jump */
  reset(leadPosition: THREE.Vector3): void {
    this.anchor.copy(leadPosition);
    this.lastLead.copy(leadPosition);
    this.anchorVelocity.set(0, 0, 0);
    this.leadVelocity.set(0, 0, 0);
    this.roll = 0;
    this.springTime = this.settings.smoothTime;
  }

  /**
   * Switches to following another lead: the anchor keeps moving from where it is, so the
   * camera glides across on a slower spring instead of jumping
   */
  retarget(leadPosition: THREE.Vector3): void {
    this.lastLead.copy(leadPosition);
    this.leadVelocity.set(0, 0, 0);
    this.springTime = this.settings.switchTime;
  }

  /** Advances by `deltaTime` seconds and writes how far the anchor moved into `move` */
  update(deltaTime: number, leadPosition: THREE.Vector3, leadBank: number, move: THREE.Vector3) {
    move.set(0, 0, 0);
    if (deltaTime <= 0) return;
    const { smoothTime, lookAhead, velocityResponse, rollShare, rollResponse } = this.settings;
    // After a switch the spring tightens back to smoothTime as the glide arrives.
    this.springTime +=
      (smoothTime - this.springTime) * Math.min(1, deltaTime / this.settings.switchTime);

    // FlyingBehavior steps on its own frames, so the measured velocity is smoothed.
    this.step.subVectors(leadPosition, this.lastLead).divideScalar(deltaTime);
    this.lastLead.copy(leadPosition);
    this.leadVelocity.lerp(this.step, Math.min(1, deltaTime * velocityResponse));
    this.goal.copy(leadPosition).addScaledVector(this.leadVelocity, lookAhead);

    this.before.copy(this.anchor);
    smoothDamp(this.anchor, this.goal, this.anchorVelocity, this.springTime, deltaTime);
    move.subVectors(this.anchor, this.before);

    this.roll += (leadBank * rollShare - this.roll) * Math.min(1, deltaTime * rollResponse);
  }
}

/**
 * Moves `current` towards `target` as a critically damped spring that settles in about
 * `smoothTime`, updating `velocity`. Stable for any step (Game Programming Gems 4, 1.10).
 */
export function smoothDamp(
  current: THREE.Vector3,
  target: THREE.Vector3,
  velocity: THREE.Vector3,
  smoothTime: number,
  deltaTime: number
): void {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const axis of ['x', 'y', 'z'] as const) {
    const change = current[axis] - target[axis];
    const temp = (velocity[axis] + omega * change) * deltaTime;
    velocity[axis] = (velocity[axis] - omega * temp) * decay;
    current[axis] = target[axis] + (change + temp) * decay;
  }
}

export type BackdropSwaySettings = {
  /** How far either side of its centre the camera swings, in radians */
  amplitude: number;
  /** Turns the centre of the swing off facing the backdrop, in radians; positive looks further left */
  bias: number;
  /** Seconds for one swing there and back */
  period: number;
  /** How fast the camera eases onto the swing, per second */
  response: number;
};

/**
 * Keeps a backdrop behind the subject: swings the camera round its target, at its current
 * distance and height, on the side away from `backdrop`, swaying gently either side of it.
 * It eases in from wherever the camera is, so taking over doesn't jump.
 */
export class BackdropSway {
  private theta: number | null = null;
  private time = 0;
  private readonly offset = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();

  constructor(
    private readonly backdrop: THREE.Vector3,
    private readonly settings: BackdropSwaySettings
  ) {}

  /** Advances by `deltaTime` seconds, moving `camera` round `target` */
  update(deltaTime: number, camera: THREE.Vector3, target: THREE.Vector3): void {
    if (deltaTime <= 0) return;
    const { amplitude, bias, period, response } = this.settings;
    this.time += deltaTime;

    this.offset.subVectors(camera, target);
    this.spherical.setFromVector3(this.offset);
    if (this.theta === null) this.theta = this.spherical.theta;

    // Spherical's theta is the azimuth atan2(x, z); the camera sits opposite the backdrop.
    const facing = Math.atan2(target.x - this.backdrop.x, target.z - this.backdrop.z);
    const goal = facing + bias + amplitude * Math.sin((this.time * 2 * Math.PI) / period);
    const turn =
      THREE.MathUtils.euclideanModulo(goal - this.theta + Math.PI, 2 * Math.PI) - Math.PI;
    this.theta += turn * Math.min(1, deltaTime * response);

    this.spherical.theta = this.theta;
    camera.copy(target).add(this.offset.setFromSpherical(this.spherical));
  }
}
