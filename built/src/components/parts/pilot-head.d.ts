import * as THREE from "three";
import { HelmetType, HelmetOptions } from "./helmets/types";
export declare enum PilotHeadType {
    Default = 0,
    Warrior = 1,
    Skeleton = 2,
    Devil = 3
}
export declare enum GlassesType {
    Default = 0,
    SunGlasses1 = 1
}
export interface PilotHeadOptions {
    headType: PilotHeadType;
    helmetType?: HelmetType;
    helmetOptions?: HelmetOptions;
    glassesType?: GlassesType;
    skinColor?: string;
    beardColor?: string;
    eyeColor?: string;
    glassesColor?: string;
}
declare class PilotHead {
    private options;
    constructor(options: PilotHeadOptions);
    load(): THREE.Group;
}
export default PilotHead;
//# sourceMappingURL=pilot-head.d.ts.map