import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Marker } from '../helpers/index';
import { VISIBILITY_THRESHOLDS } from '../config/marker-config';
import { MarkerType } from '../helpers/index';

export const setupAnimationLoop = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  controls: OrbitControls,
  labelRenderer: CSS2DRenderer,
  markers: Marker[],
  landingMarkersVisible: boolean
): void => {
  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
    
    // Update label renderer
    labelRenderer.render(scene, camera);
    
    // Update marker visibility based on camera distance
    markers.forEach(marker => {
      if (!marker.position) return;
      
      // Calculate distance to camera
      const distance = camera.position.distanceTo(marker.position);
      
      // Determine visibility based on marker type and distance
      let visible = false;
      
      if (marker.type === MarkerType.LOCATION) {
        // Location markers are visible when far away
        visible = distance > VISIBILITY_THRESHOLDS.LOCATION_PIN;
      } else if (marker.type === MarkerType.TAKEOFF) {
        // Takeoff markers are visible when close
        visible = distance < VISIBILITY_THRESHOLDS.TAKEOFF;
      } else if (marker.type === MarkerType.LANDING) {
        // Landing markers are visible when close and landing markers are enabled
        visible = distance < VISIBILITY_THRESHOLDS.LANDING && landingMarkersVisible;
      }
      
      // Update visibility
      if (marker.setVisibility) {
        marker.setVisibility(visible);
      } else {
        // Fallback if setVisibility is not defined
        if (marker.object) marker.object.visible = visible;
        if (marker.label) marker.label.visible = visible;
        if (marker.pin) {
          if ('visible' in marker.pin) {
            marker.pin.visible = visible;
          }
        }
      }
    });
  };

  // Start animation loop
  animate();
}; 