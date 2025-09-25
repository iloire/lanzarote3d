import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Location } from '../locations';

export const navigateTo = (
  position: THREE.Vector3, 
  camera: THREE.Camera,
  controls: OrbitControls,
  location?: Location
): void => {
  // Calculate target position for camera
  const cameraTarget = new THREE.Vector3().copy(position);
  
  // If we have a location with a camera view, use it
  if (location && location.cameraView) {
    const { position: relativePos, distance } = location.cameraView;
    
    // Calculate camera position based on relative position and distance
    const cameraPosition = new THREE.Vector3()
      .copy(cameraTarget)
      .add(new THREE.Vector3(
        relativePos.x * distance,
        relativePos.y * distance,
        relativePos.z * distance
      ));
    
    // Animate camera movement
    new Tween(camera.position)
      .to({
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z
      }, 2000)
      .easing(Easing.Cubic.InOut)
      .start();
    
    // Animate controls target
    new Tween(controls.target)
      .to({
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z
      }, 2000)
      .easing(Easing.Cubic.InOut)
      .start();
  } else {
    // Simple navigation without specific camera view
    new Tween(camera.position)
      .to({
        x: position.x + 1000,
        y: position.y + 1000,
        z: position.z + 1000
      }, 2000)
      .easing(Easing.Cubic.InOut)
      .start();
    
    new Tween(controls.target)
      .to({
        x: position.x,
        y: position.y,
        z: position.z
      }, 2000)
      .easing(Easing.Cubic.InOut)
      .start();
  }
}; 