import * as THREE from 'three';

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
    
    // If we hit something, coordinates are available for future use
    if (intersects.length > 0 && intersects[0]) {
      // Click detected - coordinates available in intersects[0].point
      // GPS coordinates can be calculated with: worldToGPS(intersects[0].point)
    }
  };

  // Add click event listener
  renderer.domElement.addEventListener('click', onMouseClick);

  // Return cleanup function
  return () => {
    renderer.domElement.removeEventListener('click', onMouseClick);
  };
}; 