import * as THREE from "three";
declare class AutoFlier {
    currentPointIndex: number;
    path: THREE.Vector3[];
    mesh: THREE.Mesh;
    wrapMultiplier: number;
    position(): THREE.Vector3;
    updateWrapSpeed(multiplier: number): void;
    move(): void;
}
export default AutoFlier;
//# sourceMappingURL=auto-flier.d.ts.map