import * as THREE from 'three';

/**
 * One moment of a camera shot: where the camera is and what it looks at, `at` seconds in. With
 * `followPilot`, both are offsets from the pilot wherever it has flown to by then.
 */
export interface ShotKey {
  at: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  followPilot?: boolean;
}

/**
 * Flies a camera through a list of keys: the camera and its aim each move along a smooth curve
 * through the keys' points, passing each key at its time, easing out of the first and into the
 * last. Speed changes smoothly through the keys, never stopping or reversing between them.
 */
export class CameraShot {
  /** How fast the key index advances at each key, in keys a second: none at either end */
  private readonly rates: number[];

  constructor(private readonly keys: ShotKey[]) {
    const pace = keys.slice(1).map((k, i) => 1 / (k.at - keys[i]!.at));
    // The mean of the paces either side, capped at three times the slower one so the index
    // never runs backwards (Fritsch–Carlson), and zero at the ends so the shot eases in and out
    this.rates = keys.map((_, i) =>
      i === 0 || i === keys.length - 1
        ? 0
        : Math.min((pace[i - 1]! + pace[i]!) / 2, 3 * Math.min(pace[i - 1]!, pace[i]!))
    );
  }

  get duration(): number {
    return this.keys[this.keys.length - 1]!.at;
  }

  /** Where the camera is and what it looks at `time` seconds in, for a pilot at `pilot` */
  at(time: number, pilot: THREE.Vector3): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
    const last = this.keys.length - 1;
    const t = THREE.MathUtils.clamp(time, 0, this.duration);
    const index = this.indexAt(t);
    const resolve = (k: ShotKey, point: THREE.Vector3) =>
      k.followPilot ? point.clone().add(pilot) : point;
    const along = (points: THREE.Vector3[]) =>
      new THREE.CatmullRomCurve3(points, false, 'centripetal').getPoint(index / last);

    return {
      position: along(this.keys.map(k => resolve(k, k.position))),
      lookAt: along(this.keys.map(k => resolve(k, k.lookAt))),
    };
  }

  /** The key index at a time, from a cubic Hermite through (time, index) with `rates` as slopes */
  private indexAt(t: number): number {
    const last = this.keys.length - 1;
    const i = Math.min(this.keys.findIndex(k => k.at > t) - 1, last - 1);
    if (i < 0) return last;
    const span = this.keys[i + 1]!.at - this.keys[i]!.at;
    const u = (t - this.keys[i]!.at) / span;
    const [h00, h10, h01, h11] = [
      2 * u ** 3 - 3 * u ** 2 + 1,
      u ** 3 - 2 * u ** 2 + u,
      -2 * u ** 3 + 3 * u ** 2,
      u ** 3 - u ** 2,
    ];
    return h00 * i + h10 * span * this.rates[i]! + h01 * (i + 1) + h11 * span * this.rates[i + 1]!;
  }
}
