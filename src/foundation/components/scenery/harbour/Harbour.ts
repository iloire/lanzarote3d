import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { MeshBuilder, lowPolyMaterial } from '../../base/lowPolyMesh';

export type HarbourFeatureKind = 'breakwater' | 'quay' | 'pontoon' | 'beacon';

/** A polyline on the water, in the harbour's own x/z (world units, y = 0 is sea level) */
export interface HarbourFeature {
  kind: HarbourFeatureKind;
  points: [number, number][];
}

export interface HarbourOptions extends SimpleComponentOptions {
  features: HarbourFeature[];
}

/** Width, the height of the top above the sea, and the colour of each kind of structure */
const STRUCTURE: Record<Exclude<HarbourFeatureKind, 'beacon'>, [number, number, string]> = {
  breakwater: [16, 4, '#B9B2A5'],
  quay: [8, 2.5, '#C9C4BA'],
  pontoon: [3, 0.8, '#7A5C3E'],
};
const ARMOUR = new THREE.Color('#6E6A63');
const BEACON = new THREE.Color('#2E8B3A');
const LANTERN = new THREE.Color('#E8F5E9');
const SEABED = -6;

/**
 * A harbour built from polylines: breakwaters are a crown on a wider, lower apron of armour rock,
 * quays and pontoons are slabs at their own heights, and a beacon is a tower with a lantern. Each
 * segment is a box run past its ends by half its width, so the corners close. One vertex-coloured
 * mesh, like the boats.
 */
export class Harbour extends SimpleThreeComponent {
  constructor(options: HarbourOptions) {
    super(
      {
        name: 'Harbour',
        version: '1.0.0',
        description: 'Breakwater, quays, pontoons and a beacon traced from a real harbour',
        tags: ['scenery', 'harbour', 'water'],
      },
      options
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const mesh = new MeshBuilder();
    (this.options as HarbourOptions).features.forEach(({ kind, points }) => {
      if (kind === 'beacon') {
        points.forEach(([x, z]) => beacon(mesh, x, z));
        return;
      }
      const [width, top, hex] = STRUCTURE[kind];
      const colour = new THREE.Color(hex);
      segments(points).forEach(([a, b]) => {
        if (kind === 'breakwater') slab(mesh, a, b, width * 0.85, SEABED, top * 0.4, ARMOUR);
        slab(mesh, a, b, width / 2, SEABED, top, colour);
      });
    });

    const harbour = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    harbour.name = 'Harbour';
    return harbour;
  }
}

const segments = (points: [number, number][]): [[number, number], [number, number]][] =>
  points.slice(1).map((b, i) => [points[i]!, b]);

/** A box from a to b, ±halfWidth across, extended by halfWidth past both ends */
function slab(
  mesh: MeshBuilder,
  [ax, az]: [number, number],
  [bx, bz]: [number, number],
  halfWidth: number,
  bottom: number,
  top: number,
  colour: THREE.Color
): void {
  const along = new THREE.Vector2(bx - ax, bz - az).normalize();
  const across = new THREE.Vector2(-along.y, along.x).multiplyScalar(halfWidth);
  const start = new THREE.Vector2(ax, az).addScaledVector(along, -halfWidth);
  const end = new THREE.Vector2(bx, bz).addScaledVector(along, halfWidth);
  const ring = (c: THREE.Vector2, y: number) => [
    new THREE.Vector3(c.x + across.x, y, c.y + across.y),
    new THREE.Vector3(c.x - across.x, y, c.y - across.y),
  ];
  const [s0, s1] = ring(start, bottom);
  const [s2, s3] = ring(start, top);
  const [e0, e1] = ring(end, bottom);
  const [e2, e3] = ring(end, top);
  mesh.quad(s2!, s3!, e3!, e2!, colour); // top
  mesh.quad(s0!, s2!, e2!, e0!, colour);
  mesh.quad(s1!, e1!, e3!, s3!, colour);
  mesh.quad(s0!, s1!, s3!, s2!, colour);
  mesh.quad(e0!, e2!, e3!, e1!, colour);
}

/** A green tower on the breakwater tip, with a white lantern */
function beacon(mesh: MeshBuilder, x: number, z: number): void {
  const at = (y: number) => new THREE.Vector3(x, y, z);
  mesh.rod(at(3), at(14), 1.6, BEACON, 6);
  mesh.rod(at(14), at(16.5), 1.0, LANTERN, 6);
  mesh.rod(at(16.5), at(17.3), 1.3, BEACON, 6);
}

export default Harbour;
