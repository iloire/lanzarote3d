import * as THREE from "three";
import { PilotOptions } from './pilot';
export type TandemPilotOptions = {
    pilot: PilotOptions;
    passenger: PilotOptions;
};
declare class TandemPilot {
    options: TandemPilotOptions;
    constructor(options: TandemPilotOptions);
    getBody(options: PilotOptions, armRotation: number): THREE.Group;
    load(): THREE.Object3D;
}
export default TandemPilot;
//# sourceMappingURL=tandem-pilot.d.ts.map