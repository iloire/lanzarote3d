import * as THREE from 'three';
import { VOXEL, Voxels, box, line, voxelMesh } from '../../utils/voxels';
import { santaHatMesh } from './SantaHat';

/**
 * Santa and his sleigh in voxels, in the voxel pilots' frame (0.1 units a voxel, Y up from the
 * feet, facing +Z, centred on the harness), so Santa sits in a paraglider like any pilot and
 * wears a paramotor on his back. Coordinates below are in voxels.
 */
const RED = 0xd42a2a;
const DARK_RED = 0x9e1c1c;
const WHITE = 0xf6f6f2;
const SKIN = 0xf2b89a;
const NOSE = 0xe0786a;
const BLACK = 0x1a1a1a;
const GOLD = 0xf2c230;
const SACK = 0x8a5a2e;
const ROPE = 0xc8b48a;
const PRESENTS = [0x2a8a4a, 0x2a5ad4, 0xf2c230, 0xb04ad0, 0xf06a2a];

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function santaVoxels(): Voxels {
  const v: Voxels = new Map();
  // Seated in a black harness, legs out in front, black boots
  box(v, -14, 13, 8, 26, -28, 14, BLACK);
  box(v, -12, 11, 18, 28, 14, 40, RED);
  box(v, -12, 11, 10, 28, 40, 48, BLACK);
  // A round red coat with white fur down the front and a black belt with a gold buckle
  box(v, -13, 12, 26, 58, -24, 10, RED);
  box(v, -2, 1, 37, 58, 11, 11, WHITE);
  box(v, -13, 12, 32, 36, -24, 11, BLACK);
  box(v, -4, 3, 31, 37, 12, 12, GOLD);
  box(v, -2, 1, 33, 35, 12, 12, BLACK);
  // Arms up to the brakes, white cuffs and black mittens
  for (const side of [-1, 1]) {
    line(v, V(side * 13, 54, 0), V(side * 22, 68, 4), RED, 6);
    box(v, Math.min(side * 21, side * 27), Math.max(side * 21, side * 27), 68, 71, 2, 8, WHITE);
    box(v, Math.min(side * 21, side * 27), Math.max(side * 21, side * 27), 72, 77, 2, 8, BLACK);
  }
  // Head: a big white beard over a pink face, moustache, red nose and two black eyes
  box(v, -8, 7, 58, 74, -10, 6, SKIN);
  box(v, -9, 8, 52, 66, 4, 10, WHITE);
  box(v, -7, 6, 46, 56, 6, 12, WHITE);
  box(v, -6, 5, 64, 66, 7, 11, WHITE);
  box(v, -1, 0, 66, 68, 7, 11, NOSE);
  for (const x of [-5, 4]) box(v, x, x + 1, 69, 70, 7, 7, BLACK);
  return v;
}

/**
 * Santa for a paraglider's seat, his hat on his head. One mesh of blocks and the hat, so the
 * whole figure is two draw calls.
 */
export function createSantaVoxel(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'santa';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  group.add(voxelMesh(santaVoxels(), material));
  const hat = santaHatMesh(18, 18);
  hat.position.set(0, 74 * VOXEL, -2 * VOXEL);
  group.add(hat);
  return group;
}

/** Where the sleigh rides: behind and below Santa, clear of the paramotor's prop and cage */
const SLEIGH_FRONT = -110;
const SLEIGH_BACK = -170;
const SLEIGH_TOP = -40;

function sleighVoxels(): Voxels {
  const v: Voxels = new Map();
  const [front, back, top] = [SLEIGH_FRONT, SLEIGH_BACK, SLEIGH_TOP];
  // A red box on gold runners that curl up at the front, a darker rim round its top
  box(v, -16, 15, top - 14, top, back, front - 6, RED);
  box(v, -17, 16, top, top + 1, back, front - 6, DARK_RED);
  box(v, -16, 15, top - 14, top + 8, back - 4, back, RED);
  box(v, -16, 15, top - 10, top - 2, front - 6, front, RED);
  for (const x of [-14, 12]) {
    box(v, x, x + 1, top - 20, top - 19, back - 6, front, GOLD);
    for (const [a, b] of [
      [V(x, top - 18, back), V(x, top - 14, back)],
      [V(x, top - 18, front - 20), V(x, top - 14, front - 20)],
      [V(x, top - 20, front), V(x, top - 8, front + 6)],
    ])
      line(v, a!, b!, GOLD, 2);
  }
  // The sack of presents in the back, and a heap of wrapped boxes spilling out of it
  box(v, -11, 10, top, top + 16, back + 4, back + 26, SACK);
  box(v, -3, 2, top + 17, top + 18, back + 12, back + 18, GOLD);
  PRESENTS.forEach((color, i) => {
    const x = -12 + i * 5;
    const z = front - 30 + (i % 2) * 8;
    const height = 6 + (i % 3) * 2;
    box(v, x, x + 4, top, top + height, z, z + 5, color);
    box(v, x + 2, x + 2, top, top + height, z, z + 5, GOLD);
  });
  // The tow rope from under the harness, down and back below the cage (its bottom is at y -10
  // where it crosses z -46), to the sleigh's front
  line(v, V(0, 8, -20), V(0, -16, -30), ROPE, 1);
  line(v, V(0, -16, -30), V(0, top - 6, front), ROPE, 1);
  return v;
}

/** Santa's sleigh and its tow rope, to add to Santa's figure so it swings with him */
export function createSleigh(): THREE.Object3D {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  const sleigh = voxelMesh(sleighVoxels(), material);
  sleigh.name = 'sleigh';
  return sleigh;
}
