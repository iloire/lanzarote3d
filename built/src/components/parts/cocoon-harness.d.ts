import * as THREE from "three";
export type CocoonHarnessOptions = {
    color1: string;
    color2: string;
    carabinerColor: string;
    carabinerSeparationMM: number;
    width?: number;
    height?: number;
    depth?: number;
};
declare class CocoonHarness {
    options: CocoonHarnessOptions;
    constructor(options: CocoonHarnessOptions);
    load(): THREE.Object3D;
}
export default CocoonHarness;
//# sourceMappingURL=cocoon-harness.d.ts.map