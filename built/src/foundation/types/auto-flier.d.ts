import * as THREE from 'three';
export interface AutoFlierOptions {
    speed?: number;
    arrivalThreshold?: number;
    smoothRotation?: boolean;
    rotationSpeed?: number;
    forwardAxis?: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
}
declare class AutoFlier {
    currentPointIndex: number;
    path: THREE.Vector3[];
    mesh: THREE.Mesh;
    private speed;
    private arrivalThreshold;
    private smoothRotation;
    private rotationSpeed;
    private forwardAxis;
    private targetQuaternion;
    constructor(options?: AutoFlierOptions);
    position(): THREE.Vector3;
    updateWrapSpeed(multiplier: number): void;
    updateSpeed(speed: number): void;
    updateArrivalThreshold(threshold: number): void;
    getForwardAxis(): 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
    private orientTowardsTarget;
    move(): void;
    getNextTarget(): THREE.Vector3 | null;
    getPathProgress(): number;
    resetPath(): void;
    updatePath(newPath: THREE.Vector3[]): void;
}
export default AutoFlier;
//# sourceMappingURL=auto-flier.d.ts.map