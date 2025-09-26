import * as THREE from 'three';
export type CloudOptions = {
    colors?: string[];
};
declare class Cloud {
    options: CloudOptions;
    private interval;
    private animationId;
    private isAnimating;
    private mesh;
    constructor(options: CloudOptions);
    load(): Promise<THREE.Object3D>;
    animate(): void;
    private startAnimation;
    stop(): void;
    dispose(): void;
}
export default Cloud;
//# sourceMappingURL=Cloud.d.ts.map