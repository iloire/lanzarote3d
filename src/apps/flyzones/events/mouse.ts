import * as THREE from 'three';
import { worldToGPS } from '../helpers/gps';

export const setupMouseClickHandler = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  scene: THREE.Scene
): (() => void) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseClick = (event: MouseEvent) => {
    // Skip if ruler is active
    if (document.getElementById('ruler-toggle-btn')?.classList.contains('active')) {
      return;
    }
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Find intersections with the terrain
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // If we hit something, log the coordinates
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gpsCoords = worldToGPS(point);
      
      console.log('Click detected:');
      console.log('3D World Coordinates:', {
        x: point.x.toFixed(2),
        y: point.y.toFixed(2),
        z: point.z.toFixed(2)
      });
      console.log('GPS Coordinates:', {
        latitude: gpsCoords.latitude.toFixed(6),
        longitude: gpsCoords.longitude.toFixed(6),
        altitude: gpsCoords.altitude.toFixed(1)
      });
    }
  };

  // Add click event listener
  renderer.domElement.addEventListener('click', onMouseClick);

  // Return cleanup function
  return () => {
    renderer.domElement.removeEventListener('click', onMouseClick);
  };
}; 