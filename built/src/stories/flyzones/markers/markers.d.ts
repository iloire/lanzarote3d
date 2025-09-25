import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { MarkerType } from '../helpers/types';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
export declare class MarkerObject extends THREE.Object3D {
    type: MarkerType;
    hoverAnimation: TWEEN.Tween<any>;
    unhoverAnimation: TWEEN.Tween<any>;
    showPopup: () => void;
    setVisibility: (visible: boolean) => void;
    flyzone?: THREE.Object3D;
    pin: THREE.Object3D;
    constructor(pin: THREE.Object3D, type: MarkerType);
}
export interface Marker {
    type: MarkerType;
    position: THREE.Vector3;
    object?: THREE.Object3D | MarkerObject;
    label?: CSS2DObject;
    data?: any;
    pin: THREE.Object3D | MarkerObject;
    setVisibility?: (visible: boolean) => void;
}
//# sourceMappingURL=markers.d.ts.map