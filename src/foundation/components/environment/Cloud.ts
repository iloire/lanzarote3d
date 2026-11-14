import * as THREE from 'three';
import { rndBetween, rndIntBetween } from '../../utils/math';
import { cloudMaterial } from '../../rendering/cloudMaterial';

export type CloudKind = 'puff' | 'tower' | 'cb';

/**
 * How a cumulus stacks its lobes: the footprint's width, how many layers rise from the
 * flat base, how much narrower each layer is than the one below and how far above it
 * sits, in radii. A cumulonimbus is built from several of these masses (cumulonimbusLobes).
 */
const SHAPES: Record<
  Exclude<CloudKind, 'cb'>,
  { width: [number, number]; layers: [number, number]; narrow: number; rise: number }
> = {
  puff: { width: [450, 850], layers: [2, 3], narrow: 0.65, rise: 0.85 },
  tower: { width: [700, 1000], layers: [6, 7], narrow: 0.85, rise: 0.9 },
};

/** Lobes bigger than this get the finer icosahedron (80 faces instead of 20) */
const FINE_LOBE_RADIUS = 150;

/** How much of a lobe's depth below the base survives: a shallow belly, not a cut-off plate */
const BELLY = 0.3;

/** `flatten` squashes a lobe's height: 1 is round */
type Lobe = { centre: THREE.Vector3; radius: number; flatten?: number };

const stackLobes = (kind: Exclude<CloudKind, 'cb'>): Lobe[] => {
  const shape = SHAPES[kind];
  const lobes: Lobe[] = [];
  let width = rndBetween(...shape.width);
  const layers = rndIntBetween(...shape.layers);
  let y = 0;
  for (let layer = 0; layer < layers; layer++) {
    const radius = width * rndBetween(0.22, 0.28);
    const count = layer === 0 ? rndIntBetween(3, 5) : rndIntBetween(2, 3);
    // The bottom layer sinks below the base, which then squashes it into a shallow belly
    y += radius * (layer === 0 ? 0.3 : shape.rise);
    for (let i = 0; i < count; i++) {
      const across = count === 1 ? 0 : i / (count - 1) - 0.5;
      lobes.push({
        centre: new THREE.Vector3(
          across * (width - radius) + rndBetween(-0.1, 0.1) * radius,
          y + rndBetween(-0.15, 0.15) * radius,
          rndBetween(-0.3, 0.3) * width * 0.5
        ),
        radius: radius * rndBetween(0.85, 1.15),
      });
    }
    width *= shape.narrow;
  }
  return lobes;
};

/**
 * A billowing mass of lobes centred on (x, z): each layer fills an ellipse `width` across
 * (x) and `depth` deep (z), `narrow` times smaller than the one below, from `y` up to
 * `height`. Returns its lobes and the height its top reached.
 */
const mass = (m: {
  x: number;
  z: number;
  y?: number;
  width: number;
  depth: number;
  height: number;
  narrow: number;
}): { lobes: Lobe[]; top: number } => {
  const lobes: Lobe[] = [];
  let { width, depth } = m;
  let y = m.y ?? 0;
  let first = true;
  // Lobes keep most of their bottom size, so a narrowing mass still reaches its height
  const minRadius = Math.min(width, depth) * 0.16;
  while (y < m.height) {
    const radius = Math.max(Math.min(width, depth) * rndBetween(0.2, 0.24), minRadius);
    // The bottom layer sinks below the base, which then squashes it into a shallow belly
    y += radius * (first ? 0.3 : 0.8);
    first = false;
    // Round the rim only: the inside never shows
    const count = Math.min(Math.ceil((Math.PI * (width + depth)) / (radius * 5.5)), 10);
    for (let i = 0; i < count; i++) {
      const angle = rndBetween(0, Math.PI * 2);
      const out = rndBetween(0.75, 1);
      lobes.push({
        centre: new THREE.Vector3(
          m.x + Math.cos(angle) * out * (width - radius) * 0.5,
          y + rndBetween(-0.2, 0.2) * radius,
          m.z + Math.sin(angle) * out * (depth - radius) * 0.5
        ),
        radius: radius * rndBetween(0.8, 1.2),
      });
    }
    width *= m.narrow;
    depth *= m.narrow;
  }
  return { lobes, top: y };
};

/** How flat the anvil's lobes are */
const ANVIL_FLATTEN = 0.4;

/**
 * A cumulonimbus, like a summer storm seen from afar: a broad base of congestus rising
 * from both flanks into a main mass of several turrets, its top sheared into an anvil that
 * spreads mostly downwind (+x). Wider than it is tall, about 8 by 5 km.
 */
