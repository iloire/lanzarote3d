import * as THREE from 'three';
import { MarkerType } from '../helpers/types';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Location, Media } from '../locations';
export declare const setupLabelRenderer: () => CSS2DRenderer;
export declare class MarkerObject {
    pin: THREE.Object3D;
    type: MarkerType;
    hoverAnimation: (() => void) | any;
    unhoverAnimation: (() => void) | any;
    showPopup: () => void;
    setVisibility: (visible: boolean) => void;
    flyzone?: THREE.Object3D;
    constructor(pin: THREE.Object3D, type: MarkerType);
    get userData(): Record<string, any>;
    get visible(): boolean;
    set visible(value: boolean);
    traverse(callback: (object: THREE.Object3D) => void): void;
}
export declare const createMarker: (position: THREE.Vector3, title: string, description: string, mediaItems: Media[], type: MarkerType, scene: THREE.Scene, popupContainer: HTMLDivElement, _navigateTo: (position: THREE.Vector3, location?: Location) => void, _location: Location | undefined, camera: THREE.Camera, conditions?: any[]) => Promise<MarkerObject>;
export declare const createPinMesh: (type: MarkerType) => Promise<THREE.Group<THREE.Object3DEventMap>>;
export declare const setupPinBasics: (pin: THREE.Object3D, position: THREE.Vector3, type: MarkerType) => void;
export declare const createHoverAnimations: (pin: THREE.Object3D, isTakeoff: boolean) => {
    hover: {
        start: () => void;
    };
    unhover: {
        start: () => void;
    };
};
export declare const createFadeAnimation: (pin: THREE.Object3D) => {
    fadeIn: {
        start: () => void;
    };
    fadeOut: {
        start: () => void;
    };
};
export declare const createVisibilityHandler: (params: {
    pin: THREE.Object3D;
    label: CSS2DObject;
    type: MarkerType;
    position: THREE.Vector3;
    camera: THREE.Camera;
    fadeAnimation: ReturnType<typeof createFadeAnimation>;
}) => (visible: boolean) => void;
export declare const createSimpleMarker: (position: THREE.Vector3, type: MarkerType) => Promise<MarkerObject>;
//# sourceMappingURL=marker.d.ts.map