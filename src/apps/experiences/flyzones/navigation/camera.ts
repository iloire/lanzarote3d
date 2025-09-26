import * as THREE from 'three';
import { animator } from '../../../../foundation/systems/animation/SimpleAnimator';
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
  if (location && location.cameraView && location.cameraView.distance !== undefined) {
    const { position: relativePos, distance } = location.cameraView;

    // Calculate camera position based on relative position and distance
    const cameraPosition = new THREE.Vector3()
      .copy(cameraTarget)
      .add(new THREE.Vector3(
        relativePos.x * distance,
        relativePos.y * distance,
        relativePos.z * distance
      ));
    
    // Animate camera movement with SimpleAnimator
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    // Disable controls during animation
    controls.enabled = false;

    animator.animate('flyzones-navigate', 2000, (progress) => {
      // Animate camera position
      camera.position.lerpVectors(startPosition, cameraPosition, progress);
      // Animate target
      controls.target.lerpVectors(startTarget, cameraTarget, progress);
      controls.update();
    }, () => {
      // Re-enable controls after animation completes
      controls.enabled = true;
    });
  } else {
    // Simple navigation without specific camera view
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const defaultCameraPosition = new THREE.Vector3(position.x + 1000, position.y + 1000, position.z + 1000);

    // Disable controls during animation
    controls.enabled = false;

    animator.animate('flyzones-navigate-simple', 2000, (progress) => {
      // Animate camera position
      camera.position.lerpVectors(startPosition, defaultCameraPosition, progress);
      // Animate target
      controls.target.lerpVectors(startTarget, position, progress);
      controls.update();
    }, () => {
      // Re-enable controls after animation completes
      controls.enabled = true;
    });
  }
}; 