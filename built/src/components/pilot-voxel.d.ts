import * as THREE from "three";
export type PilotVoxelOptions = {
    objFile: string;
    textureFile: string;
};
declare class PilotVoxel {
    options: PilotVoxelOptions;
    constructor(options: PilotVoxelOptions);
    load(): Promise<THREE.Object3D>;
}
export default PilotVoxel;
//# sourceMappingURL=pilot-voxel.d.ts.map