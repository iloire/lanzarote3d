import * as THREE from "three";
declare class WindIndicator {
    length: number;
    constructor(length: number);
    arrow: THREE.ArrowHelper;
    load(directionDegrees: number, origin: THREE.Vector3): THREE.ArrowHelper;
    update(degrees: number): void;
}
export default WindIndicator;
//# sourceMappingURL=wind-indicator.d.ts.map