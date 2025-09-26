import * as THREE from 'three';
import Pilot, { PilotOptions } from './Pilot';
import Glider, { GliderOptions } from './Glider';
import IFlyable from '../../types/IFlyable';
export type ParagliderOptions = {
    glider: GliderOptions;
    pilot: PilotOptions;
};
declare class Paraglider implements IFlyable {
    mesh: THREE.Object3D;
    glider: Glider;
    pilot: Pilot;
    pilotMesh: THREE.Object3D;
    axesHelper: THREE.AxesHelper;
    options: ParagliderOptions;
    constructor(options: ParagliderOptions);
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
export default Paraglider;
//# sourceMappingURL=Paraglider.d.ts.map