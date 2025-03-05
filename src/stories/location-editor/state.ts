import * as THREE from "three";
import { Location, Takeoff, LandingSpot, FlightPhase, FlyZoneShape } from "../flyzones/locations";

export interface EditorState {
  currentLocation: EditorLocation | null;
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
  
  // Update state
  state.currentLocation = newLocation;
  state.selectedItem = newLocation;
  
  // Add to history
  state.history.push({
    type: 'create_location',
    object: marker
  });
  
  return newLocation;
};

// Add a takeoff to the current location
export const addTakeoff = (state: EditorState, position: THREE.Vector3, scene: THREE.Scene): EditorTakeoff | null => {
  if (!state.currentLocation) return null;
  
  const takeoff: EditorTakeoff = {
    id: `takeoff-${Date.now()}`,
    title: `Takeoff ${state.currentLocation.takeoffs.length + 1}`,
    description: "Description of the takeoff",
    position: position.clone(),
    elevation: position.y,
    marker: createTakeoffMarker(position)
  };
  
  scene.add(takeoff.marker);
  state.markers.push(takeoff.marker);
  state.currentLocation.takeoffs.push(takeoff);
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
  if (!state.currentLocation) return null;
  
  const landingSpot: EditorLandingSpot = {
    id: `landing-${Date.now()}`,
    title: `Landing ${state.currentLocation.landingSpots.length + 1}`,
    description: "Description of the landing spot",
    position: position.clone(),
    elevation: position.y,
    type: 'primary',
    marker: createLandingMarker(position)
  };
  
  scene.add(landingSpot.marker);
  state.markers.push(landingSpot.marker);
  state.currentLocation.landingSpots.push(landingSpot);
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
  if (!state.currentLocation) return null;
  
  const phaseId = `${state.flyZonePhaseType}-${Object.keys(state.currentLocation.flyzone.phases).length + 1}`;
  
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
  state.currentLocation.flyzone.phases[phaseId] = phase;
  state.selectedItem = phase;
  
  // Add to history
  state.history.push({
    type: 'add_flyzone',
    object: phase.object,
    data: { phaseId, phase }
  });
  
  return phase;
};

