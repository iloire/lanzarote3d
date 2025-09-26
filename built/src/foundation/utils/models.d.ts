import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
declare const Models: {
    manager: THREE.LoadingManager;
    loadObj: (model: string, manager?: THREE.LoadingManager) => Promise<THREE.Group>;
    loadGltf: (model: string, manager?: THREE.LoadingManager) => Promise<GLTF>;
    loadSimpleDraco: (model: string, manager?: THREE.LoadingManager) => Promise<THREE.Object3D>;
    loadSimple: (model: string, manager?: THREE.LoadingManager) => Promise<THREE.Object3D>;
    load: (model: any, scale: number, pos?: THREE.Vector3) => Promise<THREE.Object3D>;
};
export default Models;
//# sourceMappingURL=models.d.ts.map