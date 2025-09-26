import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

const defaultManager = new THREE.LoadingManager();

function modelLoader(url: string, draco: boolean, manager?: THREE.LoadingManager): Promise<GLTF> {
  const man = manager || defaultManager;
  const loader = draco ? new DRACOLoader(man) : new GLTFLoader(man);
  if (draco) {
    // loader.setDecoderPath("/examples/jsm/libs/draco/");
    // loader.preload();
  }
  return new Promise<GLTF>((resolve, reject) => {
    loader.load(url, data => resolve(data as GLTF), undefined, reject);
  });
}

function objLoader(url: string, manager?: THREE.LoadingManager): Promise<THREE.Group> {
  const man = manager || defaultManager;
  const loader = new OBJLoader(man);
  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(url, data => resolve(data), undefined, reject);
  });
}

const Models = {
  manager: defaultManager,
  loadObj: async (model: string, manager?: THREE.LoadingManager): Promise<THREE.Group> => {
    const obj = await objLoader(model, manager);
    return obj;
  },
  loadGltf: async (model: string, manager?: THREE.LoadingManager): Promise<GLTF> => {
    return modelLoader(model, false, manager);
  },
  loadSimpleDraco: async (
    model: string,
    manager?: THREE.LoadingManager
  ): Promise<THREE.Object3D> => {
    const gltf = await modelLoader(model, true, manager);
    const mesh: THREE.Object3D =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  loadSimple: async (model: string, manager?: THREE.LoadingManager): Promise<THREE.Object3D> => {
    const gltf = await modelLoader(model, false, manager);
    const mesh: THREE.Object3D =
      gltf.scene.children.length === 1 ? gltf.scene.children[0] : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  load: async (model: any, scale: number, pos?: THREE.Vector3): Promise<THREE.Object3D> => {
    console.warn('deprecated, use loadsimple instead');
    const gltf = await modelLoader(model, false);
    const mesh: THREE.Object3D = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    if (pos) {
      mesh.position.copy(pos);
    }
    mesh.castShadow = true;
    return mesh;
  },
};

export default Models;
