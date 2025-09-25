import * as THREE from "three";
import { EditorState, createNewLocation, addTakeoff, addLandingSpot, addFlyZonePhase, saveToLocalStorage, getCurrentLocation } from "./state";

export const setupInteraction = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  scene: THREE.Scene,
  state: EditorState
) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  // Track mouse down position and time to distinguish between clicks and drags
  let mouseDownPosition = new THREE.Vector2();
  let mouseDownTime = 0;
  let isDragging = false;
  
  const onMouseDown = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseDownPosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseDownPosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    mouseDownTime = Date.now();
    isDragging = false;
  };
  
  const onMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Check if we're dragging (moved more than a small threshold)
    if (!isDragging && mouseDownTime > 0) {
      const dx = mouse.x - mouseDownPosition.x;
      const dy = mouse.y - mouseDownPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved more than a small threshold, consider it a drag
      if (distance > 0.01) {
        isDragging = true;
      }
    }
  };
  
  const onMouseUp = (event: MouseEvent) => {
    // Only process as a click if:
    // 1. Not dragging
    // 2. Short duration (less than 300ms)
    const clickDuration = Date.now() - mouseDownTime;
    
    if (!isDragging && clickDuration < 300) {
      onClick(event);
    }
    
    // Reset tracking variables
    mouseDownTime = 0;
    isDragging = false;
  };
  
  const onClick = (event: MouseEvent) => {
    onMouseMove(event);
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Process raycaster intersections
    
    // Find the first terrain intersection
    const terrainIntersect = intersects.find(i => i.object.userData['type'] === 'terrain');
    
    if (terrainIntersect) {
      // Terrain intersection found
      const position = terrainIntersect.point;
      const currentLocation = getCurrentLocation(state);
      
      // Handle click based on current mode
      switch(state.mode) {
        case 'location':
          if (state.currentLocationIndex === null) {
            createNewLocation(state, position, scene);
            // New location created
            saveToLocalStorage(state);
          } else {
            alert("You already have a location selected. To create a new one, deselect the current location first.");
          }
          break;
          
        case 'takeoff':
          if (currentLocation) {
            addTakeoff(state, position, scene);
            // Takeoff added
            saveToLocalStorage(state);
          } else {
            alert("Please create or select a location first.");
          }
          break;
          
        case 'landing':
          if (currentLocation) {
            addLandingSpot(state, position, scene);
            // Landing spot added
            saveToLocalStorage(state);
          } else {
            alert("Please create or select a location first.");
          }
          break;
          
        case 'flyzone':
          if (currentLocation) {
            addFlyZonePhase(state, position, scene);
            // Flyzone phase added
            saveToLocalStorage(state);
          } else {
            alert("Please create or select a location first.");
          }
          break;
      }
    } else {
      // No terrain intersection found
      const currentLocation = getCurrentLocation(state);
      
      // As a fallback, use a point at the camera's target position
      if (event.shiftKey) {
        // Using fallback position (shift+click)
        const fallbackPosition = new THREE.Vector3(0, 0, 0);
        
        switch(state.mode) {
          case 'location':
            if (state.currentLocationIndex === null) {
              createNewLocation(state, fallbackPosition, scene);
              // New location created at fallback position
              saveToLocalStorage(state);
            }
            break;
          case 'takeoff':
            if (currentLocation) {
              addTakeoff(state, fallbackPosition, scene);
              saveToLocalStorage(state);
            }
            break;
          case 'landing':
            if (currentLocation) {
              addLandingSpot(state, fallbackPosition, scene);
              saveToLocalStorage(state);
            }
            break;
          case 'flyzone':
            if (currentLocation) {
              addFlyZonePhase(state, fallbackPosition, scene);
              saveToLocalStorage(state);
            }
            break;
        }
      }
      
      // Check if we clicked on an existing marker
      const markerIntersect = intersects.find(i => 
        i.object.userData['type'] === 'location' || 
        i.object.userData['type'] === 'takeoff' || 
        i.object.userData['type'] === 'landing' ||
        i.object.userData['type'] === 'flyzone'
      );
      
      if (markerIntersect) {
        // Marker selected
      }
    }
  };
  
  // Add event listeners
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  
  // Remove the direct click listener
  // renderer.domElement.addEventListener('click', onClick);
  
  return { raycaster, mouse };
}; 