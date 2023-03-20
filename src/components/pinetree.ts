import * as THREE from "three";

class PineTree {
  load(): THREE.Object3D {
    const group = new THREE.Group();
    // Create the pine tree geometry
    const pineGeometry = new THREE.ConeGeometry(3, 9, 8);
    const pineMaterial = new THREE.MeshBasicMaterial({ color: 0x0b6623 });
    const pine = new THREE.Mesh(pineGeometry, pineMaterial);
    pine.position.y = 12;
    group.add(pine);

    // Create the trunk geometry
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.8, 6);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    pine.position.y = 6;
    group.add(trunk);

    return group;
  }
}

export default PineTree;
