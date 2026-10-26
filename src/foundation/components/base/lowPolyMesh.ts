import * as THREE from 'three';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Building blocks for the low-poly aircraft and boats: every part is pushed as flat-coloured
 * triangles into one MeshBuilder, so a whole vehicle is a single vertex-coloured mesh and one draw
 * call. Conventions: nose or bow points +X, up is +Y, wings and beam span Z.
 */

/** A unit cross-section as (side, up) pairs, walked around the X axis */
export type Section = ReadonlyArray<readonly [number, number]>;

/** Chamfered, a little flatter underneath. Segment k runs from point k to point k + 1. */
export const OCTAGON: Section = [
  [0.45, 1],
  [1, 0.45],
  [1, -0.5],
  [0.6, -1],
  [-0.6, -1],
  [-1, -0.5],
  [-1, 0.45],
  [-0.45, 1],
];

/** A rectangle: right side, bottom, left side, top */
export const BOX: Section = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];

/** A ring at station x, spanning bottom..top vertically and ±halfWidth around z */
export const ring = (
  x: number,
  bottom: number,
  top: number,
  halfWidth: number,
  z = 0,
  section: Section = OCTAGON
): THREE.Vector3[] =>
  section.map(
    ([side, up]) =>
      new THREE.Vector3(x, (top + bottom) / 2 + (up * (top - bottom)) / 2, z + side * halfWidth)
  );

/** A regular polygon of `sides` points around an axis through `centre` along X or Z */
export const circle = (
  centre: THREE.Vector3,
  radius: number,
  sides: number,
  axis: 'x' | 'z'
): THREE.Vector3[] =>
  Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2;
    const [u, v] = [Math.cos(a) * radius, Math.sin(a) * radius];
    return axis === 'x'
      ? new THREE.Vector3(centre.x, centre.y + u, centre.z + v)
      : new THREE.Vector3(centre.x + u, centre.y + v, centre.z);
  });

export interface Rib {
  le: THREE.Vector3;
  te: THREE.Vector3;
  thickness: number;
}

export interface PropellerSpec {
  hub: THREE.Vector3;
  radius: number;
  blades: number;
  /** Angle of the first blade around the X axis */
  phase: number;
  rootChord: number;
  tipChord: number;
  color: THREE.Color;
  tipColor: THREE.Color;
}

