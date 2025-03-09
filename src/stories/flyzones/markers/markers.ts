import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { MarkerType } from '../helpers/types';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

// Define the MarkerObject class that properly extends THREE.Object3D
export class MarkerObject extends THREE.Object3D {
  type: MarkerType;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  setVisibility: (visible: boolean) => void;
  flyzone?: THREE.Object3D;
  pin: THREE.Object3D;
  
  constructor(pin: THREE.Object3D, type: MarkerType) {
    super();
    this.type = type;
    this.pin = pin;
    this.add(pin);
    
    // Initialize with empty functions, to be set by the creator
    this.hoverAnimation = new TWEEN.Tween({}).to({}, 0);
    this.unhoverAnimation = new TWEEN.Tween({}).to({}, 0);
    this.showPopup = () => {};
    this.setVisibility = (visible: boolean) => {
      this.visible = visible;
      this.pin.visible = visible;
    };
  }
}

// Define the Marker interface for use in the application
export interface Marker {
  type: MarkerType;
  position: THREE.Vector3;
  object?: THREE.Object3D | MarkerObject;
  label?: CSS2DObject;
  data?: any;
  pin: THREE.Object3D | MarkerObject;
  setVisibility?: (visible: boolean) => void;
}

// Add any other marker-related functions here 