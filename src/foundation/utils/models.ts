import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { decodedSize } from './decodedSize';

const defaultManager = new THREE.LoadingManager();

export type DownloadProgress = { loaded: number; total: number };
type ProgressListener = (progress: DownloadProgress) => void;

// Bytes received per model URL; total is 0 when the size is unknown.
const downloads = new Map<string, DownloadProgress>();
const progressListeners = new Set<ProgressListener>();

function setProgress(url: string, progress: DownloadProgress) {
  downloads.set(url, progress);
  const sum = { loaded: 0, total: 0 };
  downloads.forEach(d => {
    sum.loaded += d.loaded;
    sum.total += d.total;
  });
  progressListeners.forEach(listener => listener(sum));
}

function trackProgress(url: string) {
  return (event: ProgressEvent) =>
    setProgress(url, { loaded: event.loaded, total: event.lengthComputable ? event.total : 0 });
}

/** Fetch a model, reporting progress, as an item of the manager (like three's own loaders). */
async function download<T>(
  url: string,
  manager: THREE.LoadingManager,
  parse: (data: ArrayBuffer) => T | Promise<T>
): Promise<T> {
  const resolved = manager.resolveURL(url);
  manager.itemStart(resolved);
  try {
    const response = await fetch(resolved);
    if (!response.ok || !response.body) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    const total = decodedSize(response.headers);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      setProgress(url, { loaded, total });
    }
    const data = new Uint8Array(loaded);
    let offset = 0;
    chunks.forEach(chunk => {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    });
    return await parse(data.buffer);
  } catch (error) {
    manager.itemError(resolved);
    throw error;
  } finally {
    manager.itemEnd(resolved);
  }
}

function modelLoader(url: string, draco: boolean, manager?: THREE.LoadingManager): Promise<GLTF> {
  const man = manager || defaultManager;
  // Meshopt-packed GLBs (3d/meshopt-glb.mjs) decode in place; others load as before
  const loader = draco
    ? new DRACOLoader(man)
    : new GLTFLoader(man).setMeshoptDecoder(MeshoptDecoder);
  if (draco) {
    // loader.setDecoderPath("/examples/jsm/libs/draco/");
    // loader.preload();
  }
  if (draco) {
    return new Promise<GLTF>((resolve, reject) => {
      loader.load(url, data => resolve(data as GLTF), trackProgress(url), reject);
    });
  }
  const gltfLoader = loader as GLTFLoader;
  return download(url, man, data =>
    gltfLoader.parseAsync(data, THREE.LoaderUtils.extractUrlBase(url))
  );
}

function objLoader(url: string, manager?: THREE.LoadingManager): Promise<THREE.Group> {
  const man = manager || defaultManager;
  const loader = new OBJLoader(man);
  return download(url, man, data => loader.parse(new TextDecoder().decode(data)));
}

const Models = {
  manager: defaultManager,
  /** Listen to the summed download progress of every model; returns an unsubscribe. */
  onProgress: (listener: ProgressListener): (() => void) => {
    progressListeners.add(listener);
    return () => progressListeners.delete(listener);
  },
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
      gltf.scene.children.length === 1 ? gltf.scene.children[0]! : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  loadSimple: async (model: string, manager?: THREE.LoadingManager): Promise<THREE.Object3D> => {
    const gltf = await modelLoader(model, false, manager);
    const mesh: THREE.Object3D =
      gltf.scene.children.length === 1 ? gltf.scene.children[0]! : gltf.scene;
    mesh.castShadow = true;
    return mesh;
  },
  load: async (model: string, scale: number, pos?: THREE.Vector3): Promise<THREE.Object3D> => {
    console.warn('deprecated, use loadsimple instead');
    const gltf = await modelLoader(model, false);
    const mesh: THREE.Object3D = gltf.scene.children[0]!;
    mesh.scale.set(scale, scale, scale);
    if (pos) {
      mesh.position.copy(pos);
    }
    mesh.castShadow = true;
    return mesh;
  },
};

export default Models;
