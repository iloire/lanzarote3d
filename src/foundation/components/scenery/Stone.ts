// inspired in: https://codepen.io/yitliu/pen/gOaPxRX
import * as THREE from "three";
const mat_stone = new THREE.MeshLambertMaterial({ color: 0x9eaeac });

class Stone {
  load(): THREE.Mesh {
    const geo_stone = new THREE.DodecahedronGeometry(1, 0);
    const stone = new THREE.Mesh(geo_stone, mat_stone);
    stone.castShadow = true;

    // stone.rotation.set(0, 12, Math.PI / 2);
    // stone.scale.set(3, 1, 1);
    // stone.position.set(-1, 1, 4.6);

    stone.rotation.set(0, 0, Math.PI / 2);
    stone.scale.set(1, 1, 1);
    stone.position.set(0, 0.7, 5.3);
    return stone;
  }
}

export default Stone;
