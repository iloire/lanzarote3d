import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Media, Location } from '../locations';
import * as THREE from 'three';
export declare const createLabel: (title: string) => CSS2DObject;
export declare const createPopupContent: (title: string, description: string, mediaItems: Media[]) => string;
export declare const createPopupHandler: (params: {
    type: string;
    title: string;
    description: string;
    mediaItems: Media[];
    position: THREE.Vector3;
    location: Location | undefined;
    popupContainer: HTMLDivElement;
    navigateTo: (position: THREE.Vector3, location?: Location) => void;
}) => () => void;
export declare const showDetailPopup: (title: string, description: string, mediaItems: Media[], popupContainer: HTMLDivElement) => void;
export declare const setupPopupContainer: () => HTMLDivElement;
//# sourceMappingURL=popup.d.ts.map