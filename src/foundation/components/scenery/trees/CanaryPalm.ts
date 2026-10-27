import * as THREE from 'three';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LowPolyBuilding } from '../buildings/lowPolyBuilding';
import { LevelOfDetail } from '../../../types/lod';

/**
 * The Canary Island date palm (Phoenix canariensis), the palm of Haría's valley and of every
 * Lanzarote garden: a stout trunk in bands of old leaf scars, a fat knob of frond bases at the
 * top, and a round crown of long fronds, the upper ones rising and the lower ones arching down
 * to the trunk. One vertex-coloured mesh, so a town or a grove merges into one draw call.
 */

export interface CanaryPalmOptions extends SimpleComponentOptions {
  /** Metres from the ground to the crown */
  height?: number;
  /** Picks the palm's lean and the turn of its crown; the same seed gives the same palm */
  seed?: number;
  levelOfDetail?: LevelOfDetail;
}

const BARK = new THREE.Color('#7A6650');
const BARK_DARK = new THREE.Color('#5E4E3D');
const KNOB = new THREE.Color('#9A6B3C');
const FROND = new THREE.Color('#4F7A32');
const FROND_LIGHT = new THREE.Color('#6E9440');
const FROND_OLD = new THREE.Color('#8C9A45');
const DATES = new THREE.Color('#E08A2E');

/** A small seeded generator, so a palm looks the same every time it is built */
const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/**
 * One frond from `base`: a folded V along an arc that starts at `pitch` above the horizontal
 * and bends down by `bend` towards its tip, widest a third of the way out.
 */
const frond = (
  mesh: MeshBuilder,
  base: THREE.Vector3,
  heading: number,
  pitch: number,
  bend: number,
  length: number,
  c: THREE.Color
) => {
  const out = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
  const side = new THREE.Vector3(-out.z, 0, out.x);
  const segments = 3;
  const spine = [base.clone()];
  for (let i = 0; i < segments; i++) {
    const a = pitch - (bend * (i + 0.5)) / segments;
    const step = out
      .clone()
      .multiplyScalar(Math.cos(a))
      .setY(Math.sin(a))
      .multiplyScalar(length / segments);
    spine.push(spine[i]!.clone().add(step));
  }
  const halfWidth = [0.15, 0.75, 0.55, 0].map(w => w * length * 0.18);
  const edge = (i: number, s: number) =>
    spine[i]!.clone()
      .addScaledVector(side, s * halfWidth[i]!)
      .setY(spine[i]!.y - halfWidth[i]! * 0.45);
  for (let i = 0; i < segments; i++) {
    [-1, 1].forEach(s => mesh.quad(spine[i]!, spine[i + 1]!, edge(i + 1, s), edge(i, s), c));
  }
};

/** Builds a Canary palm standing at `at`, its crown `height` metres up */
export const buildCanaryPalm = (
  mesh: MeshBuilder,
  at: THREE.Vector3,
  height: number,
  seed: number,
  detail: LevelOfDetail
) => {
  const rnd = random(Math.floor(seed * 7919) + 1);
  const lean = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).multiplyScalar(height * 0.08);
  const sides = detail === LevelOfDetail.ULTRA_LOW ? 5 : 7;

  // Trunk: bands of leaf scars, flaring at the foot and swelling into the knob at the top
  const bands = detail === LevelOfDetail.ULTRA_LOW ? 3 : 6;
  const radiusAt = (t: number) => 0.6 + 0.3 * (1 - t) ** 4;
  const rings = Array.from({ length: bands + 1 }, (_, i) => {
    const t = i / bands;
    const centre = at
      .clone()
      .addScaledVector(lean, t * t)
      .setY(at.y - 0.5 + t * (height - 0.5));
    return Array.from({ length: sides }, (_, k) => {
      const a = (k / sides) * Math.PI * 2;
      return centre
        .clone()
        .add(new THREE.Vector3(Math.cos(a) * radiusAt(t), 0, Math.sin(a) * radiusAt(t)));
    });
  });
  mesh.loft(rings, s => (s % 2 === 0 ? BARK : BARK_DARK), [BARK, BARK]);

  const top = at
    .clone()
    .add(lean)
    .setY(at.y + height);
  const knob = Array.from({ length: sides }, (_, k) => {
    const a = (k / sides) * Math.PI * 2;
    return top.clone().add(new THREE.Vector3(Math.cos(a) * 1.05, 0.7, Math.sin(a) * 1.05));
  });
  rings[bands]!.forEach((p, k) =>
    mesh.quad(p, rings[bands]![(k + 1) % sides]!, knob[(k + 1) % sides]!, knob[k]!, KNOB)
  );
  const crown = top.clone().setY(top.y + 1.2);

  // Crown: an upper ring rising, a lower ring arching down past the knob
  const length = height * 0.45 + 2;
  const turn = rnd() * Math.PI * 2;
  const tiers =
    detail === LevelOfDetail.ULTRA_LOW
      ? [
          { count: 7, pitch: 0.75, bend: 1.4, c: FROND_LIGHT },
          { count: 6, pitch: 0.05, bend: 1.2, c: FROND },
        ]
      : [
          { count: 8, pitch: 0.95, bend: 1.4, c: FROND_LIGHT },
          { count: 9, pitch: 0.35, bend: 1.5, c: FROND },
          { count: 7, pitch: -0.15, bend: 1.2, c: FROND_OLD },
        ];
  tiers.forEach(({ count, pitch, bend, c }, tier) => {
    for (let i = 0; i < count; i++) {
      const heading = turn + ((i + tier * 0.5) / count) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
      frond(mesh, crown, heading, pitch, bend, length * (0.85 + rnd() * 0.3), c);
    }
  });

  if (detail < LevelOfDetail.MEDIUM) return;
  // Hanging bunches of orange dates under the crown
  for (let i = 0; i < 3; i++) {
    const a = turn + (i / 3) * Math.PI * 2;
    const p = top.clone().add(new THREE.Vector3(Math.cos(a) * 1.1, 0.2, Math.sin(a) * 1.1));
    mesh.tri(
      p,
      p.clone().add(new THREE.Vector3(0.5, -1.4, 0)),
      p.clone().add(new THREE.Vector3(-0.4, -1.2, 0.4)),
      DATES
    );
  }
};

export class CanaryPalm extends LowPolyBuilding {
  constructor(options: CanaryPalmOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'CanaryPalm',
      version: '1.0.0',
      description: 'Canary Island date palm: banded trunk, knob and a round crown of fronds',
      tags: ['scenery', 'nature', 'tree', 'palm', 'lanzarote', 'lod'],
    };
    super(metadata, { height: 11, seed: 1, ...options });
    this.currentLOD = options.levelOfDetail ?? LevelOfDetail.MEDIUM;
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const { height = 11, seed = 1 } = this.options as CanaryPalmOptions;
    buildCanaryPalm(mesh, new THREE.Vector3(), height, seed, detail);
  }
}

export default CanaryPalm;
