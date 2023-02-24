import * as THREE from "three";

class Thermal {
  mesh: THREE.Mesh;

  constructor(
    initialPosition: THREE.Vector3,
    height: number,
    relativeScale: number = 1
  ) {
    const geometry = new THREE.CylinderGeometry(
      250 * relativeScale,
      100 * relativeScale,
      height,
      32
    );
    console.log(height);

    // Create a new material with a solid color
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.1, // set the opacity level (0-1)
      transparent: true, // enable transparencyopacity: 0.5, // set the opacity level (0-1)
    });

    // Create a new mesh by combining the geometry and material
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.copy(initialPosition);

    this.mesh = cylinder;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}

export default Thermal;
