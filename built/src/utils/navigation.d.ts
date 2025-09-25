import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
type Callback = () => void | {};
declare const Navigation: (camera: THREE.PerspectiveCamera, controls: OrbitControls) => {
    default: (t?: number, cb?: Callback) => void;
    famara: (t?: number, cb?: Callback) => void;
    orzola: (t?: number, cb?: Callback) => void;
    macher: (t?: number, cb?: Callback) => void;
    tenesar: (t?: number, cb?: Callback) => void;
};
export default Navigation;
//# sourceMappingURL=navigation.d.ts.map