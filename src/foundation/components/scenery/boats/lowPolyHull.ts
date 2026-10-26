import * as THREE from 'three';
import { MeshBuilder, Section, ring } from '../../base/lowPolyMesh';

/**
 * Low-poly hulls shared by the boats. A hull is lofted through stations from transom to stem; its
 * cross-section is split so it paints in bands: a sheer line under the deck edge, the topsides, a
 * boot stripe at the waterline and antifouling below. The waterline sits near y = 0.
 */

/** Hull cross-section as (side, up): deck edge, down the topsides to a V bottom and back */
const HULL: Section = [
  [1, 1],
  [0.99, 0.6],
  [0.98, 0.15],
  [0.95, -0.05],
  [0.75, -0.6],
  [0, -1],
  [-0.75, -0.6],
  [-0.95, -0.05],
  [-0.98, 0.15],
  [-0.99, 0.6],
  [-1, 1],
];
const SEG_SHEER = [0, 9];
const SEG_TOPSIDE = [1, 8];
const SEG_BOOT = [2, 7];
const SEG_DECK = 10;

/** Superstructure section with its sides split at a window line: windows above, panel below */
export const WINDOWED: Section = [
  [1, 1],
  [1, 0.15],
  [1, -1],
  [-1, -1],
  [-1, 0.15],
  [-1, 1],
];
export const SEG_WINDOWS = [0, 4];

export const ANTIFOULING = new THREE.Color('#8B2E2E');
export const TEAK = new THREE.Color('#9A6B3F');
export const STAINLESS = new THREE.Color('#C9CED6');

/** A hull station: x along the boat, deck and keel heights, half beam */
export type Station = { x: number; deck: number; keel: number; beam: number };

export interface HullPaint {
  sheer: THREE.Color;
  topside: THREE.Color;
  boot: THREE.Color;
  bottom: THREE.Color;
  /** Deck colour for the span between station s and s + 1 */
  deck: THREE.Color | ((span: number) => THREE.Color);
}

/** Stations run stern to bow; the last one should be nearly zero beam to make the stem */
export const buildHull = (mesh: MeshBuilder, stations: Station[], paint: HullPaint): void => {
  const deckOf = typeof paint.deck === 'function' ? paint.deck : () => paint.deck as THREE.Color;
  mesh.loft(
    stations.map(s => ring(s.x, s.keel, s.deck, s.beam, 0, HULL)),
    (span, k) => {
      if (k === SEG_DECK) return deckOf(span);
      if (SEG_SHEER.includes(k)) return paint.sheer;
      if (SEG_TOPSIDE.includes(k)) return paint.topside;
      if (SEG_BOOT.includes(k)) return paint.boot;
      return paint.bottom;
    },
    [paint.topside, paint.topside]
  );
};

/** Deck height and half beam at x, interpolated between stations */
export const hullAt = (stations: Station[], x: number): { deck: number; beam: number } => {
  const i = Math.max(
    0,
    stations.findIndex((s, n) => n < stations.length - 1 && x <= stations[n + 1]!.x)
  );
  const a = stations[i]!;
  const b = stations[Math.min(i + 1, stations.length - 1)]!;
  const t = b.x === a.x ? 0 : THREE.MathUtils.clamp((x - a.x) / (b.x - a.x), 0, 1);
  return {
    deck: THREE.MathUtils.lerp(a.deck, b.deck, t),
    beam: THREE.MathUtils.lerp(a.beam, b.beam, t),
  };
};

/**
 * Guard rails on stanchions along both deck edges from the given stations forward, meeting in a
 * pulpit at the bow.
 */
export const buildRails = (
  mesh: MeshBuilder,
  stations: Station[],
  xs: number[],
  height: number,
  color: THREE.Color
): void => {
  const radius = 0.05 * height;
  const bow = stations[stations.length - 1]!;
  const tip = new THREE.Vector3(bow.x - 0.4, hullAt(stations, bow.x - 0.4).deck + height, 0);
  [-1, 1].forEach(side => {
    const posts = xs.map(x => {
      const { deck, beam } = hullAt(stations, x);
      const z = side * beam * 0.92;
      mesh.rod(
        new THREE.Vector3(x, deck, z),
        new THREE.Vector3(x, deck + height, z),
        radius,
        color,
        3
      );
      return new THREE.Vector3(x, deck + height, z);
    });
    [...posts, tip].forEach((p, i, all) => {
      if (i > 0) mesh.rod(all[i - 1]!, p, radius, color, 3);
    });
  });
};

/** A triangular sail whose belly bulges `belly` along z, so it catches the light in three facets */
export const buildSail = (
  mesh: MeshBuilder,
  tack: THREE.Vector3,
  head: THREE.Vector3,
  clew: THREE.Vector3,
  belly: number,
  color: THREE.Color
): void => {
  const centre = tack.clone().add(head).add(clew).divideScalar(3);
  centre.z += belly;
  mesh.tri(tack, head, centre, color);
  mesh.tri(head, clew, centre, color);
  mesh.tri(clew, tack, centre, color);
};
