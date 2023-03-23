import * as THREE from "three";
import { rndIntBetween } from "../utils/math";

const pineMaterials = [
  new THREE.MeshBasicMaterial({ color: 0x0d5b28 }),
  new THREE.MeshBasicMaterial({ color: 0x093923 }),
  new THREE.MeshBasicMaterial({ color: 0x2e8d36 }),
  new THREE.MeshBasicMaterial({ color: 0x081f1c }),
  new THREE.MeshBasicMaterial({ color: 0x00b662 }),
];

class PineTree {
  load(): THREE.Object3D {
    const group = new THREE.Group();

    const pineGeometry = new THREE.ConeGeometry(3, 9, 8);
    const pine = new THREE.Mesh(
      pineGeometry,
      pineMaterials[rndIntBetween(0, pineMaterials.length)]
    );
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
