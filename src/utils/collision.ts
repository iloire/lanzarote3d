import * as THREE from "three";

export const getTerrainHeightBelowPosition = (
  pos: THREE.Vector3,
  terrain: THREE.Mesh,
  water: THREE.Mesh
): number => {
  const rayVertical = new THREE.Raycaster(
    new THREE.Vector3(pos.x, 100000, pos.z), // big enough value for Y
    new THREE.Vector3(0, -1, 0) // vertical
  );
  rayVertical.firstHitOnly = true;
  if (pos.y < 0) {
    return NaN; // below water
  }
  const intersectsFloor = rayVertical.intersectObjects([terrain]);
  if (intersectsFloor.length === 1) {
    const height = intersectsFloor[0].point.y;
    if (height >= pos.y) {
      // terrain above pg, crash
      return NaN;
    } else {
      return height;
    }
  } else {
    return NaN;
  }
};
