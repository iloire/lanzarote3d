import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
type Callback = () => void | {};
declare const Navigation: (camera: THREE.PerspectiveCamera, controls: OrbitControls) => {
    dispose: () => void;
    default: (_t?: number, cb?: Callback) => void;
    famara: (_t?: number, cb?: Callback) => void;
    orzola: (_t?: number, cb?: Callback) => void;
    macher: (_t?: number, cb?: Callback) => void;
    tenesar: (_t?: number, cb?: Callback) => void;
};
export default Navigation;
//# sourceMappingURL=navigation.d.ts.map