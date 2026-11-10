import * as THREE from 'three';
import { VOXEL, Voxels, box, line, ring, voxelMesh } from '../../../utils/voxels';

/**
 * A paramotor in the voxel pilots' own frame and block size: built to be added to a PilotVoxel's
 * model (0.1 units per voxel, Y up, the pilot facing +Z, centred on the harness), so it sits on
 * any pilot's back. Coordinates below are in voxels: x across, y up from the feet, z negative
 * behind the pilot's back.
 */

const SILVER = 0xc9ced4;
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

/** Where the prop turns and how far it reaches; the cage hoop sits just behind it, a little wider */
const HUB_AT = new THREE.Vector3(0, 33, -40);
const PROP_RADIUS = 38;
const CAGE_RADIUS = 43;
const CAGE_Z = -46;
/** Turns a second, slow enough to read as a prop and not a flicker; the disc stands in for the blur */
const PROP_SPIN = 25;

/** Frame, engine, tank, exhaust, cage hoop and the reserve on the lap: everything but the prop */
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

  // The cage: one thin hoop round the prop, held off the frame by four thin struts
  ring(v, HUB_AT.y, CAGE_Z, CAGE_RADIUS, SILVER);
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
      SILVER,
      1
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
