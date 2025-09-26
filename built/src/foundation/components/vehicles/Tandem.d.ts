import * as THREE from 'three';
import { TandemPilotOptions } from '../characters/TandemPilot';
import { GliderOptions } from './Glider';
export type TandemOptions = {
    glider: GliderOptions;
    pilot: TandemPilotOptions;
};
declare class Tandem {
    options: TandemOptions;
    constructor(options: TandemOptions);
    load(): Promise<THREE.Object3D>;
}
export default Tandem;
//# sourceMappingURL=Tandem.d.ts.map