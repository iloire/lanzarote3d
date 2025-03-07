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
  createSimpleMarker,
} from './helpers';
import { worldToGPS } from './helpers/gps';


import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import { 
  getConfig, 
  updateConfig, 
  defaultConfig
} from './config/flyzone-config';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls, gui } = options;

    // Add configuration controls to GUI if available
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
            if (marker.flyzone) {
              marker.flyzone.visible = value && 
                camera.position.distanceTo(marker.pin.position) < VISIBILITY_THRESHOLDS.DETAIL_VIEW;
            }
          });
        });

      displayFolder.add(config.display, 'markers')
        .name('Show Markers')
        .onChange((value: boolean) => {
          updateConfig({ display: { markers: value } });
          markers.forEach(marker => {
            marker.pin.visible = value;
          });
        });

      displayFolder.add(config.display, 'labels')
        .name('Show Labels')
        .onChange((value: boolean) => {
          updateConfig({ display: { labels: value } });
          // Update label visibility
          markers.forEach(marker => {
            const label = marker.pin.children.find(child => child instanceof CSS2DObject);
            if (label) label.visible = value;
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

    // Add these declarations at the beginning of the load function
    let landingMarkers: THREE.Object3D[] = [];
    let landingMarkersVisible = true;

    // Define the setter function
    const setLandingMarkersVisible = (visible: boolean) => {
      landingMarkersVisible = visible;
    };

    // First, let's define a function to load landing markers
    const loadLandingMarkers = async () => {
      // Clear existing landing markers
      landingMarkers.forEach(marker => {
        scene.remove(marker);
      });
      landingMarkers = [];
      
      // Get the current location's landing spots
      if (!currentLocation || !currentLocation.landingSpots) return;
      
      // Create markers for each landing spot
      for (const landingSpot of currentLocation.landingSpots) {
        try {
          const marker = await createSimpleMarker(landingSpot.position, MarkerType.LANDING);
          marker.pin.userData.id = landingSpot.id;
          scene.add(marker.pin);
          landingMarkers.push(marker.pin);
        } catch (error) {
          console.error("Error creating landing marker:", error);
        }
      }
    };

    let currentLocation: Location | undefined;

    const navigateTo = async (position: THREE.Vector3, location?: Location) => {
      const lookAtPos = position.clone();
      
      if (location) {
        const view = location.cameraView;
        const distance = view.distance || 20000;
        
        // Calculate target camera position
        const cameraDirection = view.position.clone().multiplyScalar(distance);
        const targetPos = position.clone().add(cameraDirection);
        const targetLookAt = view.lookAt ? view.lookAt.clone() : lookAtPos;

        // Animate camera position
        new TWEEN.Tween(camera.position)
          .to({
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z
          }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();

        // Animate controls target
        new TWEEN.Tween(controls.target)
          .to({
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z
          }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(() => controls.update())
          .start();

        currentLocation = location;
        await loadLandingMarkers(); // Load landing markers for the new location
      } else {
        const offset = 3000;
        const targetPos = position.clone().add(new THREE.Vector3(offset, offset, offset));

        // Animate camera position
        new TWEEN.Tween(camera.position)
          .to({
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z
          }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();

        // Animate controls target
        new TWEEN.Tween(controls.target)
          .to({
            x: lookAtPos.x,
            y: lookAtPos.y,
            z: lookAtPos.z
          }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(() => controls.update())
          .start();
      }
    };

    // Setup renderers and containers
    const labelRenderer = setupLabelRenderer();
    const popupContainer = setupPopupContainer();
    console.log('Initialized popup container:', popupContainer); // Debug log

    // Create markers
    const createMarkers = async () => {
      const markerArrays = await Promise.all(locations.map(async location => {
        // Create location marker
        const locationMarker = await createMarker(
          location.position,
          location.title,
          location.description,
          [],
          MarkerType.LOCATION,
          scene,
          popupContainer,
          navigateTo,
          location,
          camera
        );
        console.log('Created location marker:', {
          title: location.title,
          type: locationMarker.type,
          pinType: locationMarker.pin.userData.type
        });

        // Create takeoff markers
        const takeoffMarkers = await Promise.all(location.takeoffs.map(async takeoff => 
          createMarker(
            takeoff.position,
            takeoff.title,
            takeoff.description,
            takeoff.mediaItems,
            MarkerType.TAKEOFF,
            scene,
            popupContainer,
            navigateTo,
            location,
            camera,
            takeoff.conditions
          )
        ));

        // Create landing spot markers
        const landingMarkers = await Promise.all((location.landingSpots || []).map(async spot => 
          createMarker(
            spot.position,
            spot.title,
            spot.description,
            spot.mediaItems,
            MarkerType.LANDING,
            scene,
            popupContainer,
            navigateTo,
            location,
            camera
          )
        ));

        // Create and associate flyzone
        let flyzone;
        if (location.flyzone) {
          flyzone = createCustomFlyZone(location.flyzone);
          // Use config to determine initial visibility
          flyzone.visible = getConfig().display.flyzone;
          scene.add(flyzone);
          locationMarker.flyzone = flyzone;
        }

        return [locationMarker, ...takeoffMarkers, ...landingMarkers];
      }));

      // Use reduce instead of flat()
      return markerArrays.reduce((acc, curr) => [...acc, ...curr], []);
    };

    // Use the markers
    const markers = await createMarkers();

    console.log(markers);


    // Setup interaction
    const setupInteraction = () => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let hoveredObject: THREE.Object3D | null = null;

      const onMouseMove = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onClick = (event: MouseEvent) => {
        onMouseMove(event);
        
        raycaster.setFromCamera(mouse, camera);
        // Important: Use recursive=true to check all descendants
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Debug what we're clicking on
        console.log('Click intersects:', intersects.map(i => ({
          type: i.object.userData.type,
          clickable: i.object.userData.clickable,
          name: i.object.name
        })));
        
        // Find the first clickable object
        const clickedObject = intersects.find(i => i.object.userData.clickable)?.object;
        
        if (clickedObject) {
          console.log('Clicked on object:', clickedObject);
          
          // Find the marker by traversing up the object hierarchy
          const findMarkerForObject = (obj: THREE.Object3D): Marker | undefined => {
            // Check if this object is directly a marker pin
            const marker = markers.find(m => m.pin === obj);
            if (marker) {
              console.log('Found marker directly:', marker);
              return marker;
            }
            
            // If not, check if it's a child of a marker pin
            for (const marker of markers) {
              if (isDescendantOf(obj, marker.pin)) {
                console.log('Found marker as ancestor:', marker);
                return marker;
              }
            }
            
            return undefined;
          };
          
          const marker = findMarkerForObject(clickedObject);
          if (marker) {
            console.log('Triggering popup for marker:', marker);
            marker.showPopup();
          } else {
            console.log('No marker found for clicked object');
          }
        }
      };

      // Helper function to check if an object is a descendant of another
      const isDescendantOf = (obj: THREE.Object3D, potentialAncestor: THREE.Object3D): boolean => {
        let current = obj;
        while (current && current !== scene) {
          if (current === potentialAncestor) {
            return true;
          }
          current = current.parent!;
        }
        return false;
      };

      // Add event listeners
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);
      
      // Make sure canvas can receive focus and events
      renderer.domElement.style.outline = 'none';
      renderer.domElement.tabIndex = 1;

      return { raycaster, mouse, hoveredObject };
    };

    let { raycaster, mouse, hoveredObject } = setupInteraction();

    // Render loop
    const animate = () => {
      TWEEN.update();

      // Update marker visibility based on camera distance
      markers.forEach(marker => {
        const distance = camera.position.distanceTo(marker.pin.position);
        const isDetailView = distance < VISIBILITY_THRESHOLDS.DETAIL_VIEW;

        if (marker.type === MarkerType.LOCATION) {
          // Show location markers only when far away
          marker.setVisibility(!isDetailView);         
        } else {
          // Show takeoff markers and other details only when close
          marker.setVisibility(isDetailView);
        }
        
        // Update flyzone visibility based on config and distance
        if (marker.flyzone) {
          marker.flyzone.visible = getConfig().display.flyzone && isDetailView;
        }
      });

      // Update hover states
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        scene.children.filter(obj => obj.visible)
      );
      
      // Only log raycast hits if they're hoverable
      const hoverableHits = intersects.filter(i => i.object.userData.hoverable);
      if (hoverableHits.length > 0) {
        // console.log('Hovering over:', hoverableHits.map(i => i.object.userData.type));
      }

      const hoveredMarker = intersects.find(i => i.object.userData.hoverable)?.object;

      if (hoveredMarker !== hoveredObject) {
        // Find the marker by traversing up the object hierarchy
        const findRootMarker = (obj: THREE.Object3D): Marker | undefined => {
          // Check if this object is a root marker
          const marker = markers.find(m => m.pin === obj);
          if (marker) return marker;
          
          // If not, check its parent
          if (obj.parent && obj.parent !== scene) {
            return findRootMarker(obj.parent);
          }
          
          return undefined;
        };

        const oldMarker = hoveredObject ? findRootMarker(hoveredObject) : undefined;
        const newMarker = hoveredMarker ? findRootMarker(hoveredMarker) : undefined;

        if (oldMarker) oldMarker.unhoverAnimation.start();
        if (newMarker) newMarker.hoverAnimation.start();
        
        hoveredObject = hoveredMarker;
      }

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    // Create UI
    const createUI = () => {
      const rootElement = document.getElementById("legend-points");
      if (!rootElement) return;

      const root = createRoot(rootElement);
      
      const toggleLandingsButton = (
        <button 
          onClick={() => toggleLandingMarkers(!landingMarkersVisible)}
          className={landingMarkersVisible ? "active" : ""}
        >
          {landingMarkersVisible ? "Hide Landings" : "Show Landings"}
        </button>
      );
      
      const buttons = locations.map(location => (
        <div key={location.id}>
          <button onClick={() => navigateTo(location.position, location)}>
            {location.title}
          </button>
        </div>
      ));
      
      root.render(
        <div className="points">
          {buttons}
          <div className="toggle-buttons">
            {toggleLandingsButton}
          </div>
        </div>
      );
    };

    // Initialize
    createUI();
    window.addEventListener('resize', () => labelRenderer.setSize(window.innerWidth, window.innerHeight));
    const initialPosition = new THREE.Vector3(14000, 8000, 14000);
    navigateTo(initialPosition);
    animate();

    // Update the toggle function to also update clickability
    const toggleLandingMarkers = (visible: boolean) => {
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

    // Handle mouse clicks to log coordinates
    const onMouseClick = (event: MouseEvent) => {
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

    // Return a cleanup function to remove event listeners
    return () => {
      renderer.domElement.removeEventListener('click', onMouseClick);
    };
  },
};

export default FlyZones;