const cumulonimbusLobes = (): Lobe[] => {
  const w = rndBetween(2000, 2400);
  const height = w * rndBetween(2, 2.3);
  const body = mass({ x: 0, z: 0, width: w * 1.6, depth: w * 1.3, height, narrow: 0.97 });
  const turrets = Array.from({ length: rndIntBetween(2, 3) }, () =>
    mass({
      x: rndBetween(-0.5, 0.5) * w,
      z: rndBetween(-0.4, 0.4) * w,
      y: height * rndBetween(0.5, 0.65),
      width: w * rndBetween(0.7, 0.9),
      depth: w * rndBetween(0.7, 0.9),
      height: height * rndBetween(0.85, 1.05),
      narrow: 0.97,
    })
  );
  // The flanks: lower congestus stepping down to either side
  const flanks = [-1, 1].flatMap(side => [
    mass({
      x: side * w * rndBetween(1.1, 1.3),
      z: rndBetween(-0.3, 0.3) * w,
      width: w * 1.3,
      depth: w,
      height: height * rndBetween(0.4, 0.55),
      narrow: 0.88,
    }),
    mass({
      x: side * w * rndBetween(2, 2.3),
      z: rndBetween(-0.3, 0.3) * w,
      width: w * 1.1,
      depth: w * 0.8,
      height: height * rndBetween(0.15, 0.3),
      narrow: 0.8,
    }),
  ]);
  const top = Math.max(body.top, ...turrets.map(t => t.top));
  const radius = w * 0.42;
  const anvil = Array.from({ length: rndIntBetween(30, 36) }, (): Lobe => {
    // Thin at the upwind edge, spreading and fanning out downwind
    const along = rndBetween(-0.6, 1.6);
    return {
      centre: new THREE.Vector3(
        along * w,
        top - radius * rndBetween(0.2, 0.7),
        rndBetween(-0.5, 0.5) * w * (1.1 + Math.max(along, 0) * 0.5)
      ),
      radius: radius * rndBetween(0.85, 1.15),
      flatten: ANVIL_FLATTEN,
    };
  });
  return [body, ...turrets, ...flanks].flatMap(m => m.lobes).concat(anvil);
};

export type CloudPlacement = { offset?: THREE.Vector3; yaw?: number };

/**
 * One low-poly cumulus as a single non-indexed geometry, its base near y = 0. Every
 * vertex carries its lobe (aLobe) and the cloud's phase, its height up the cloud and how
 * dark the cloud's base is (aCloud), which cloudMaterial uses to animate and shade it.
 */
export const buildCloudGeometry = (
  kind: CloudKind,
  { offset = new THREE.Vector3(), yaw = 0 }: CloudPlacement = {}
): THREE.BufferGeometry => {
  const turn = new THREE.Matrix4().makeRotationY(yaw).setPosition(offset);
  const phase = Math.random() * 100;
  const dark = Math.random();
  const positions: number[] = [];
  const lobeAttr: number[] = [];
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  for (const { centre, radius, flatten = 1 } of kind === 'cb'
    ? cumulonimbusLobes()
    : stackLobes(kind)) {
    const lobe = new THREE.IcosahedronGeometry(1, radius > FINE_LOBE_RADIUS ? 1 : 0);
    lobe.applyMatrix4(
      new THREE.Matrix4().compose(
        centre,
        new THREE.Quaternion().setFromEuler(
          // A flattened lobe only turns about the vertical, so it stays a flat slab
          new THREE.Euler(flatten < 1 ? 0 : rndBetween(0, Math.PI), rndBetween(0, Math.PI), 0)
        ),
        new THREE.Vector3(
          radius * rndBetween(1, 1.2),
          radius * rndBetween(0.9, 1.1) * flatten,
          radius
        )
      )
    );
    const placedCentre = centre.clone().applyMatrix4(turn);
    const lobePhase = Math.random() * Math.PI * 2;
    const corners = lobe.getAttribute('position');
    for (let f = 0; f < corners.count; f += 3) {
      for (let k = 0; k < 3; k++) {
        v[k]!.fromBufferAttribute(corners, f + k);
        if (v[k]!.y < 0) v[k]!.y *= BELLY;
      }
      for (const corner of v) {
        corner.applyMatrix4(turn);
        positions.push(corner.x, corner.y, corner.z);
        lobeAttr.push(placedCentre.x, placedCentre.y, placedCentre.z, lobePhase);
      }
    }
    lobe.dispose();
  }

  let top = 0;
  for (let i = 1; i < positions.length; i += 3) top = Math.max(top, positions[i]!);
  const cloudAttr: number[] = [];
  for (let i = 1; i < positions.length; i += 3) cloudAttr.push(phase, positions[i]! / top, dark);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aLobe', new THREE.Float32BufferAttribute(lobeAttr, 4));
  geometry.setAttribute('aCloud', new THREE.Float32BufferAttribute(cloudAttr, 3));
  // Non-indexed, so every face gets its own flat normal: the facets of the low-poly look
  geometry.computeVertexNormals();
  return geometry;
};

/** The breathing and bobbing happen in the shader, so the bounds must allow for them */
export const padBounds = (geometry: THREE.BufferGeometry): void => {
  geometry.computeBoundingSphere();
  const sphere = geometry.boundingSphere!;
  sphere.radius = sphere.radius * 1.1 + 40;
};

export type CloudOptions = { kind?: CloudKind };

/** A single cloud, as the Models viewer shows it; the scenes place them in groups (Clouds) */
class Cloud {
  private mesh: THREE.Mesh | null = null;

  constructor(private readonly options: CloudOptions = {}) {}

  async load(): Promise<THREE.Object3D> {
    const geometry = buildCloudGeometry(this.options.kind ?? 'puff');
    padBounds(geometry);
    this.mesh = new THREE.Mesh(geometry, cloudMaterial);
    this.mesh.castShadow = true;
    return this.mesh;
  }

  dispose() {
    this.mesh?.geometry.dispose();
  }
}

export default Cloud;
