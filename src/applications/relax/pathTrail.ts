import * as THREE from 'three';

/**
 * Where the lead has been over the last few seconds, so a chase camera can ride the lead's own
 * path a little way behind it: in a city that path is known to be clear of the buildings, which
 * an offset behind the lead's heading is not.
 */
export class PathTrail {
  private readonly points: { time: number; position: THREE.Vector3 }[] = [];

  /** Keeps `keep` seconds of the path */
  constructor(private readonly keep: number) {}

  push(time: number, position: THREE.Vector3): void {
    this.points.push({ time, position: position.clone() });
    while (this.points.length > 2 && this.points[1]!.time < time - this.keep) this.points.shift();
  }

  /**
   * Writes where the lead was `lag` seconds before the latest point into `out`, between the
   * points either side; the oldest point if the trail doesn't reach that far back yet
   */
  at(lag: number, out: THREE.Vector3): THREE.Vector3 {
    const { points } = this;
    if (!points.length) return out;
    const when = points[points.length - 1]!.time - lag;
    if (when <= points[0]!.time) return out.copy(points[0]!.position);
    for (let i = points.length - 1; i > 0; i--) {
      const a = points[i - 1]!;
      const b = points[i]!;
      if (a.time <= when) {
        return out.lerpVectors(a.position, b.position, (when - a.time) / (b.time - a.time || 1));
      }
    }
    return out.copy(points[0]!.position);
  }
}
