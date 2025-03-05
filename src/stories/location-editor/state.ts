import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Location, Takeoff, LandingSpot, FlightPhase, FlyZoneShape } from "../flyzones/locations";

export interface EditorState {
  locations: EditorLocation[];
  currentLocationIndex: number | null;
  selectedItem: any | null;
  mode: "location" | "takeoff" | "landing" | "flyzone";
  flyZonePhaseType: "takeoff" | "ridge" | "approach" | "landing";
  markers: THREE.Object3D[];
  flyZones: THREE.Object3D[];
  history: EditorAction[];
}

export interface EditorLocation {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  cameraView: {
    position: THREE.Vector3;
    distance: number;
  };
  takeoffs: EditorTakeoff[];
  landingSpots: EditorLandingSpot[];
  flyzone: EditorFlyZone;
}

export interface EditorTakeoff {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  elevation: number;
  marker: THREE.Object3D;
}

export interface EditorLandingSpot {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  elevation: number;
  type: 'primary' | 'secondary' | 'emergency';
  marker: THREE.Object3D;
}

export interface EditorFlyZone {
  phases: {
    [key: string]: EditorFlightPhase;
  };
  object: THREE.Object3D | null;
}

export interface EditorFlightPhase {
  type: "takeoff" | "landing" | "ridge" | "approach";
  position: THREE.Vector3;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  nextPhases?: string[];
  object: THREE.Object3D;
}

// Define an action type for history tracking
export interface EditorAction {
  type: 'add_takeoff' | 'add_landing' | 'add_flyzone' | 'create_location';
  object: THREE.Object3D;
  data?: any; // Additional data if needed
}

// Create a new location
export const createNewLocation = (state: EditorState, position: THREE.Vector3, scene: THREE.Scene): EditorLocation => {
  // Create a default location
  const newLocation: EditorLocation = {
    id: `location-${Date.now()}`,
    title: "New Location",
    description: "Description of the new location",
    position: position.clone(),
    cameraView: {
      position: new THREE.Vector3(-0.5, 0.3, 0.5),
      distance: 10000
    },
    takeoffs: [],
    landingSpots: [],
    flyzone: {
      phases: {},
      object: null
    }
  };
  
  // Create a marker for the location
  const marker = createLocationMarker(position);
  scene.add(marker);
  state.markers.push(marker);
  
  // Add to locations array and set as current
  state.locations.push(newLocation);
  state.currentLocationIndex = state.locations.length - 1;
  state.selectedItem = newLocation;
  
  // Add to history
  state.history.push({
    type: 'create_location',
    object: marker,
    data: { locationIndex: state.currentLocationIndex }
  });
  
  return newLocation;
};

// Add a takeoff to the current location
export const addTakeoff = (state: EditorState, position: THREE.Vector3, scene: THREE.Scene): EditorTakeoff | null => {
  if (state.currentLocationIndex === null) return null;
  
  const takeoff: EditorTakeoff = {
    id: `takeoff-${Date.now()}`,
    title: `Takeoff ${state.locations[state.currentLocationIndex].takeoffs.length + 1}`,
    description: "Description of the takeoff",
    position: position.clone(),
    elevation: position.y,
    marker: createTakeoffMarker(position)
  };
  
  scene.add(takeoff.marker);
  state.markers.push(takeoff.marker);
  state.locations[state.currentLocationIndex].takeoffs.push(takeoff);
  state.selectedItem = takeoff;
  
  // Add to history
  state.history.push({
    type: 'add_takeoff',
    object: takeoff.marker,
    data: takeoff
  });
  
  return takeoff;
};

