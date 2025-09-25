import * as THREE from "three";
export declare enum TrajectoryPointType {
    Normal = 0,
    TouchGround = 1,
    SpeedBar = 2,
    Ears = 3
}
export type TrajectoryPoint = {
    vector: THREE.Vector3;
    type: TrajectoryPointType;
};
declare class Trajectory {
    points: TrajectoryPoint[];
    mesh: THREE.Object3D;
    createDot(radius: number, point: TrajectoryPoint): THREE.Object3D;
    constructor(points: TrajectoryPoint[], dotRadius: number);
    getPoints(): TrajectoryPoint[];
    getMesh(): THREE.Object3D;
}
export default Trajectory;
//# sourceMappingURL=trajectory.d.ts.map