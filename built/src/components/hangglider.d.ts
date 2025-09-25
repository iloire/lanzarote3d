import * as THREE from "three";
import Pilot from "./pilot";
import Wing from "./parts/wing";
import AutoFlier from "./base/auto-flier";
declare class HangGliderModel extends AutoFlier {
    wing: Wing;
    pilot: Pilot;
    load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh>;
    animate(): void;
}
export default HangGliderModel;
//# sourceMappingURL=hangglider.d.ts.map