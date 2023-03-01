import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const defaultManager = new THREE.LoadingManager();

function modelLoader(url, manager?: THREE.LoadingManager) {
  console.log("loading model loader", url, manager);
  const loader = new GLTFLoader(manager || defaultManager);
  return new Promise((resolve, reject) => {
    loader.load(url, (data) => resolve(data), null, reject);
  });
}

const Models = {
  manager: defaultManager,
  loadSimple: async (model: string, manager: THREE.LoadingManager) => {
    const gltf: any = await modelLoader(model, manager);
    const mesh = gltf.scene.children[0];
    mesh.castShadow = true;
    return mesh;
  },
  load: async (model: THREE.Mesh, scale: number, pos?: THREE.Vector3) => {
    const gltf: any = await modelLoader(model);
    const mesh = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    if (pos) {
      mesh.position.copy(pos);
    }
    mesh.castShadow = true;
    return mesh;
  },
};

export default Models;
