import * as THREE from "three";
declare const Helpers: {
    drawSphericalPosition: (phiDegrees: number, thetaDegrees: number, len: number, scene: THREE.Scene) => void;
    drawPoint(scene: THREE.Scene, position: THREE.Vector3): void;
    createHelpers: (scene: THREE.Scene) => void;
    getAxisHelper: (len: number) => THREE.AxesHelper;
    getGrid: (pos: THREE.Vector3) => THREE.Object3D<THREE.Event>;
};
export default Helpers;
//# sourceMappingURL=helpers.d.ts.map