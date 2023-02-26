import * as THREE from "three";
import Weather from "./weather";

const createThermalMesh = (
  bottomRadius: number,
  topRadius: number,
  height: number,
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
    opacity: 0.05, // set the opacity level (0-1)
    transparent: true, // enable transparencyopacity: 0.5, // set the opacity level (0-1)
  });

  const cylinder = new THREE.Mesh(geometry, material);
  initialPosition.y = initialPosition.y + height / 2;
  cylinder.position.copy(initialPosition);

  return cylinder;
};
class Thermal {
  mesh: THREE.Mesh;

  constructor(
    initialPosition: THREE.Vector3,
    height: number,
    weather: Weather,
    relativeScale: number = 1
  ) {
    const thermal = createThermalMesh(
      250 * relativeScale,
      150 * relativeScale,
      height,
      initialPosition
    );
    this.mesh = thermal;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}

export default Thermal;