// Add a landing spot to the current location
export const addLandingSpot = (state: EditorState, position: THREE.Vector3, scene: THREE.Scene): EditorLandingSpot | null => {
  if (state.currentLocationIndex === null) return null;
  
  const landingSpot: EditorLandingSpot = {
    id: `landing-${Date.now()}`,
    title: `Landing ${state.locations[state.currentLocationIndex].landingSpots.length + 1}`,
    description: "Description of the landing spot",
    position: position.clone(),
    elevation: position.y,
    type: 'primary',
    marker: createLandingMarker(position)
  };
  
  scene.add(landingSpot.marker);
  state.markers.push(landingSpot.marker);
  state.locations[state.currentLocationIndex].landingSpots.push(landingSpot);
  state.selectedItem = landingSpot;
  
  // Add to history
  state.history.push({
    type: 'add_landing',
    object: landingSpot.marker,
    data: landingSpot
  });
  
  return landingSpot;
};

// Add a flyzone phase to the current location
export const addFlyZonePhase = (
  state: EditorState, 
  position: THREE.Vector3, 
  scene: THREE.Scene
): EditorFlightPhase | null => {
  if (state.currentLocationIndex === null) return null;
  
  const phaseId = `${state.flyZonePhaseType}-${Object.keys(state.locations[state.currentLocationIndex].flyzone.phases).length + 1}`;
  
  const phase: EditorFlightPhase = {
    type: state.flyZonePhaseType,
    position: position.clone(),
    dimensions: {
      width: 400,
      height: 300,
      length: 400
    },
    nextPhases: [],
    object: createFlyZonePhaseMarker(position, state.flyZonePhaseType)
  };
  
  scene.add(phase.object);
  state.flyZones.push(phase.object);
  state.locations[state.currentLocationIndex].flyzone.phases[phaseId] = phase;
  state.selectedItem = phase;
  
  // Add to history
  state.history.push({
    type: 'add_flyzone',
    object: phase.object,
    data: { phaseId, phase }
  });
  
  return phase;
};

// Add this function to copy text to clipboard
export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
          resolve();
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          reject(err);
        });
    } else {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          console.log('Text copied to clipboard (fallback)');
          resolve();
        } else {
          console.error('Failed to copy text (fallback)');
          reject(new Error('Failed to copy text'));
        }
      } catch (err) {
        console.error('Failed to copy text (fallback): ', err);
        reject(err);
      }
    }
  });
};

// Modify the exportLocationData function to return the data
export const exportLocationData = (state: EditorState): { metadata: string, takeoffs: string, landingSpots: string, flyzone: string } => {
  const currentLocation = getCurrentLocation(state);
  if (!currentLocation) {
    alert('No location to export');
    return { metadata: '', takeoffs: '', landingSpots: '', flyzone: '' };
  }

  // Generate metadata.ts
  const metadata = `import * as THREE from 'three';
import { LocationMetadata } from '../index';

const metadata: LocationMetadata = {
  id: '${currentLocation.id}',
  title: '${currentLocation.title}',
  description: '${currentLocation.description}',
  position: new THREE.Vector3(${currentLocation.position.x}, ${currentLocation.position.y}, ${currentLocation.position.z}),
  cameraView: {
    position: new THREE.Vector3(${currentLocation.cameraView.position.x}, ${currentLocation.cameraView.position.y}, ${currentLocation.cameraView.position.z}),
    distance: ${currentLocation.cameraView.distance}
  }
};

export default metadata;`;

  // Generate takeoffs.ts
  const takeoffs = `import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
${currentLocation.takeoffs.map(t => `  {
    id: '${t.id}',
    title: '${t.title}',
    description: '${t.description}',
    position: new THREE.Vector3(${t.position.x}, ${t.position.y}, ${t.position.z}),
    elevation: ${t.elevation}
  }`).join(',\n')}
];

export default takeoffs;`;

  // Generate landingSpots.ts
  const landingSpots = `import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
${currentLocation.landingSpots.map(l => `  {
    id: '${l.id}',
    title: '${l.title}',
    description: '${l.description}',
    position: new THREE.Vector3(${l.position.x}, ${l.position.y}, ${l.position.z}),
    elevation: ${l.elevation},
    type: '${l.type}'
  }`).join(',\n')}
];

export default landingSpots;`;

  // Generate flyzone.ts
  const flyzone = `import * as THREE from 'three';
import { FlyZone, FlightPhase } from '../index';

const phases: Record<string, FlightPhase> = {
${Object.keys(currentLocation.flyzone.phases).map(id => {
  const phase = currentLocation.flyzone.phases[id];
  return `  '${id}': {
    type: '${phase.type}',
    position: new THREE.Vector3(${phase.position.x}, ${phase.position.y}, ${phase.position.z}),
    dimensions: {
      width: ${phase.dimensions.width},
      height: ${phase.dimensions.height},
      length: ${phase.dimensions.length}
    }${phase.nextPhases ? `,
    nextPhases: [${phase.nextPhases.map(p => `'${p}'`).join(', ')}]` : ''}
  }`;
}).join(',\n')}
};

const flyzone: FlyZone = {
  phases
};

export default flyzone;`;

  return { metadata, takeoffs, landingSpots, flyzone };
};

