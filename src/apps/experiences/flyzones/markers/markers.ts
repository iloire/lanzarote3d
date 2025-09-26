import * as THREE from 'three';
import { MarkerType } from '../helpers/types';
import { Tween } from '@tweenjs/tween.js';

// Define the MarkerObject class that properly extends THREE.Object3D
export class MarkerObject extends THREE.Object3D {
  override type: MarkerType;
  hoverAnimation: (() => void) | Tween<any>;
  unhoverAnimation: (() => void) | Tween<any>;
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
    this.hoverAnimation = () => {};
    this.unhoverAnimation = () => {};
    this.showPopup = () => {};
    this.setVisibility = (visible: boolean) => {
      this.visible = visible;
      this.pin.visible = visible;
    };
  }
}

// Re-export Marker interface from types.ts to maintain API compatibility
export type { Marker } from '../helpers/types';

// Add any other marker-related functions here
