import * as THREE from 'three';
import { VOXEL, Voxels, box, voxelMesh } from '../../utils/voxels';

const RED = 0xd42a2a;
const WHITE = 0xf6f6f2;

/**
 * A Santa hat in voxels, its brim `width` by `depth` voxels, centred on the origin, sitting on
 * y = 0: a white fur band, then a red cone that narrows as it rises and flops back behind the
 * head (-Z, the pilot faces +Z), with a white bobble on the tip.
 */
function hatVoxels(width: number, depth: number): Voxels {
  const v: Voxels = new Map();
  const halfW = Math.ceil(width / 2);
  const halfD = Math.ceil(depth / 2);
  // The fur band, a voxel proud of the head all round
  box(v, -halfW - 1, halfW, 0, 2, -halfD - 1, halfD, WHITE);
  // The cone: as tall as the head is wide, narrowing as it rises and drifting back, then
  // flopping over and down behind the head
  const layers = Math.round(width * 1.4);
  const rise = width * 0.9;
  let tipY = 3;
  let tipZ = 0;
  for (let i = 0; i <= layers; i++) {
    const t = i / layers;
    const halfX = Math.max(1, Math.round(halfW * (1 - t)));
    const halfZ = Math.max(1, Math.round(halfD * (1 - t)));
    tipZ = -Math.round(t * t * depth * 1.1);
    tipY = 3 + Math.round(rise * (t < 0.6 ? t / 0.6 : 1 - (t - 0.6) * 0.8));
    box(v, -halfX, halfX - 1, tipY, tipY + 1, tipZ - halfZ, tipZ + halfZ - 1, RED);
  }
  // The bobble, hanging off the tip
  box(v, -2, 1, tipY - 3, tipY, tipZ - 4, tipZ - 1, WHITE);
  return v;
}

/** A Santa hat `width` by `depth` voxels at the brim, centred on the origin, sitting on y = 0 */
export function santaHatMesh(width: number, depth: number): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const hat = voxelMesh(hatVoxels(width, depth), material);
  hat.name = 'santa-hat';
  return hat;
}

/**
 * Puts a Santa hat on a voxel pilot cut into parts, on its head, so it turns with it. A pilot
 * without a head part goes bareheaded.
 */
export function addSantaHat(pilot: THREE.Object3D): void {
  const head = pilot.getObjectByName('head');
  const mesh = head?.getObjectByName('head-mesh');
  if (!head || !(mesh instanceof THREE.Mesh)) return;
  mesh.geometry.computeBoundingBox();
  mesh.updateMatrix();
  // The head in its pivot's frame, which is the model's, moved to the neck joint
  const bounds = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrix);
  const size = bounds.getSize(new THREE.Vector3());
  const hat = santaHatMesh(Math.round(size.x / VOXEL), Math.round(size.z / VOXEL));
  // Pulled down a little over the top of the head
  const centre = bounds.getCenter(new THREE.Vector3());
  hat.position.set(centre.x, bounds.max.y - VOXEL * 2, centre.z);
  head.add(hat);
}
