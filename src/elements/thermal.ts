import * as THREE from "three";
import Weather from "./weather";

const createThermalMesh = (
  bottomRadius: number,
  topRadius: number,
  height: number,
  opacity: number,
  initialPosition: THREE.Vector3
) => {
  const geometry = new THREE.CylinderGeometry(
    topRadius,
    bottomRadius,
    height,
    32
  );

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity, // set the opacity level (0-1)
    transparent: true, // enable transparencyopacity: 0.5, // set the opacity level (0-1)
  });

  const cylinder = new THREE.Mesh(geometry, material);
  initialPosition.y = initialPosition.y + height / 2;
  cylinder.position.copy(initialPosition);

  return cylinder;
};

export type ThermalDimensions = {
  bottomRadius: number;
  topRadius: number;
  height: number;
};

class Thermal {
  mesh: THREE.Mesh;
  __isMainThermal: boolean;

  constructor(
    dimensions: ThermalDimensions,
    initialPosition: THREE.Vector3,
    opacity,
    weather: Weather,
    isMainThermal: boolean
  ) {
    this.__isMainThermal = isMainThermal;
    const thermal = createThermalMesh(
      dimensions.topRadius,
      dimensions.bottomRadius,
      dimensions.height,
      opacity,
      initialPosition.clone()
    );
    this.mesh = thermal;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  isMainThermal(): boolean {
    return this.__isMainThermal;
  }
}

export default Thermal;
