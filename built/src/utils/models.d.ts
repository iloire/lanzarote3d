import * as THREE from "three";
declare const Models: {
    manager: THREE.LoadingManager;
    loadObj: (model: string, manager?: THREE.LoadingManager) => Promise<any>;
    loadGltf: (model: string, manager?: THREE.LoadingManager) => Promise<unknown>;
    loadSimpleDraco: (model: string, manager?: THREE.LoadingManager) => Promise<any>;
    loadSimple: (model: string, manager?: THREE.LoadingManager) => Promise<any>;
    load: (model: THREE.Mesh, scale: number, pos?: THREE.Vector3) => Promise<any>;
};
export default Models;
//# sourceMappingURL=models.d.ts.map