import * as THREE from "three";
import { TandemPilotOptions } from "./tandem-pilot";
import { GliderOptions } from "./parts/glider";
export type TandemOptions = {
    glider: GliderOptions;
    pilot: TandemPilotOptions;
};
declare class Tandem {
    options: TandemOptions;
    constructor(options: TandemOptions);
    load(gui?: any): Promise<THREE.Object3D>;
}
export default Tandem;
//# sourceMappingURL=tandem.d.ts.map