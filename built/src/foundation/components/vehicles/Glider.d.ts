import * as THREE from 'three';
export type GliderOptions = {
    wingColor1?: string;
    wingColor2?: string;
    breakColor?: string;
    inletsColor?: string;
    lineFrontColor?: string;
    lineBackColor?: string;
    numeroCajones?: number;
    carabinersSeparationMM?: number;
    bandLength?: number;
};
type HalfWing = {
    wingBreakSystem: THREE.Object3D;
    wing: THREE.Object3D;
};
declare class Glider {
    leftWing: HalfWing;
    rightWing: HalfWing;
    fullWing: THREE.Mesh;
    options: GliderOptions;
    constructor(options: GliderOptions);
    breakLeft(): void;
    breakRight(): void;
    handsUp(): void;
    createWing(): THREE.Mesh;
    load(gui?: any): Promise<THREE.Mesh>;
}
export default Glider;
//# sourceMappingURL=Glider.d.ts.map