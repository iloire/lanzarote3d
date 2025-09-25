import * as THREE from "three";
import { PilotHeadOptions } from "../pilot-head";
export declare abstract class BaseHead {
    protected options: PilotHeadOptions;
    constructor(options: PilotHeadOptions);
    protected getColoredMaterial(color: string): THREE.MeshStandardMaterial;
    protected getHelmet(): THREE.Group;
    abstract load(): THREE.Group;
}
//# sourceMappingURL=BaseHead.d.ts.map