// Helper functions to create markers
const createLocationMarker = (position: THREE.Vector3): THREE.Object3D => {
  // Create a group to hold the marker elements
  const group = new THREE.Group();
  
  // Create a smaller sphere for the location point
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(50, 16, 16), // Reduced size from typical 100 to 50
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  
  // Position the sphere at ground level
  sphere.position.copy(position);
  
  // Create a vertical line from ground to a height above
  const lineHeight = 200; // Height of the vertical line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, lineHeight, 0)
  ]);
  
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );
  
  // Position the line at the marker position
  line.position.copy(position);
  
  // Add a label for the location
  const labelDiv = document.createElement('div');
  labelDiv.className = 'marker-label';
  labelDiv.textContent = 'Location';
  labelDiv.style.color = 'white';
  labelDiv.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
  labelDiv.style.padding = '2px 6px';
  labelDiv.style.borderRadius = '3px';
  labelDiv.style.fontSize = '12px';
  
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, lineHeight + 20, 0); // Position above the line
  
  // Add everything to the group
  group.add(sphere);
  group.add(line);
  group.add(label);
  
  // Set user data for identification
  group.userData = {
    type: 'location',
    locationId: `location-${Date.now()}`
  };
  
  return group;
};

// Create a marker for a takeoff
const createTakeoffMarker = (position: THREE.Vector3): THREE.Object3D => {
  // Create a group to hold the marker elements
  const group = new THREE.Group();
  
  // Create a smaller cone for the takeoff point
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(40, 80, 16), // Smaller cone
    new THREE.MeshBasicMaterial({ color: 0x0088ff })
  );
  
  // Position the cone at ground level with the tip pointing up
  cone.position.copy(position);
  cone.rotation.x = Math.PI; // Flip the cone to point upward
  
  // Create a vertical line from ground to a height above
  const lineHeight = 150; // Height of the vertical line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, lineHeight, 0)
  ]);
  
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0x0088ff })
  );
  
  // Position the line at the marker position
  line.position.copy(position);
  
  // Add a label for the takeoff
  const labelDiv = document.createElement('div');
  labelDiv.className = 'marker-label';
  labelDiv.textContent = 'Takeoff';
  labelDiv.style.color = 'white';
  labelDiv.style.backgroundColor = 'rgba(0, 136, 255, 0.7)';
  labelDiv.style.padding = '2px 6px';
  labelDiv.style.borderRadius = '3px';
  labelDiv.style.fontSize = '12px';
  
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, lineHeight + 20, 0); // Position above the line
  
  // Add everything to the group
  group.add(cone);
  group.add(line);
  group.add(label);
  
  // Set user data for identification
  group.userData = {
    type: 'takeoff',
    takeoffId: `takeoff-${Date.now()}`
  };
  
  return group;
};

