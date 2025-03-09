import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Marker } from '../helpers/index';
import { VISIBILITY_THRESHOLDS } from '../config/marker-config';

export const setupAnimationLoop = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  controls: OrbitControls,
  labelRenderer: CSS2DRenderer,
  markers: Marker[]
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
      
      const distance = camera.position.distanceTo(marker.position);
      
      // Use the appropriate visibility threshold based on marker type
      let visible = false;
      if (marker.type) {
        visible = distance < VISIBILITY_THRESHOLDS.DETAIL_VIEW;
      }
      
      if (marker.object) {
        marker.object.visible = visible;
      }
      
      if (marker.label) {
        marker.label.visible = visible;
      }
    });
  };

  // Start animation loop
  animate();
}; 