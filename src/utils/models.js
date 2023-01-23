import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const manager = new THREE.LoadingManager();

function modelLoader(url) {
  const loader = new GLTFLoader(manager);
  return new Promise((resolve, reject) => {
    loader.load(url, (data) => resolve(data), null, reject);
  });
}

const Models = {
  manager,
  load: async (model, scale, pos, rotation) => {
    const gltf = await modelLoader(model);
    const mesh = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.castShadow = true;
    if (rotation && rotation.x) mesh.rotation.x = rotation.x;
    return mesh;
  },
};

export default Models;