export class MeshBuilder {
  private positions: number[] = [];
  private colors: number[] = [];

  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color): void {
    for (const v of [a, b, c]) {
      this.positions.push(v.x, v.y, v.z);
      this.colors.push(color.r, color.g, color.b);
    }
  }

  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, color: THREE.Color) {
    this.tri(a, b, c, color);
    this.tri(a, c, d, color);
  }

  /** Fan-closes a ring around its centroid */
  cap(points: THREE.Vector3[], color: THREE.Color): void {
    const centre = points.reduce((sum, p) => sum.add(p), new THREE.Vector3());
    centre.divideScalar(points.length);
    points.forEach((p, i) => this.tri(centre, p, points[(i + 1) % points.length]!, color));
  }

  /** Skins consecutive rings (all with the same point count), capping both ends */
  loft(
    rings: THREE.Vector3[][],
    color: (station: number, segment: number) => THREE.Color,
    capColors: [THREE.Color, THREE.Color]
  ): void {
    for (let s = 0; s < rings.length - 1; s++) {
      const a = rings[s]!;
      const b = rings[s + 1]!;
      for (let k = 0; k < a.length; k++) {
        const n = (k + 1) % a.length;
        this.quad(a[k]!, b[k]!, b[n]!, a[n]!, color(s, k));
      }
    }
    this.cap(rings[0]!, capColors[0]);
    this.cap(rings[rings.length - 1]!, capColors[1]);
  }

  /**
   * A lifting surface through ribs; `up` is the direction the thickness grows in. Each rib is a
   * four-point airfoil, thickest at 30% chord. `color` may vary per span between ribs.
   */
  surface(
    ribs: Rib[],
    up: THREE.Vector3,
    color: THREE.Color | ((span: number) => THREE.Color)
  ): void {
    const colorOf = typeof color === 'function' ? color : () => color;
    const rings = ribs.map(({ le, te, thickness }) => {
      const crest = le.clone().lerp(te, 0.3);
      return [
        le,
        crest.clone().addScaledVector(up, thickness * 0.6),
        te,
        crest.clone().addScaledVector(up, -thickness * 0.4),
      ];
    });
    this.loft(rings, s => colorOf(s), [colorOf(0), colorOf(ribs.length - 2)]);
  }

  /** A streamlined strut from a to b, its chord lying along X */
  strut(a: THREE.Vector3, b: THREE.Vector3, chord: number, thickness: number, color: THREE.Color) {
    const along = b.clone().sub(a).normalize();
    const up = along
      .clone()
      .cross(new THREE.Vector3(1, 0, 0))
      .normalize();
    const half = new THREE.Vector3(chord / 2, 0, 0);
    this.surface(
      [
        { le: a.clone().add(half), te: a.clone().sub(half), thickness },
        { le: b.clone().add(half), te: b.clone().sub(half), thickness },
      ],
      up,
      color
    );
  }

  /** A box from x0 to x1, spanning bottom..top and ±halfWidth around z */
  box(
    x0: number,
    x1: number,
    bottom: number,
    top: number,
    halfWidth: number,
    z: number,
    color: THREE.Color
  ): void {
    const rings = [x0, x1].map(x => ring(x, bottom, top, halfWidth, z, BOX));
    this.loft(rings, () => color, [color, color]);
  }

  /** A thin prism from a to b: spars, rails, stays */
  rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, color: THREE.Color, sides = 4): void {
    const axis = b.clone().sub(a).normalize();
    const helper = Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(axis, helper).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u);
    const around = (centre: THREE.Vector3) =>
      Array.from({ length: sides }, (_, i) => {
        const t = ((i + 0.5) / sides) * Math.PI * 2;
        return centre
          .clone()
          .addScaledVector(u, Math.cos(t) * radius)
          .addScaledVector(v, Math.sin(t) * radius);
      });
    this.loft([around(a), around(b)], () => color, [color, color]);
  }

  /** A cone pointing +X from a base polygon around the X axis */
  cone(
    baseCentre: THREE.Vector3,
    length: number,
    radius: number,
    sides: number,
    color: THREE.Color
  ) {
    const base = circle(baseCentre, radius, sides, 'x');
    const apex = baseCentre.clone().add(new THREE.Vector3(length, 0, 0));
    base.forEach((p, i) => this.tri(apex, p, base[(i + 1) % sides]!, color));
  }

  /** Flat, pitched blades spinning about the X axis, their outer 15% in the tip colour */
  propeller({ hub, radius, blades, phase, rootChord, tipChord, color, tipColor }: PropellerSpec) {
    const pitch = THREE.MathUtils.degToRad(30);
    for (let i = 0; i < blades; i++) {
      const a = phase + (i * Math.PI * 2) / blades;
      const out = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      const chordDir = new THREE.Vector3(Math.sin(pitch), 0, 0).addScaledVector(
        new THREE.Vector3(0, -Math.sin(a), Math.cos(a)),
        Math.cos(pitch)
      );
      const at = (r: number, halfChord: number) => {
        const centre = hub.clone().addScaledVector(out, r);
        return [
          centre.clone().addScaledVector(chordDir, -halfChord),
          centre.clone().addScaledVector(chordDir, halfChord),
        ];
      };
      const [rootA, rootB] = at(radius * 0.18, rootChord / 2);
      const [bandA, bandB] = at(radius * 0.85, THREE.MathUtils.lerp(rootChord, tipChord, 0.8) / 2);
      const [tipA, tipB] = at(radius, tipChord / 2);
      this.quad(rootA!, rootB!, bandB!, bandA!, color);
      this.quad(bandA!, bandB!, tipB!, tipA!, tipColor);
    }
  }

  build(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
}

/** The one material every low-poly vehicle shares: colours come from the vertices */
export const lowPolyMaterial = (): THREE.Material =>
  resourceManager.getOrCreateMaterial(
    'lowpoly_vertex_colors',
    () =>
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide,
      })
  );

/** Window tint: the configured colour darkened so glass reads against paint */
export const glassColor = (hex: string): THREE.Color => new THREE.Color(hex).multiplyScalar(0.6);
