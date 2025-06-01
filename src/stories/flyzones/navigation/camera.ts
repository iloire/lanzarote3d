import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Location } from '../locations';
import Camera from '../../../components/camera';

export const navigateTo = (
  position: THREE.Vector3, 
  camera: Camera,
  controls: OrbitControls,
  location: Location
): void => {  
  camera.animateTo(position, location.position, 2000, controls);
}; 