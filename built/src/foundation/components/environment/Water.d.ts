import * as THREE from 'three';
import { Water as WaterEffect } from 'three/examples/jsm/objects/Water';
export type WaterOptions = {
    size: number;
};
export default class Water {
    options: WaterOptions;
    private waterMesh;
    constructor(options: WaterOptions);
    load(sunPosition: THREE.Vector3): THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>;
    dispose(): void;
    /**
     * Apply water theme settings to the water mesh
     */
    applyTheme(waterTheme: any): void;
    /**
     * Get current water mesh for external theme application
     */
    getMesh(): THREE.Mesh | WaterEffect | null;
}
//# sourceMappingURL=Water.d.ts.map