// Create a marker for a landing spot
const createLandingMarker = (position: THREE.Vector3): THREE.Object3D => {
  // Create a group to hold the marker elements
  const group = new THREE.Group();
  
  // Create a smaller cylinder for the landing point
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(40, 40, 20, 16), // Smaller cylinder
    new THREE.MeshBasicMaterial({ color: 0xff8800 })
  );
  
  // Position the cylinder at ground level
  cylinder.position.copy(position);
  
  // Create a vertical line from ground to a height above
  const lineHeight = 150; // Height of the vertical line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, lineHeight, 0)
  ]);
  
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0xff8800 })
  );
  
  // Position the line at the marker position
  line.position.copy(position);
  
  // Add a label for the landing spot
  const labelDiv = document.createElement('div');
  labelDiv.className = 'marker-label';
  labelDiv.textContent = 'Landing';
  labelDiv.style.color = 'white';
  labelDiv.style.backgroundColor = 'rgba(255, 136, 0, 0.7)';
  labelDiv.style.padding = '2px 6px';
  labelDiv.style.borderRadius = '3px';
  labelDiv.style.fontSize = '12px';
  
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, lineHeight + 20, 0); // Position above the line
  
  // Add everything to the group
  group.add(cylinder);
  group.add(line);
  group.add(label);
  
  // Set user data for identification
  group.userData = {
    type: 'landing',
    landingId: `landing-${Date.now()}`
  };
  
  return group;
};

const createFlyZonePhaseMarker = (position: THREE.Vector3, type: string): THREE.Object3D => {
  // Choose color based on phase type
  let color;
  switch(type) {
    case 'takeoff':
      color = 0xff0000; // Red
      break;
    case 'landing':
      color = 0x00ff00; // Green
      break;
    case 'ridge':
      color = 0x0000ff; // Blue
      break;
    case 'approach':
      color = 0xffff00; // Yellow
      break;
    default:
      color = 0xffffff; // White
  }
  
  // Create box geometry
  const boxGeometry = new THREE.BoxGeometry(400, 300, 400);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.2,
    wireframe: false
  });
  
  // Create box mesh
  const box = new THREE.Mesh(boxGeometry, material);
  box.position.copy(position);
  
  // Add wireframe
  const wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(boxGeometry),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    })
  );
  box.add(wireframe);
  
  box.userData.type = 'flyzone';
  box.userData.phaseType = type;
  
  return box;
};

// Add this function to the state.ts file
export const resetLocation = (state: EditorState, scene: THREE.Scene): void => {
  if (state.currentLocationIndex !== null) {
    // Remove all markers from the scene
    state.markers.forEach(marker => {
      scene.remove(marker);
    });
    
    // Remove all flyzone objects
    state.flyZones.forEach(flyzone => {
      scene.remove(flyzone);
    });
    
    // Reset the state
    state.locations[state.currentLocationIndex] = {
      id: '',
      title: '',
      description: '',
      position: new THREE.Vector3(),
      cameraView: {
        position: new THREE.Vector3(),
        distance: 0
      },
      takeoffs: [],
      landingSpots: [],
      flyzone: {
        phases: {},
        object: null
      }
    };
    state.currentLocationIndex = null;
    state.selectedItem = null;
    state.markers = [];
    state.flyZones = [];
    
    console.log("Location reset. All markers and flyzones removed.");
  } else {
    console.log("No location to reset.");
  }
};

// Add the undo function
export const undoLastAction = (state: EditorState, scene: THREE.Scene): void => {
  if (state.history.length === 0) {
    console.log("Nothing to undo");
    return;
  }
  
  const lastAction = state.history.pop();
  if (!lastAction) return;
  
  console.log("Undoing action:", lastAction.type);
  
  // Remove the object from the scene
  scene.remove(lastAction.object);
  
  // Remove from appropriate arrays and update state
  switch (lastAction.type) {
    case 'create_location':
      state.locations.pop();
      state.markers = state.markers.filter(m => m !== lastAction.object);
      break;
      
    case 'add_takeoff':
      if (state.currentLocationIndex !== null) {
        state.locations[state.currentLocationIndex].takeoffs = state.locations[state.currentLocationIndex].takeoffs.filter(
          t => t.marker !== lastAction.object
        );
        state.markers = state.markers.filter(m => m !== lastAction.object);
      }
      break;
      
    case 'add_landing':
      if (state.currentLocationIndex !== null) {
        state.locations[state.currentLocationIndex].landingSpots = state.locations[state.currentLocationIndex].landingSpots.filter(
          l => l.marker !== lastAction.object
        );
        state.markers = state.markers.filter(m => m !== lastAction.object);
      }
      break;
      
    case 'add_flyzone':
      if (state.currentLocationIndex !== null && lastAction.data) {
        const { phaseId } = lastAction.data;
        if (phaseId && state.locations[state.currentLocationIndex].flyzone.phases[phaseId]) {
          delete state.locations[state.currentLocationIndex].flyzone.phases[phaseId];
        }
        state.flyZones = state.flyZones.filter(f => f !== lastAction.object);
      }
      break;
  }
  
  console.log("Undo complete");
};

