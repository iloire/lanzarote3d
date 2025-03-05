import * as THREE from "three";
import { EditorState, createNewLocation, addTakeoff, addLandingSpot, addFlyZonePhase, saveToLocalStorage } from "./state";

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
    
    console.log("Click detected, intersects:", intersects.length);
    
    // Log all intersected objects for debugging
    intersects.forEach((intersect, index) => {
      console.log(`Intersect ${index}:`, intersect.object.type, intersect.object.userData);
    });
    
    // Find the first terrain intersection
    const terrainIntersect = intersects.find(i => i.object.userData.type === 'terrain');
    
    if (terrainIntersect) {
      console.log("Terrain intersection found at:", terrainIntersect.point);
      const position = terrainIntersect.point;
      
      // Handle click based on current mode
      switch(state.mode) {
        case 'location':
          if (!state.currentLocation) {
            createNewLocation(state, position, scene);
            console.log("Created new location at", position);
            saveToLocalStorage(state);
          } else {
            alert("You already have a location. Only one location can be edited at a time.");
          }
          break;
          
        case 'takeoff':
          if (state.currentLocation) {
            addTakeoff(state, position, scene);
            console.log("Added takeoff at", position);
            saveToLocalStorage(state);
          } else {
            alert("Please create a location first.");
          }
          break;
          
        case 'landing':
          if (state.currentLocation) {
            addLandingSpot(state, position, scene);
            console.log("Added landing spot at", position);
            saveToLocalStorage(state);
          } else {
            alert("Please create a location first.");
          }
          break;
          
        case 'flyzone':
          if (state.currentLocation) {
            addFlyZonePhase(state, position, scene);
            console.log(`Added ${state.flyZonePhaseType} flyzone phase at`, position);
            saveToLocalStorage(state);
          } else {
            alert("Please create a location first.");
          }
          break;
      }
    } else {
      console.log("No terrain intersection found");
      
      // As a fallback, use a point at the camera's target position
      if (event.shiftKey) {
        console.log("Using fallback position (shift+click)");
        const fallbackPosition = new THREE.Vector3(0, 0, 0);
        
        switch(state.mode) {
          case 'location':
            if (!state.currentLocation) {
              createNewLocation(state, fallbackPosition, scene);
              console.log("Created new location at fallback position");
              saveToLocalStorage(state);
            }
            break;
          case 'takeoff':
            if (state.currentLocation) {
              addTakeoff(state, fallbackPosition, scene);
            }
            break;
          case 'landing':
            if (state.currentLocation) {
              addLandingSpot(state, fallbackPosition, scene);
            }
            break;
          case 'flyzone':
            if (state.currentLocation) {
              addFlyZonePhase(state, fallbackPosition, scene);
            }
            break;
        }
      }
      
      // Check if we clicked on an existing marker
      const markerIntersect = intersects.find(i => 
        i.object.userData.type === 'location' || 
        i.object.userData.type === 'takeoff' || 
        i.object.userData.type === 'landing' ||
        i.object.userData.type === 'flyzone'
      );
      
      if (markerIntersect) {
        console.log("Selected marker:", markerIntersect.object.userData);
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