// Export location data as formatted TypeScript code
export const exportLocationData = (state: EditorState): string => {
  if (!state.currentLocation) {
    alert("No location to export!");
    return "";
  }
  
  const location = state.currentLocation;
  
  // Format the location data as TypeScript code
  const metadataCode = `
import * as THREE from 'three';
import { LocationMetadata } from '../index';

const metadata: LocationMetadata = {
  id: '${location.id}',
  title: '${location.title}',
  description: '${location.description}',
  position: new THREE.Vector3(${location.position.x}, ${location.position.y}, ${location.position.z}),
  cameraView: {
    position: new THREE.Vector3(${location.cameraView.position.x}, ${location.cameraView.position.y}, ${location.cameraView.position.z}),
    distance: ${location.cameraView.distance}
  }
};

export default metadata;`;

  const takeoffsCode = `
import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
  ${location.takeoffs.map(takeoff => `{
    id: '${takeoff.id}',
    title: '${takeoff.title}',
    description: '${takeoff.description}',
    position: new THREE.Vector3(${takeoff.position.x}, ${takeoff.position.y}, ${takeoff.position.z}),
    elevation: ${takeoff.elevation},
    conditions: [
      {
        direction: {
          ideal: 320,
          range: [290, 350]
        },
        speed: {
          min: 10,
          max: 25,
          ideal: 15
        },
        rating: 5,
        description: 'Perfect conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/takeoff.jpg',
        title: 'Takeoff'
      }
    ]
  }`).join(',\n  ')}
];

export default takeoffs;`;

  const landingSpotsCode = `
import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
  ${location.landingSpots.map(landing => `{
    id: '${landing.id}',
    title: '${landing.title}',
    description: '${landing.description}',
    position: new THREE.Vector3(${landing.position.x}, ${landing.position.y}, ${landing.position.z}),
    elevation: ${landing.elevation},
    type: '${landing.type}',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/landing.jpg',
        title: 'Landing Area'
      }
    ]
  }`).join(',\n  ')}
];

export default landingSpots;`;

  const flyzoneCode = `
import * as THREE from 'three';
import { FlyZoneShape } from '../index';

const flyzone: FlyZoneShape = {
  phases: {
    ${Object.keys(location.flyzone.phases).map(key => `${key}: {
      type: '${location.flyzone.phases[key].type}',
      position: new THREE.Vector3(${location.flyzone.phases[key].position.x}, ${location.flyzone.phases[key].position.y}, ${location.flyzone.phases[key].position.z}),
      dimensions: {
        width: ${location.flyzone.phases[key].dimensions.width},
        height: ${location.flyzone.phases[key].dimensions.height},
        length: ${location.flyzone.phases[key].dimensions.length}
      }${location.flyzone.phases[key].nextPhases && location.flyzone.phases[key].nextPhases.length > 0 ? `,
      nextPhases: [${location.flyzone.phases[key].nextPhases.map(p => `'${p}'`).join(', ')}]` : ''}
    }`).join(',\n    ')}
  }
};

export default flyzone;`;

  const indexCode = `
import { Location } from '../index';
import metadata from './metadata';
import takeoffs from './takeoffs';
import landingSpots from './landingSpots';
import flyzone from './flyzone';

const ${location.id.replace(/-/g, '_')}: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone
};

export default ${location.id.replace(/-/g, '_')};`;

  // Display the code in a modal or console
  console.log("=== METADATA ===");
  console.log(metadataCode);
  console.log("\n=== TAKEOFFS ===");
  console.log(takeoffsCode);
  console.log("\n=== LANDING SPOTS ===");
  console.log(landingSpotsCode);
  console.log("\n=== FLYZONE ===");
  console.log(flyzoneCode);
  console.log("\n=== INDEX ===");
  console.log(indexCode);
  
  // Create a modal to display the code
  const modal = document.createElement('div');
  modal.className = 'export-modal';
  modal.innerHTML = `
    <div class="export-modal-content">
      <h2>Location Data Export</h2>
      <div class="export-tabs">
        <button class="tab-button active" data-tab="metadata">metadata.ts</button>
        <button class="tab-button" data-tab="takeoffs">takeoffs.ts</button>
        <button class="tab-button" data-tab="landingSpots">landingSpots.ts</button>
        <button class="tab-button" data-tab="flyzone">flyzone.ts</button>
        <button class="tab-button" data-tab="index">index.ts</button>
      </div>
      <div class="export-tab-content active" id="metadata-content">
        <pre>${metadataCode}</pre>
      </div>
      <div class="export-tab-content" id="takeoffs-content">
        <pre>${takeoffsCode}</pre>
      </div>
      <div class="export-tab-content" id="landingSpots-content">
        <pre>${landingSpotsCode}</pre>
      </div>
      <div class="export-tab-content" id="flyzone-content">
        <pre>${flyzoneCode}</pre>
      </div>
      <div class="export-tab-content" id="index-content">
        <pre>${indexCode}</pre>
      </div>
      <button class="close-modal">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add event listeners for tabs
  const tabButtons = modal.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and content
      tabButtons.forEach(b => b.classList.remove('active'));
      const tabContents = modal.querySelectorAll('.export-tab-content');
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabName = button.getAttribute('data-tab');
      document.getElementById(`${tabName}-content`).classList.add('active');
    });
  });
  
  // Add event listener for close button
  const closeButton = modal.querySelector('.close-modal');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });
  
  return "Data exported successfully!";
};

// Helper functions to create markers
const createLocationMarker = (position: THREE.Vector3): THREE.Object3D => {
  const geometry = new THREE.CylinderGeometry(300, 300, 1500, 12, 1);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0xff0000,
    emissive: 0x440000,
    transparent: true,
    opacity: 0.8
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  group.position.copy(position);
  group.userData.type = 'location';
  
  return group;
};

const createTakeoffMarker = (position: THREE.Vector3): THREE.Object3D => {
  const geometry = new THREE.CylinderGeometry(0, 100, 150, 12, 1);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    emissive: 0x004400,
    transparent: true,
    opacity: 0.8
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  group.position.copy(position);
  group.userData.type = 'takeoff';
  
  return group;
};

const createLandingMarker = (position: THREE.Vector3): THREE.Object3D => {
  const geometry = new THREE.CylinderGeometry(300, 300, 50, 12, 1);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x0000ff,
    emissive: 0x000044,
    transparent: true,
    opacity: 0.8
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  group.position.copy(position);
  group.userData.type = 'landing';
  
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
  if (state.currentLocation) {
    // Remove all markers from the scene
    state.markers.forEach(marker => {
      scene.remove(marker);
    });
    
    // Remove all flyzone objects
    state.flyZones.forEach(flyzone => {
      scene.remove(flyzone);
    });
    
    // Reset the state
    state.currentLocation = null;
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
      state.currentLocation = null;
      state.markers = state.markers.filter(m => m !== lastAction.object);
      break;
      
    case 'add_takeoff':
      if (state.currentLocation) {
        state.currentLocation.takeoffs = state.currentLocation.takeoffs.filter(
          t => t.marker !== lastAction.object
        );
        state.markers = state.markers.filter(m => m !== lastAction.object);
      }
      break;
      
    case 'add_landing':
      if (state.currentLocation) {
        state.currentLocation.landingSpots = state.currentLocation.landingSpots.filter(
          l => l.marker !== lastAction.object
        );
        state.markers = state.markers.filter(m => m !== lastAction.object);
      }
      break;
      
    case 'add_flyzone':
      if (state.currentLocation && lastAction.data) {
        const { phaseId } = lastAction.data;
        if (phaseId && state.currentLocation.flyzone.phases[phaseId]) {
          delete state.currentLocation.flyzone.phases[phaseId];
        }
        state.flyZones = state.flyZones.filter(f => f !== lastAction.object);
      }
      break;
  }
  
  console.log("Undo complete");
}; 