// Add these functions to save and load state from localStorage

// Save the current state to localStorage
export const saveToLocalStorage = (state: EditorState): void => {
  try {
    // Create a serializable version of the state (without THREE.js objects)
    const serializable = {
      locations: state.locations.map(location => ({
        ...location,
        position: {
          x: location.position.x,
          y: location.position.y,
          z: location.position.z
        },
        cameraView: {
          position: {
            x: location.cameraView.position.x,
            y: location.cameraView.position.y,
            z: location.cameraView.position.z
          },
          distance: location.cameraView.distance
        },
        takeoffs: location.takeoffs.map(t => ({
          ...t,
          position: {
            x: t.position.x,
            y: t.position.y,
            z: t.position.z
          },
          // Remove the marker reference as it can't be serialized
          marker: null
        })),
        landingSpots: location.landingSpots.map(l => ({
          ...l,
          position: {
            x: l.position.x,
            y: l.position.y,
            z: l.position.z
          },
          // Remove the marker reference as it can't be serialized
          marker: null
        })),
        flyzone: {
          phases: Object.keys(location.flyzone.phases).reduce((acc, key) => {
            const phase = location.flyzone.phases[key];
            acc[key] = {
              ...phase,
              position: {
                x: phase.position.x,
                y: phase.position.y,
                z: phase.position.z
              },
              // Remove the object reference as it can't be serialized
              object: null
            };
            return acc;
          }, {} as Record<string, any>),
          object: null
        }
      })),
      currentLocationIndex: state.currentLocationIndex,
      mode: state.mode,
      flyZonePhaseType: state.flyZonePhaseType
    };
    
    localStorage.setItem('locationEditor', JSON.stringify(serializable));
    console.log('State saved to localStorage');
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// Load state from localStorage and recreate the THREE.js objects
export const loadFromLocalStorage = (scene: THREE.Scene): EditorState | null => {
  try {
    const saved = localStorage.getItem('locationEditor');
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Create a new state with the saved data
    const state: EditorState = {
      locations: [],
      currentLocationIndex: parsed.currentLocationIndex || null,
      selectedItem: null,
      mode: parsed.mode || 'location',
      flyZonePhaseType: parsed.flyZonePhaseType || 'takeoff',
      markers: [],
      flyZones: [],
      history: []
    };
    
    if (parsed.locations && Array.isArray(parsed.locations)) {
      // Recreate each location
      parsed.locations.forEach((savedLocation: any) => {
        const position = new THREE.Vector3(
          savedLocation.position.x,
          savedLocation.position.y,
          savedLocation.position.z
        );
        
        // Create a new location
        const location = createNewLocation(state, position, scene);
        
        // Update with saved properties
        location.id = savedLocation.id;
        location.title = savedLocation.title;
        location.description = savedLocation.description;
        location.cameraView.position = new THREE.Vector3(
          savedLocation.cameraView.position.x,
          savedLocation.cameraView.position.y,
          savedLocation.cameraView.position.z
        );
        location.cameraView.distance = savedLocation.cameraView.distance;
        
        // Recreate takeoffs
        if (savedLocation.takeoffs && Array.isArray(savedLocation.takeoffs)) {
          // Clear the takeoffs array that was created by createNewLocation
          location.takeoffs = [];
          
          savedLocation.takeoffs.forEach((t: any) => {
            const position = new THREE.Vector3(t.position.x, t.position.y, t.position.z);
            addTakeoff(state, position, scene);
          });
        }
        
        // Recreate landing spots
        if (savedLocation.landingSpots && Array.isArray(savedLocation.landingSpots)) {
          // Clear the landing spots array that was created by createNewLocation
          location.landingSpots = [];
          
          savedLocation.landingSpots.forEach((l: any) => {
            const position = new THREE.Vector3(l.position.x, l.position.y, l.position.z);
            addLandingSpot(state, position, scene);
          });
        }
        
        // Recreate flyzone phases
        if (savedLocation.flyzone && savedLocation.flyzone.phases) {
          // Clear the phases object that was created by createNewLocation
          location.flyzone.phases = {};
          
          Object.keys(savedLocation.flyzone.phases).forEach((key) => {
            const phase = savedLocation.flyzone.phases[key];
            const position = new THREE.Vector3(phase.position.x, phase.position.y, phase.position.z);
            state.flyZonePhaseType = phase.type;
            addFlyZonePhase(state, position, scene);
          });
        }
      });
    }
    
    console.log('State loaded from localStorage');
    return state;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
};

// Clear localStorage
export const clearLocalStorage = (): void => {
  localStorage.removeItem('locationEditor');
  console.log('LocationEditor localStorage cleared');
};

// Helper to get the current location
export const getCurrentLocation = (state: EditorState): EditorLocation | null => {
  if (state.currentLocationIndex === null) return null;
  return state.locations[state.currentLocationIndex] || null;
};

// Helper to set the current location
export const setCurrentLocation = (state: EditorState, index: number | null): void => {
  state.currentLocationIndex = index;
  state.selectedItem = index !== null ? state.locations[index] : null;
};

// Delete a location
export const deleteLocation = (state: EditorState, index: number, scene: THREE.Scene): void => {
  if (index < 0 || index >= state.locations.length) return;
  
  const location = state.locations[index];
  
  // Remove all markers for this location
  const markersToRemove: THREE.Object3D[] = [];
  
  // Find the location marker
  const locationMarker = state.markers.find(m => 
    m.userData.type === 'location' && m.userData.locationId === location.id
  );
  if (locationMarker) markersToRemove.push(locationMarker);
  
  // Find takeoff markers
  location.takeoffs.forEach(t => {
    if (t.marker) markersToRemove.push(t.marker);
  });
  
  // Find landing spot markers
  location.landingSpots.forEach(l => {
    if (l.marker) markersToRemove.push(l.marker);
  });
  
  // Find flyzone objects
  Object.keys(location.flyzone.phases).forEach(key => {
    const phase = location.flyzone.phases[key];
    if (phase.object) markersToRemove.push(phase.object);
  });
  
  // Remove all markers from scene
  markersToRemove.forEach(marker => {
    scene.remove(marker);
    state.markers = state.markers.filter(m => m !== marker);
  });
  
  // Remove from locations array
  state.locations.splice(index, 1);
  
  // Update current location index
  if (state.currentLocationIndex === index) {
    if (state.locations.length > 0) {
      state.currentLocationIndex = Math.min(index, state.locations.length - 1);
    } else {
      state.currentLocationIndex = null;
    }
  } else if (state.currentLocationIndex !== null && state.currentLocationIndex > index) {
    // Adjust index if we deleted a location before the current one
    state.currentLocationIndex--;
  }
  
  // Update selected item
  state.selectedItem = state.currentLocationIndex !== null 
    ? state.locations[state.currentLocationIndex] 
    : null;
};

// Edit location properties
export const editLocation = (
  state: EditorState, 
  index: number, 
  properties: Partial<Pick<EditorLocation, 'title' | 'description'>>
): void => {
  if (index < 0 || index >= state.locations.length) return;
  
  const location = state.locations[index];
  
  // Update properties
  if (properties.title !== undefined) location.title = properties.title;
  if (properties.description !== undefined) location.description = properties.description;
  
  // If this is the current location, update selected item
  if (state.currentLocationIndex === index) {
    state.selectedItem = location;
  }
}; 