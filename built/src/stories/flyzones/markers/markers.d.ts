import * as THREE from 'three';
import { MarkerType } from '../helpers/types';
import { Tween } from '@tweenjs/tween.js';
export declare class MarkerObject extends THREE.Object3D {
    type: MarkerType;
    hoverAnimation: Tween<any>;
    unhoverAnimation: Tween<any>;
    showPopup: () => void;
    setVisibility: (visible: boolean) => void;
    flyzone?: THREE.Object3D;
    pin: THREE.Object3D;
    constructor(pin: THREE.Object3D, type: MarkerType);
}
//# sourceMappingURL=markers.d.ts.map