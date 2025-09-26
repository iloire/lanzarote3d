import * as THREE from 'three';
import AutoFlier, { AutoFlierOptions } from '../../types/auto-flier';
export interface BirdsOptions extends AutoFlierOptions {
    scale?: number;
    animationSpeed?: number;
}
declare class Birds extends AutoFlier {
    mixer: THREE.AnimationMixer | null;
    interval: number;
    private scale;
    private animationSpeed;
    constructor(options?: BirdsOptions);
    load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh>;
    private animationId;
    private isAnimating;
    animate(): void;
    private startAnimation;
    stop(): void;
    dispose(): void;
    position(): THREE.Vector3;
}
export default Birds;
//# sourceMappingURL=Birds.d.ts.map