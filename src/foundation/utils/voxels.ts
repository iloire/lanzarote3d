import * as THREE from 'three';

/**
 * Blocky models built in code, in the voxel pilots' own frame and block size: 0.1 units per
 * voxel, Y up, the pilot facing +Z. A model is a map of voxel to colour, meshed into one mesh
 * of only the faces no neighbour hides.
 */
export const VOXEL = 0.1;

export type Voxels = Map<string, number>;

export const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

export function box(
  v: Voxels,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  c: number
) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) v.set(key(x, y, z), c);
}

/** A tube `thick` voxels across from a to b */
export function line(v: Voxels, a: THREE.Vector3, b: THREE.Vector3, c: number, thick = 2) {
  const steps = Math.ceil(a.distanceTo(b));
  const p = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    p.lerpVectors(a, b, i / steps);
    const [x, y, z] = [Math.round(p.x), Math.round(p.y), Math.round(p.z)];
    box(v, x, x + thick - 1, y, y + thick - 1, z, z + thick - 1, c);
  }
}

/** A ring in the plane across the flight, round (0, cy) at depth z */
export function ring(v: Voxels, cy: number, z: number, radius: number, c: number, thick = 0.8) {
  for (let x = -radius - 1; x <= radius + 1; x++)
    for (let y = cy - radius - 1; y <= cy + radius + 1; y++)
      if (Math.abs(Math.hypot(x, y - cy) - radius) < thick) v.set(key(x, y, z), c);
}

const FACES: [number[], number[][]][] = [
  [
    [1, 0, 0],
    [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  ],
  [
    [-1, 0, 0],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  ],
  [
    [0, 1, 0],
    [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
  ],
  [
    [0, -1, 0],
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  ],
  [
    [0, 0, 1],
    [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  ],
  [
    [0, 0, -1],
    [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
];

/** One mesh of blocks, only the faces no neighbour hides, coloured per vertex */
export function voxelMesh(
  v: Voxels,
  material: THREE.Material,
  origin = new THREE.Vector3()
): THREE.Mesh {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];
  const index: number[] = [];
  const c = new THREE.Color();
  v.forEach((hex, k) => {
    const [x, y, z] = k.split(',').map(Number);
    c.setHex(hex, THREE.SRGBColorSpace);
    for (const [n, corners] of FACES) {
      if (v.has(key(x + n[0], y + n[1], z + n[2]))) continue;
      const base = position.length / 3;
      for (const [dx, dy, dz] of corners) {
        position.push(
          (x + dx - origin.x) * VOXEL,
          (y + dy - origin.y) * VOXEL,
          (z + dz - origin.z) * VOXEL
        );
        normal.push(...n);
        color.push(c.r, c.g, c.b);
      }
      index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  geometry.setIndex(index);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}
