import * as THREE from 'three';
import { rndBetween, rndIntBetween } from '../../utils/math';
import { cloudMaterial } from '../../rendering/cloudMaterial';

export type CloudKind = 'puff' | 'tower';

/**
 * How each kind stacks its lobes: the footprint's width, how many layers rise from the
 * flat base, how much narrower each layer is than the one below and how far above it
 * sits, in radii
 */
const SHAPES: Record<
  CloudKind,
  { width: [number, number]; layers: [number, number]; narrow: number; rise: number }
> = {
  puff: { width: [450, 850], layers: [2, 3], narrow: 0.65, rise: 0.85 },
  tower: { width: [700, 1000], layers: [6, 7], narrow: 0.85, rise: 0.9 },
};

/** Lobes bigger than this get the finer icosahedron (80 faces instead of 20) */
const FINE_LOBE_RADIUS = 150;

type Lobe = { centre: THREE.Vector3; radius: number };

const stackLobes = (kind: CloudKind): Lobe[] => {
  const shape = SHAPES[kind];
  const lobes: Lobe[] = [];
  let width = rndBetween(...shape.width);
  const layers = rndIntBetween(...shape.layers);
  let y = 0;
  for (let layer = 0; layer < layers; layer++) {
    const radius = width * rndBetween(0.22, 0.28);
    const count = layer === 0 ? rndIntBetween(3, 5) : rndIntBetween(2, 3);
    // The bottom layer sinks below the base, which then cuts it flat
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

export type CloudPlacement = { offset?: THREE.Vector3; yaw?: number };

/**
 * One low-poly cumulus as a single non-indexed geometry, its base flat at y = 0. Every
 * vertex carries its lobe (aLobe) and the cloud's phase and its height up the cloud
 * (aCloud), which cloudMaterial uses to animate and shade it.
 */
export const buildCloudGeometry = (
  kind: CloudKind,
  { offset = new THREE.Vector3(), yaw = 0 }: CloudPlacement = {}
): THREE.BufferGeometry => {
  const turn = new THREE.Matrix4().makeRotationY(yaw).setPosition(offset);
  const phase = Math.random() * 100;
  const positions: number[] = [];
  const lobeAttr: number[] = [];
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();

  for (const { centre, radius } of stackLobes(kind)) {
    const lobe = new THREE.IcosahedronGeometry(1, radius > FINE_LOBE_RADIUS ? 1 : 0);
    lobe.applyMatrix4(
      new THREE.Matrix4().compose(
        centre,
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rndBetween(0, Math.PI), rndBetween(0, Math.PI), 0)
        ),
        new THREE.Vector3(radius * rndBetween(1, 1.2), radius * rndBetween(0.8, 1), radius)
      )
    );
    const placedCentre = centre.clone().applyMatrix4(turn);
    const lobePhase = Math.random() * Math.PI * 2;
    const corners = lobe.getAttribute('position');
    for (let f = 0; f < corners.count; f += 3) {
      for (let k = 0; k < 3; k++) {
        v[k]!.fromBufferAttribute(corners, f + k);
        v[k]!.y = Math.max(v[k]!.y, 0);
      }
      // Faces wholly under the base collapse to nothing; the rest form its flat underside
      edgeA.subVectors(v[1]!, v[0]!);
      edgeB.subVectors(v[2]!, v[0]!);
      if (edgeA.cross(edgeB).lengthSq() < 1e-6) continue;
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
  for (let i = 1; i < positions.length; i += 3) cloudAttr.push(phase, positions[i]! / top);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aLobe', new THREE.Float32BufferAttribute(lobeAttr, 4));
  geometry.setAttribute('aCloud', new THREE.Float32BufferAttribute(cloudAttr, 2));
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
