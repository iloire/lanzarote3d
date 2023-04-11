import * as THREE from "three";
import Weather from "../../../elements/weather";
import Thermal, { ThermalDimensions } from "../../../components/thermal";
import { rndBetween, rndIntBetween } from "../../../utils/math";

const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};

const generateRandomThermalDimensions = (
  lclLevel: number,
  isSuperThermal: boolean
): ThermalDimensions => {
  const multiplier = isSuperThermal ? 1.4 : 1;
  const heightMultiplier = isSuperThermal ? 1.3 : 1;
  return {
    bottomRadius: rndIntBetween(420 * multiplier, 490 * multiplier),
    topRadius: rndIntBetween(500 * multiplier, 700 * multiplier),
    height: generateRandomLcl(lclLevel) * heightMultiplier,
  };
};

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
    return NaN;
  }
};

const THERMAL_OPACITY = 0.04;

export const generateThermalPair = (
  position: THREE.Vector3,
  weather: Weather,
  superThermal: boolean = false,
  dimensions?: ThermalDimensions
): Thermal[] => {
  const thermal = new Thermal(
    dimensions ||
      generateRandomThermalDimensions(weather.getLclLevel(), superThermal),
    position,
    THERMAL_OPACITY,
    weather,
    true,
    superThermal
  );

  const interiorThermalDimensions = {
    bottomRadius: rndIntBetween(190, 250) / 2,
    topRadius: rndIntBetween(400, 600) / 2,
    height: generateRandomLcl(weather.getLclLevel()),
  };

  const thermalInside = new Thermal(
    interiorThermalDimensions,
    position,
    THERMAL_OPACITY,
    weather,
    false,
    false
  );
  return [thermal, thermalInside];
};

export type MeshAroundAreaParam = THREE.Object3D | (() => THREE.Object3D);

export const addMeshAroundArea = (
  params: MeshAroundAreaParam[],
  pos: THREE.Vector3,
  number: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene,
  minDistance?: number,
  y?: number
) => {
  for (let index = 0; index < number; index++) {
    const param = params[rndIntBetween(0, params.length)];
    let obj;
    if (typeof param === "function") {
      obj = param();
    } else {
      obj = param;
    }
    const newX = pos.x + (minDistance || 30 + index) * rndIntBetween(1, 5);
    const newZ = pos.z + (minDistance || 30 + index) * rndIntBetween(1, 10);

    const terrainHeight = getTerrainHeight(
      new THREE.Vector3(newX, 0, newZ),
      terrain
    );
    if (isNaN(terrainHeight)) {
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
