import * as THREE from 'three';
import { HelmetOptions } from './types';
export declare abstract class BaseHelmet {
    protected options: HelmetOptions;
    constructor(options: HelmetOptions);
    protected getColoredMaterial(color: string): THREE.Material;
    abstract load(): THREE.Group;
}
//# sourceMappingURL=BaseHelmet.d.ts.map