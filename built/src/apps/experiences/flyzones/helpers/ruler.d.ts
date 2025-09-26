import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
interface RulerOptions {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    labelRenderer: CSS2DRenderer;
}
export interface Ruler {
    activate: () => void;
    deactivate: () => void;
    isActive: () => boolean;
}
export declare const createRuler: (options: RulerOptions) => Ruler;
export {};
//# sourceMappingURL=ruler.d.ts.map