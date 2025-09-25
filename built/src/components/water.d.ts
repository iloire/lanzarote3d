import * as THREE from "three";
import { Water as WaterEffect } from "three/examples/jsm/objects/Water";
export type WaterOptions = {
    size: number;
};
export default class Water {
    options: WaterOptions;
    constructor(options: WaterOptions);
    load(sunPosition: THREE.Vector3): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial, THREE.Object3DEventMap> | WaterEffect;
}
//# sourceMappingURL=water.d.ts.map