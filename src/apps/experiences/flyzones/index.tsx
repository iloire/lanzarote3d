import * as THREE from "three";
import locations from "./locations";
// import VideoFrame from "../components/video-frame";
import { StoryOptions } from "../../shared/types";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Location as FlyLocation } from "./helpers/types";
import {
  setupPopupContainer,
  VISIBILITY_THRESHOLDS,
  MarkerType,
  createCustomFlyZone,
  createMarker,
  setupLabelRenderer,
} from './helpers';
import { createSimpleMarker } from './markers/marker-creator';



import {
  getConfig,
  updateConfig
} from './config/flyzone-config';

import { createRuler } from './helpers/ruler';
import { createUI } from './ui/UI';
import { navigateTo } from './navigation/camera';
import { setupMouseClickHandler } from './events/mouse';
import { setupAnimationLoop } from './animation/loop';
import { toggleLandingMarkers } from './markers/toggle';
import './styles/ruler.css';
import { Marker as MarkerHelper } from './markers/markers';
import { createWindArrowsForTakeoff } from './helpers/wind';
import './styles/popup.css';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls, gui } = options;

    // Setup scene
    const markers: MarkerHelper[] = [];
    const landingMarkers: THREE.Object3D[] = [];
    let landingMarkersVisible = true;
    let currentLocation: FlyLocation | undefined;
    const popupContainer = setupPopupContainer();
    const labelRenderer = setupLabelRenderer();
    
    // Make sure labelRenderer is properly sized
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(labelRenderer.domElement);
    
    // Function to load locations and create markers
    const loadLocations = async () => {
      // Loading available locations
      if (locations.length === 0) {
        console.error("No locations found!");
        
        // Add a fallback object if no locations
        const dummyGeometry = new THREE.BoxGeometry(500, 500, 500);
        const dummyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const dummyCube = new THREE.Mesh(dummyGeometry, dummyMaterial);
        dummyCube.position.set(0, 250, 0);
        scene.add(dummyCube);
      }
      
      // Processing locations
      
      // Create location markers
      for (const location of locations as FlyLocation[]) {
        // Creating location marker
        
        // Create a simple sphere to represent the location
        const locationMarker = await createSimpleMarker({
          position: location.position,
          color: 0x00ff00,
          size: 300
        });
        
        // Add the marker to the scene
        scene.add(locationMarker);
        
        // Create a label for the location
        const labelDiv = document.createElement('div');
        labelDiv.className = 'location-label';
        labelDiv.textContent = location.title;
        
        const label = new CSS2DObject(labelDiv);
        label.position.copy(location.position);
        label.position.y += 400; // Offset the label above the marker
        scene.add(label);
        
        // Add to markers array
        markers.push({
          type: MarkerType.LOCATION,
          position: location.position,
          object: locationMarker,
          label: label,
          data: location,
          pin: locationMarker
        });
        
        // Create takeoff markers
        if (location.takeoffs && location.takeoffs.length > 0) {
          for (const takeoff of location.takeoffs) {
            // Creating takeoff marker
            
            // Create a takeoff marker
            const navigateToWrapper = (position: THREE.Vector3, location?: FlyLocation) => {
              navigateTo(position, camera, controls, location);
            };
            
            const takeoffMarker = await createMarker(
              takeoff.position,
              takeoff.title,
              takeoff.description,
              takeoff.mediaItems,
              MarkerType.TAKEOFF,
              scene,
              popupContainer,
              navigateToWrapper,
              currentLocation,
              camera,
              takeoff.conditions
            );
            
            // Add to markers array
            markers.push({
              type: MarkerType.TAKEOFF,
              position: takeoff.position,
              object: takeoffMarker as unknown as THREE.Object3D,
              data: takeoff,
              pin: takeoffMarker as unknown as THREE.Object3D,
              setVisibility: (visible: boolean) => {
                if (takeoffMarker) {
                  takeoffMarker.visible = visible;
                }
              }
            });
            
            // Create wind arrows for this takeoff
            const windArrows = createWindArrowsForTakeoff(takeoff.position, takeoff.conditions);
            windArrows.forEach(arrow => scene.add(arrow));
          }
        }
        
        // Create landing markers
        if (location.landingSpots && location.landingSpots.length > 0) {
          for (const landing of location.landingSpots) {
            // Creating landing marker
            
            // Create a landing marker (cylinder)
            const landingGeometry = new THREE.CylinderGeometry(150, 150, 50, 16);
            const landingMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            const landingMarker = new THREE.Mesh(landingGeometry, landingMaterial);
            landingMarker.position.copy(landing.position);
            scene.add(landingMarker);
            
            // Create a label for the landing
            const landingLabelDiv = document.createElement('div');
            landingLabelDiv.className = 'landing-label';
            landingLabelDiv.textContent = landing.title;
            
            const landingLabel = new CSS2DObject(landingLabelDiv);
            landingLabel.position.copy(landing.position);
            landingLabel.position.y += 100; // Offset the label above the marker
            scene.add(landingLabel);
            
            // Add to markers array
            markers.push({
              type: MarkerType.LANDING,
              position: landing.position,
              object: landingMarker,
              label: landingLabel,
              data: landing,
              pin: landingMarker
            });
            
            // Add to landing markers array for toggling visibility
            landingMarkers.push(landingMarker);
            landingMarkers.push(landingLabel);
          }
        }
        
        // Create flyzone visualization if available
        if (location.flyzone) {
          // Creating flyzone visualization
          
          // Create a custom flyzone visualization
          const flyzone = await createCustomFlyZone(location.flyzone);
          
          // Add the flyzone to the scene
          scene.add(flyzone);
          
          // Add to markers array
          markers.push({
            type: MarkerType.LOCATION,
            position: location.position,
            object: flyzone,
            data: location.flyzone,
            pin: flyzone
          });
        }
      }
    };
    
    // Add this function after the labelRenderer setup
    const setupScene = () => {
      // Add ambient light to the scene
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light (like sunlight)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1000, 1000, 1000);
      scene.add(directionalLight);
      
      // Set background color (sky blue)
      scene.background = new THREE.Color(0x87ceeb);
      
      // Add a simple ground plane for reference
      const groundGeometry = new THREE.PlaneGeometry(50000, 50000);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a7e4f,  // Green color for ground
        roughness: 0.8,
        metalness: 0.2
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      ground.position.y = -10; // Slightly below origin
      scene.add(ground);
      
      // Scene setup complete
    };

    // Call this function before loadLocations
    setupScene();
    
    // Load locations
    await loadLocations();
    
    // Add GUI controls if available
    if (gui) {
      const config = getConfig();
      const flyzonesFolder = gui.addFolder('Flyzones');
      
      // Display settings
      const displayFolder = flyzonesFolder.addFolder('Display');
      
      displayFolder.add(config.display, 'flyzone')
        .name('Show Flyzones')
        .onChange((value: boolean) => {
          updateConfig({ display: { flyzone: value } });
          // Update visibility of existing flyzones
          markers.forEach(marker => {
            if (marker.object && marker.position) {
              marker.object.visible = value && 
                camera.position.distanceTo(marker.position) < VISIBILITY_THRESHOLDS.DETAIL_VIEW;
            }
          });
        });

      displayFolder.add(config.display, 'markers')
        .name('Show Markers')
        .onChange((value: boolean) => {
          updateConfig({ display: { markers: value } });
          markers.forEach(marker => {
            if (marker.pin) {
              marker.pin.visible = value;
            }
          });
        });

      displayFolder.add(config.display, 'labels')
        .name('Show Labels')
        .onChange((value: boolean) => {
          updateConfig({ display: { labels: value } });
          // Update label visibility
          markers.forEach(marker => {
            if (marker.pin) {
              const label = marker.pin.children.find(child => child instanceof CSS2DObject);
              if (label) label.visible = value;
            }
          });
        });
      
      // Colors settings
      const colorsFolder = flyzonesFolder.addFolder('Colors');
      colorsFolder.addColor(config.colors, 'takeoff').name('Takeoff Zone');
      colorsFolder.addColor(config.colors, 'landing').name('Landing Zone');
      colorsFolder.addColor(config.colors, 'ridge').name('Ridge Zone');
      colorsFolder.addColor(config.colors, 'approach').name('Approach Zone');
      
      // Opacity settings
      const opacityFolder = flyzonesFolder.addFolder('Opacity');
      opacityFolder.add(config.opacity, 'boxes', 0, 1).name('Boxes');
      opacityFolder.add(config.opacity, 'lines', 0, 1).name('Lines');
    }
    
    // Create ruler tool
    const ruler = createRuler({
      scene,
      camera,
      renderer,
      labelRenderer
    });
    
    // Function to toggle ruler tool
    const toggleRuler = () => {
      if (ruler.isActive()) {
        ruler.deactivate();
        document.getElementById('ruler-toggle-btn')?.classList.remove('active');
      } else {
        ruler.activate();
        document.getElementById('ruler-toggle-btn')?.classList.add('active');
      }
    };
    
    // Function to update landing markers visibility state
    const setLandingMarkersVisible = (visible: boolean) => {
      landingMarkersVisible = visible;
    };
    
    // Create UI
    createUI({
      locations: locations as FlyLocation[],
      landingMarkersVisible,
      onNavigate: (position, location) => {
        currentLocation = location;
        navigateTo(position, camera, controls, location);
      },
      onToggleLandings: (visible) => toggleLandingMarkers(landingMarkers, visible, setLandingMarkersVisible),
      onToggleRuler: toggleRuler,
      showRulerButton: true
    });

    // Setup window resize handler
    window.addEventListener('resize', () => {
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Set initial position
    const flyLocations = locations as FlyLocation[];
    const initialPosition = flyLocations.length > 0 && flyLocations[0]?.position
      ? flyLocations[0].position.clone()
      : new THREE.Vector3(14000, 8000, 14000);

    navigateTo(initialPosition, camera, controls, flyLocations.length > 0 ? flyLocations[0] : undefined);

    // Setup mouse click handler
    const cleanupMouseHandler = setupMouseClickHandler(renderer, camera, scene);

    // Start animation loop
    setupAnimationLoop(renderer, scene, camera, controls, labelRenderer, markers, landingMarkersVisible);

    // Return cleanup function
    return () => {
      cleanupMouseHandler();
      ruler.deactivate();
      document.body.removeChild(labelRenderer.domElement);
    };
  },
};

export default FlyZones;
