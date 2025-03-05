import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

export enum MarkerType {
  LOCATION = 'location',
  TAKEOFF = 'takeoff',
  LANDING = 'landing'
}

export interface Marker {
  pin: THREE.Object3D;
  type: MarkerType;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  setVisibility: (visible: boolean) => void;
  flyzone?: THREE.Object3D;
} 