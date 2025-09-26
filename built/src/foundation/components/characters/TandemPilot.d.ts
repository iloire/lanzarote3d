import * as THREE from 'three';
import { PilotOptions } from '../vehicles/Pilot';
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
//# sourceMappingURL=TandemPilot.d.ts.map