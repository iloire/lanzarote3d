import * as THREE from "three";
const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });

class House {
  load(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(10, 10, 4); //widht, height, depth
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.rotation.set(0, 0, Math.PI / 2);
    return mesh;
  }
}

export default House;
