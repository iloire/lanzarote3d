import { CloudOptions } from './Cloud';
import * as THREE from 'three';
declare class Clouds {
    options: CloudOptions;
    constructor(options: CloudOptions);
    load(scale: number, pos: THREE.Vector3): Promise<THREE.Object3D>;
}
export default Clouds;
//# sourceMappingURL=Clouds.d.ts.map