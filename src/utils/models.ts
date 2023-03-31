import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";

const defaultManager = new THREE.LoadingManager();

function modelLoader(url, draco: boolean, manager?: THREE.LoadingManager) {
  const man = manager || defaultManager;
  const loader = draco ? new DRACOLoader(man) : new GLTFLoader(man);
  console.log(loader);
  if (draco) {
    // loader.setDecoderPath("/examples/jsm/libs/draco/");
    // loader.preload();
  }
  return new Promise((resolve, reject) => {
    loader.load(url, (data) => resolve(data), null, reject);
  });
}

const Models = {
  manager: defaultManager,
  loadGltf: async (model: string, manager?: THREE.LoadingManager) => {
    return modelLoader(model, false, manager);
  },
  loadSimpleDraco: async (model: string, manager?: THREE.LoadingManager) => {
    const gltf: any = await modelLoader(model, true, manager);
    const mesh =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  loadSimple: async (model: string, manager?: THREE.LoadingManager) => {
    const gltf: any = await modelLoader(model, false, manager);
    const mesh =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  load: async (model: THREE.Mesh, scale: number, pos?: THREE.Vector3) => {
    console.warn("deprecated, use loadsimple instead");
    const gltf: any = await modelLoader(model, false);
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
