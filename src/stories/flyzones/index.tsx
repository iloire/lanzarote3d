import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import locations from "./locations";
// import VideoFrame from "../components/video-frame";
import { StoryOptions } from "../types";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Takeoff, Media, Location } from "./locations";
import {
  TAKEOFF_VISIBILITY_THRESHOLD, 
  type Marker,
  setupPopupContainer,
  VISIBILITY_THRESHOLDS,
  MarkerType,
  createCustomFlyZone,
  createMarker,
  setupLabelRenderer,
} from './helpers';
import { createSimpleMarker } from './markers/marker-creator';
import { worldToGPS } from './helpers/gps';


import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import { 
  getConfig, 
  updateConfig, 
  defaultConfig
} from './config/flyzone-config';

import { createRuler, Ruler } from './helpers/ruler';
import { createUI } from './ui/UI';
import { navigateTo } from './navigation/camera';
import { setupMouseClickHandler } from './events/mouse';
import { setupAnimationLoop } from './animation/loop';
import { toggleLandingMarkers } from './markers/toggle';
import './styles/ruler.css';
import { Marker as MarkerHelper, MarkerObject } from './markers/markers';
import { createWindArrowsForTakeoff } from './helpers/wind';
import './styles/popup.css';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls, gui } = options;

    // Setup scene
    const markers: MarkerHelper[] = [];
    const landingMarkers: THREE.Object3D[] = [];
    let landingMarkersVisible = true;
    let currentLocation: Location | undefined;
    const popupContainer = setupPopupContainer();
    const labelRenderer = setupLabelRenderer();
    
    // Make sure labelRenderer is properly sized
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(labelRenderer.domElement);
    
    // Function to load locations and create markers
    const loadLocations = async () => {
      console.log("Loading locations:", locations);
      
      // Create location markers
      for (const location of locations) {
        console.log("Creating marker for location:", location.title);
        
        // Create a simple sphere to represent the location
        const locationMarker = await createSimpleMarker({
          position: location.position,
          color: 0x00ff00,
          size: 300
        }, scene);
        
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
            console.log("Creating marker for takeoff:", takeoff.title);
            
            // Create a takeoff marker
            const navigateToWrapper = (position: THREE.Vector3, location?: Location) => {
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
              object: takeoffMarker,
              data: takeoff,
              pin: takeoffMarker,
              setVisibility: (visible: boolean) => {
                if (takeoffMarker) {
                  takeoffMarker.visible = visible;
                }
              }
            } as Marker);
            
            // Create wind arrows for this takeoff
            const windArrows = createWindArrowsForTakeoff(takeoff.position, takeoff.conditions);
            windArrows.forEach(arrow => scene.add(arrow));
          }
        }
        
        // Create landing markers
        if (location.landingSpots && location.landingSpots.length > 0) {
          for (const landing of location.landingSpots) {
            console.log("Creating marker for landing:", landing.title);
            
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
          console.log("Creating flyzone for location:", location.title);
          
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
    
    // Setup mouse click handler
    const cleanupMouseHandler = setupMouseClickHandler(renderer, camera, scene);
    
    // Create UI
    createUI({
      locations,
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
    const initialPosition = locations.length > 0 
      ? locations[0].position.clone() 
      : new THREE.Vector3(14000, 8000, 14000);
    
    navigateTo(initialPosition, camera, controls, locations.length > 0 ? locations[0] : undefined);
    
    // Start animation loop
    setupAnimationLoop(renderer, scene, camera, controls, labelRenderer, markers, landingMarkersVisible);
    
    // Setup mouse click handler
    const handleMouseClick = (event: MouseEvent) => {
      // Create raycaster and mouse vector
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with all objects in the scene
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Check if we hit any markers
      for (const intersect of intersects) {
        let current = intersect.object;
        
        // Traverse up to find the root object with userData
        while (current && current.parent) {
          if (current.userData && current.userData.isInteractive) {
            console.log("Clicked on interactive object:", current);
            if (current.userData.onClick) {
              current.userData.onClick();
            }
            return;
          }
          current = current.parent;
        }
      }
    };

    // Add event listener
    window.addEventListener('click', handleMouseClick);
    
    // Return cleanup function
    return () => {
      cleanupMouseHandler();
      ruler.deactivate();
      document.body.removeChild(labelRenderer.domElement);
      window.removeEventListener('click', handleMouseClick);
    };
  },
};

export default FlyZones;
