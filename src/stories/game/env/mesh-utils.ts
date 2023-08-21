import * as THREE from "three";
import { rndBetween, rndIntBetween } from "../../../utils/math";

const getRandomRotation = (): THREE.Euler => {
  return new THREE.Euler(0, rndBetween(0, Math.PI), 0);
};

const getTerrainHeight = (pos: THREE.Vector3, terrain: THREE.Mesh) => {
  const rayVertical = new THREE.Raycaster(
    new THREE.Vector3(pos.x, 10000, pos.z), // big enough value for Y
    new THREE.Vector3(0, -1, 0) // vertical
  );
  const intersects = rayVertical.intersectObject(terrain);
  if (intersects.length === 1) {
    return intersects[0].point.y;
  } else {
    console.error("can not calculate terrain height");
    console.log(terrain);
    console.log(rayVertical);
    return NaN;
  }
};

export type MeshAroundAreaParam = THREE.Object3D | (() => THREE.Object3D);

export const addMeshAroundArea = (
  meshTypes: MeshAroundAreaParam[],
  centerPosition: THREE.Vector3,
  numberItemsToAdd: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene,
  minDistance?: number,
  y?: number
) => {
  for (let index = 0; index < numberItemsToAdd; index++) {
    const meshType = meshTypes[rndIntBetween(0, meshTypes.length)];
    let obj;
    if (typeof meshType === "function") {
      obj = meshType();
    } else {
      obj = meshType;
    }
    const newX =
      centerPosition.x + (minDistance || 30 + index) * rndIntBetween(1, 5);
    const newZ =
      centerPosition.z + (minDistance || 30 + index) * rndIntBetween(1, 10);

    const terrainHeight = getTerrainHeight(
      new THREE.Vector3(newX, 0, newZ),
      terrain
    );
    if (isNaN(terrainHeight)) {
      console.error("can not calculate terrain height");
      break;
    }
    const meshPos = new THREE.Vector3(newX, terrainHeight, newZ);
    const currentScale = obj.scale.x;
    const newScale = currentScale * (1 + 0.1 * rndIntBetween(-3, 3));

    const meshClone = obj.clone();
    meshClone.scale.set(newScale, newScale, newScale);
    meshClone.position.copy(meshPos);
    meshClone.rotation.copy(getRandomRotation());
    if (y) {
      meshClone.position.y += y;
    }
    scene.add(meshClone);
  }
};
