import * as THREE from "three";
export type MeshAroundAreaParam = THREE.Object3D | (() => THREE.Object3D);
export declare const addMeshAroundArea: (meshTypes: MeshAroundAreaParam[], centerPosition: THREE.Vector3, numberItemsToAdd: number, terrain: THREE.Mesh, scene: THREE.Scene, minDistance?: number, y?: number) => void;
//# sourceMappingURL=mesh-utils.d.ts.map