import * as THREE from 'three';
import { Pilot } from './';
import Wing from './Wing';
import AutoFlier from '../../types/auto-flier';
declare class HangGliderModel extends AutoFlier {
    wing: Wing;
    pilot: Pilot;
    load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh>;
    private animationId;
    private isAnimating;
    animate(): void;
    private startAnimation;
    stop(): void;
    dispose(): void;
}
export default HangGliderModel;
//# sourceMappingURL=Hangglider.d.ts.map