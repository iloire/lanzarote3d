import * as THREE from 'three';
type HalfWing = {
    wing: THREE.Object3D;
};
declare class HGWing {
    leftWing: HalfWing;
    rightWing: HalfWing;
    load(gui?: any): Promise<THREE.Mesh>;
}
export default HGWing;
//# sourceMappingURL=Wing.d.ts.map