import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { MarkerType } from '../helpers/types';

// Define the MarkerObject type that extends THREE.Object3D
export interface MarkerObject extends THREE.Object3D {
  // Add any additional properties specific to MarkerObject
  userData: {
    isMarker?: boolean;
    markerType?: MarkerType;
    [key: string]: any;
  };
}

export interface Marker {
  type: MarkerType;
  position: THREE.Vector3;
  object?: THREE.Object3D;
  label?: CSS2DObject;
  data?: any;
  pin: THREE.Object3D | MarkerObject;
}

// Add any other marker-related functions here 