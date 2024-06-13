import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import * as THREE from "three";

const defaultManager = new THREE.LoadingManager();

function loadMtl(model: any, manager?: THREE.LoadingManager) {
  const man = manager || defaultManager;
  const loader = new MTLLoader(man);
  return new Promise((resolve, reject) => {
    loader.load(model, (data) => resolve(data), null, reject);
  });
}

function loadModel(model: any, draco: boolean, manager?: THREE.LoadingManager) {
  const man = manager || defaultManager;
  const loader = draco ? new DRACOLoader(man) : new GLTFLoader(man);
  // if (draco) {
  // loader.setDecoderPath("/examples/jsm/libs/draco/");
  // loader.preload();
  // }
  return new Promise((resolve, reject) => {
    loader.load(model, (data) => resolve(data), null, reject);
  });
}

const Models = {
  manager: defaultManager,
  loadObj: async (
    model: string,
    mtl: string,
    manager?: THREE.LoadingManager,
  ) => {
    const man = manager || defaultManager;
    const objLoader: any = new OBJLoader(man);
    const materials = await loadMtl(mtl);
    console.log("materials", materials);
    objLoader.setMaterials(materials);
    return new Promise((resolve, reject) => {
      objLoader.load(model, (data) => resolve(data), null, reject);
    });
  },
  loadGltf: async (model: string, manager?: THREE.LoadingManager) => {
    return loadModel(model, false, manager);
  },
  loadSimpleDraco: async (model: string, manager?: THREE.LoadingManager) => {
    const gltf: any = await loadModel(model, true, manager);
    const mesh =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  loadSimple: async (model: string, manager?: THREE.LoadingManager) => {
    const gltf: any = await loadModel(model, false, manager);
    const mesh =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  load: async (model: THREE.Mesh, scale: number, pos?: THREE.Vector3) => {
    console.warn("deprecated, use loadsimple instead");
    const gltf: any = await loadModel(model, false);
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
