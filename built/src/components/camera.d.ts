import * as THREE from "three";
import Paraglider from "../components/base/flier";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
export declare enum CameraMode {
    FirstPersonView = 1,
    FollowTarget = 2
}
declare class Camera extends THREE.PerspectiveCamera {
    mode: CameraMode;
    target: Paraglider;
    terrain: THREE.Mesh;
    angle: number;
    angleY: number;
    distance: number;
    angleIncrement: number;
    distanceIncrement: number;
    firstPersonViewOffset: THREE.Vector3;
    directionToLook: THREE.Vector3;
    viewRotationHorizontal: number;
    viewRotationVertical: number;
    floatStartTime: number;
    baseY: number;
    constructor(fov: number, aspect: number, near: number, far: number, renderer: THREE.WebGLRenderer, terrain: THREE.Mesh);
    addGui(gui: any): void;
    update(): void;
    setCameraMode(mode: CameraMode, target: Paraglider): void;
    turnLeft(): void;
    turnRight(): void;
    lookUp(): void;
    lookDown(): void;
    zoomIn(): void;
    zoomOut(): void;
    lookDirection(xDegrees: number, yDegrees: number): void;
    animateTo(newPosition: THREE.Vector3, newTarget: THREE.Vector3, duration: number, controls: OrbitControls, cb?: any): void;
    followTarget(): void;
    firstPersonView(): void;
}
export default Camera;
//# sourceMappingURL=camera.d.ts.map