import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);

function modelLoader(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (data) => resolve(data), null, reject);
  });
}

const Models = {
  load: async (model, scale, pos, rotation) => {
    const gltf = await modelLoader(model);
    const mesh = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    mesh.position.set(pos.x, pos.y, pos.z);
    if (rotation && rotation.x) mesh.rotation.x = rotation.x;
    mesh.castShadow = true;
    return mesh;
  },
};

export default Models;
