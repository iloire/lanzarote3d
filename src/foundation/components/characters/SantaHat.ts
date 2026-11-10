import * as THREE from 'three';
import { VOXEL, Voxels, box, voxelMesh } from '../../utils/voxels';

const RED = 0xd42a2a;
const WHITE = 0xf6f6f2;

/**
 * A Santa hat in voxels, its brim `width` by `depth` voxels, centred on the origin, sitting on
 * y = 0: a white fur band, then a soft red cone that rises, bends over to the pilot's side and
 * droops, with a white bobble hanging off the tip. It flops sideways rather than back so the
 * droop shows from behind, where the camera follows.
 */
function hatVoxels(width: number, depth: number): Voxels {
  const v: Voxels = new Map();
  const halfW = Math.ceil(width / 2);
  const halfD = Math.ceil(depth / 2);
  // The fur band, a voxel proud of the head all round
  box(v, -halfW - 1, halfW, 0, 3, -halfD - 1, halfD, WHITE);
  // The cone, a layer a voxel: full and round low down, narrowing faster near the tip, rising to
  // about the head's width and then curling over to one side and down
  const layers = Math.round(width * 2);
  const rise = width * 0.95;
  let tipX = 0;
  let tipY = 4;
  for (let i = 0; i <= layers; i++) {
    const t = i / layers;
    const taper = Math.pow(1 - t, 0.8);
    const halfX = Math.max(1, Math.round(halfW * taper));
    const halfZ = Math.max(1, Math.round(halfD * taper));
    tipX = Math.round(t * t * width * 0.9);
    tipY =
      4 +
      Math.round(
        rise * Math.sin(Math.min(t / 0.65, 1) * (Math.PI / 2)) - Math.max(0, t - 0.65) * rise * 1.4
      );
    box(v, tipX - halfX, tipX + halfX - 1, tipY, tipY, -halfZ, halfZ - 1, RED);
  }
  // The bobble, hanging off the tip
  box(v, tipX - 1, tipX + 2, tipY - 4, tipY - 1, -2, 1, WHITE);
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
  // Pulled well down over the head (and the helmet), the band just above the eyes
  const centre = bounds.getCenter(new THREE.Vector3());
  hat.position.set(centre.x, bounds.max.y - size.y * 0.42, centre.z);
  head.add(hat);
}
