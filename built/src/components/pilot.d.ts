import * as THREE from "three";
import { PilotHeadOptions } from './parts/pilot-head';
export type PilotOptions = {
    head?: PilotHeadOptions;
    skinColor?: string;
    suitColor?: string;
    suitColor2?: string;
    shoesColor?: string;
    carabinerColor?: string;
};
declare class Pilot {
    armRight: THREE.Mesh;
    armLeft: THREE.Mesh;
    body: THREE.Mesh;
    head: THREE.Group;
    options: PilotOptions;
    constructor(options: PilotOptions);
    showHead(): void;
    hideHead(): void;
    getBody(): THREE.Group;
    load(): THREE.Object3D;
    speedBar(): void;
    releaseSpeedBar(): void;
    breakLeft(): void;
    breakLeftRelease(): void;
    breakRight(): void;
    breakRightRelease(): void;
}
export default Pilot;
//# sourceMappingURL=pilot.d.ts.map