import * as THREE from 'three';

/** Where a city's trees stand, as 3d/city-to-glb.py writes them: world x, z and a scale, per tree */
export type TreeSpots = number[];

/**
 * Trunk, canopy and its top, in metres: width, height, depth, centre height, and shade (the
 * canopy's colour comes from the instance; the trunk is a dark shade of it, the top a light one)
 */
const PARTS: [number, number, number, number, number][] = [
  [0.9, 5, 0.9, 2.5, 0.3],
  [8, 5.5, 8, 7.5, 1],
  [5, 3, 5, 11.5, 1.25],
];
// Canopy greens (sRGB), each tree a little lighter or darker; a share already turning, this late
// in the year
const GREENS = ['#47702f', '#3f6a34', '#56783a', '#3a5f2a'];
const AUTUMN = ['#c98a2e', '#b4552a', '#c9a73c'];
const AUTUMN_SHARE = 0.15;
const BRIGHTNESS = [0.85, 1.15];

/** A voxel tree a metre to the unit, its boxes' triangles end to end, shaded per vertex */
function treeGeometry(): THREE.BufferGeometry {
  const boxes = PARTS.map(([w, h, d, y]) =>
    new THREE.BoxGeometry(w, h, d).translate(0, y, 0).toNonIndexed()
  );
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(boxes.flatMap(box => Array.from(box.attributes[name]!.array))),
      3
    );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', merged('position'));
  geometry.setAttribute('normal', merged('normal'));
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(
        boxes.flatMap((box, i) => Array(box.attributes['position']!.count * 3).fill(PARTS[i]![4]))
      ),
      3
    )
  );
  boxes.forEach(box => box.dispose());
  return geometry;
}

/** Deterministic 0-1 per number, so the park is the same on every load */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * A city's park trees, every one in a single instanced mesh standing on the ground: voxel blocks
 * turned any way, each its own size and shade of green, a few in autumn colours. They cast
 * shadows on the lawns and each other.
 */
export function cityTrees(
  spots: TreeSpots,
  unitsPerMetre: number,
  ground: number
): THREE.InstancedMesh {
  const count = Math.floor(spots.length / 3);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const mesh = new THREE.InstancedMesh(treeGeometry(), material, count);
  mesh.name = 'city-trees';
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const turn = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, z, size] = [spots[i * 3]!, spots[i * 3 + 1]!, spots[i * 3 + 2]!];
    position.set(x, ground, z);
    turn.setFromAxisAngle(up, hash(i) * Math.PI * 2);
    // A little taller or squatter than wide, so the canopies don't line up
    scale.set(size, size * (0.85 + 0.3 * hash(i + 0.3)), size).multiplyScalar(unitsPerMetre);
    mesh.setMatrixAt(i, matrix.compose(position, turn, scale));
    const palette = hash(i + 0.9) < AUTUMN_SHARE ? AUTUMN : GREENS;
    const brightness = BRIGHTNESS[0]! + (BRIGHTNESS[1]! - BRIGHTNESS[0]!) * hash(i + 0.6);
    colour.set(palette[Math.floor(hash(i + 1.2) * palette.length)]!).multiplyScalar(brightness);
    mesh.setColorAt(i, colour);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // They spread over the whole park, so the mesh is never culled as a whole
  mesh.frustumCulled = false;
  return mesh;
}
