import * as THREE from 'three';
import PilotVoxel, { PilotVoxelOptions } from '../characters/PilotVoxel';
import Glider, { GliderOptions } from './Glider';
import IFlyable from '../../types/IFlyable';
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
//# sourceMappingURL=ParagliderVoxel.d.ts.map