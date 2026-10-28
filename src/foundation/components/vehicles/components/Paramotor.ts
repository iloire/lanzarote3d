import * as THREE from 'three';

/**
 * A paramotor in the voxel pilots' own frame and block size: built to be added to a PilotVoxel's
 * model (0.1 units per voxel, Y up, the pilot facing +Z, centred on the harness), so it sits on
 * any pilot's back. Coordinates below are in voxels: x across, y up from the feet, z negative
 * behind the pilot's back.
 */
const VOXEL = 0.1;

const SILVER = 0xc9ced4;
const NET = 0x3a3a3a;
const ENGINE = 0x1c1c1c;
const FINS = 0x6a6a6a;
const TANK = 0xece7da;
const EXHAUST = 0x4a4a4a;
const PROP = 0x222222;
const PROP_TIP = 0xf2f2f2;
const HUB = 0x8a8a8a;
const RESERVE = 0xd8262a;
const RESERVE_LID = 0x1c1c1c;
const HANDLE = 0xffd21f;

/** Where the prop turns and how far it reaches; the cage sits just behind it, a little wider */
const HUB_AT = new THREE.Vector3(0, 33, -40);
const PROP_RADIUS = 38;
const CAGE_RADIUS = 43;
const CAGE_Z = -46;
/** Turns a second, slow enough to read as a prop and not a flicker; the disc stands in for the blur */
const PROP_SPIN = 25;

type Voxels = Map<string, number>;

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

function box(
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
function line(v: Voxels, a: THREE.Vector3, b: THREE.Vector3, c: number, thick = 2) {
  const steps = Math.ceil(a.distanceTo(b));
  const p = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    p.lerpVectors(a, b, i / steps);
    const [x, y, z] = [Math.round(p.x), Math.round(p.y), Math.round(p.z)];
    box(v, x, x + thick - 1, y, y + thick - 1, z, z + thick - 1, c);
  }
}

/** A ring in the plane across the flight, round (0, cy) at depth z */
function ring(v: Voxels, cy: number, z: number, radius: number, c: number, thick = 1.2) {
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
function voxelMesh(v: Voxels, material: THREE.Material, origin = new THREE.Vector3()): THREE.Mesh {
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

/** Frame, engine, tank, exhaust, cage and the reserve on the lap: everything but the prop */
function frameVoxels(): Voxels {
  const v: Voxels = new Map();
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // The frame against the harness back: two uprights and two crossbars
  for (const x of [-14, 12]) box(v, x, x + 1, 8, 50, -30, -29, SILVER);
  box(v, -14, 13, 8, 9, -30, -29, SILVER);
  box(v, -14, 13, 49, 50, -30, -29, SILVER);
  // J-bars from the uprights up and forward to the carabiners by the shoulders
  for (const x of [-14, 12]) line(v, V(x, 50, -29), V(x, 52, -12), SILVER);

  // Tank low down, engine above it with fins on the cylinder head, the exhaust down the side
  box(v, -8, 7, 4, 14, -37, -31, TANK);
  box(v, -6, 5, 18, 38, -38, -31, ENGINE);
  for (let y = 39; y <= 44; y += 2) box(v, -4, 3, y, y, -37, -32, FINS);
  line(v, V(6, 30, -35), V(9, 20, -35), EXHAUST);
  line(v, V(9, 20, -35), V(9, 14, -44), EXHAUST);

  // The cage behind the prop: an outer hoop, a net of spokes and an inner hoop, held off the frame
  ring(v, HUB_AT.y, CAGE_Z, CAGE_RADIUS, SILVER);
  ring(v, HUB_AT.y, CAGE_Z - 1, CAGE_RADIUS, SILVER);
  ring(v, HUB_AT.y, CAGE_Z, 24, NET, 0.6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const at = (r: number) => V(Math.cos(a) * r, HUB_AT.y + Math.sin(a) * r, CAGE_Z);
    line(v, at(6), at(CAGE_RADIUS), NET, 1);
  }
  for (const [x, y] of [
    [-14, 9],
    [12, 9],
    [-14, 49],
    [12, 49],
  ]) {
    const a = Math.atan2(y - HUB_AT.y, x);
    line(
      v,
      V(x, y, -30),
      V(Math.cos(a) * CAGE_RADIUS, HUB_AT.y + Math.sin(a) * CAGE_RADIUS, CAGE_Z),
      SILVER
    );
  }
  // The shaft from the engine back to the hub
  box(v, -1, 0, HUB_AT.y - 1, HUB_AT.y, HUB_AT.z, -38, HUB);

  // On a paramotor the reserve rides in front, on the lap: a big red container over the thighs
  // with a black lid, strapped back to the harness, and its yellow handle on top
  box(v, -10, 9, 23, 31, -5, 7, RESERVE);
  box(v, -10, 9, 32, 32, -5, 7, RESERVE_LID);
  box(v, -10, 9, 26, 27, 8, 8, RESERVE_LID);
  for (const x of [-11, 10]) box(v, x, x, 26, 27, -9, 6, RESERVE_LID);
  for (const x of [-3, 2]) box(v, x, x, 33, 35, 3, 4, HANDLE);
  box(v, -3, 2, 36, 36, 3, 4, HANDLE);
  return v;
}

/** Two blades across the hub, tapering to white tips */
function propVoxels(): Voxels {
  const v: Voxels = new Map();
  const { y, z } = HUB_AT;
  for (let x = -PROP_RADIUS; x <= PROP_RADIUS; x++) {
    const width = Math.abs(x) < 12 ? 3 : 2;
    const color = Math.abs(x) > PROP_RADIUS - 4 ? PROP_TIP : PROP;
    // Each blade twisted a voxel the other way, as a pitched blade is
    const lift = x < 0 ? 0 : -1;
    box(v, x, x, y - 1 + lift, y - 2 + width + lift, z, z, color);
  }
  box(v, -2, 1, y - 2, y + 1, z - 1, z + 1, HUB);
  return v;
}

/**
 * The paramotor, to add to a voxel pilot's model. The prop spins on its own clock whenever it is
 * drawn, so it needs no update call.
 */
export function createParamotor(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'paramotor';
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.15,
  });

  group.add(voxelMesh(frameVoxels(), material));

  const prop = voxelMesh(propVoxels(), material, HUB_AT);
  prop.name = 'paramotor-prop';
  prop.position.copy(HUB_AT).multiplyScalar(VOXEL);
  prop.onBeforeRender = () => {
    prop.rotation.z = (performance.now() / 1000) * PROP_SPIN;
    prop.updateMatrixWorld();
  };
  group.add(prop);

  // The blur of the turning blades
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(PROP_RADIUS * VOXEL, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  disc.position.copy(prop.position);
  group.add(disc);

  return group;
}
