import * as THREE from 'three';
import { MarkerType } from '../helpers/types';
import { Tween } from '@tweenjs/tween.js';

// Define the MarkerObject class that properly extends THREE.Object3D
export class MarkerObject extends THREE.Object3D {
  type: MarkerType;
  hoverAnimation: Tween<any>;
  unhoverAnimation: Tween<any>;
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
    this.hoverAnimation = new Tween({}).to({}, 0);
    this.unhoverAnimation = new Tween({}).to({}, 0);
    this.showPopup = () => {};
    this.setVisibility = (visible: boolean) => {
      this.visible = visible;
      this.pin.visible = visible;
    };
  }
}

// Marker interface is now defined in ../helpers/types.ts to avoid circular dependencies

// Add any other marker-related functions here 