import * as THREE from "three";
import AutoFlier from "./base/auto-flier";
declare class Birds extends AutoFlier {
    mixer: any;
    interval: number;
    load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh>;
    animate(): void;
    position(): THREE.Vector3;
}
export default Birds;
//# sourceMappingURL=birds.d.ts.map