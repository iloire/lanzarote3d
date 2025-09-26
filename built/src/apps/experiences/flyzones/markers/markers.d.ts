import * as THREE from 'three';
import { MarkerType } from '../helpers/types';
export declare class MarkerObject extends THREE.Object3D {
    type: MarkerType;
    hoverAnimation: (() => void) | any;
    unhoverAnimation: (() => void) | any;
    showPopup: () => void;
    setVisibility: (visible: boolean) => void;
    flyzone?: THREE.Object3D;
    pin: THREE.Object3D;
    constructor(pin: THREE.Object3D, type: MarkerType);
}
export type { Marker } from '../helpers/types';
//# sourceMappingURL=markers.d.ts.map