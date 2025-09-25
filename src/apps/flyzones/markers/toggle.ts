import * as THREE from 'three';

export const toggleLandingMarkers = (
  landingMarkers: THREE.Object3D[],
  visible: boolean,
  setLandingMarkersVisible: (visible: boolean) => void
): void => {
  landingMarkers.forEach(marker => {
    marker.visible = visible;
    
    // Also update the clickable property to prevent invisible markers from being clickable
    marker.userData.clickable = visible;
    
    // Update all children as well
    marker.traverse(child => {
      if (child !== marker) {
        child.visible = visible;
        child.userData.clickable = visible;
      }
    });
  });
  
  setLandingMarkersVisible(visible);
}; 