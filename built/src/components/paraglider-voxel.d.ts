import * as THREE from "three";
import PilotVoxel, { PilotVoxelOptions } from "./pilot-voxel";
import Glider, { GliderOptions } from "./parts/glider";
import IFlyable from './base/IFlyable';
export type ParagliderVoxelOptions = {
    glider: GliderOptions;
    pilot: PilotVoxelOptions;
};
declare class ParagliderVoxel implements IFlyable {
    mesh: THREE.Object3D;
    glider: Glider;
    pilot: PilotVoxel;
    pilotMesh: THREE.Object3D;
    axesHelper: THREE.AxesHelper;
    options: ParagliderVoxelOptions;
    constructor(options: ParagliderVoxelOptions);
    showAxesHelper(): void;
    toggleAxesHelper(): void;
    left(): void;
    leftRelease(): void;
    right(): void;
    rightRelease(): void;
    speedBar(): void;
    releaseSpeedBar(): void;
    getMesh(): THREE.Object3D<THREE.Object3DEventMap>;
    load(gui?: any): Promise<THREE.Object3D>;
}
export default ParagliderVoxel;
//# sourceMappingURL=paraglider-voxel.d.ts.map