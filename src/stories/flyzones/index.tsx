import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import locations from "./locations/lanzarote";
// import VideoFrame from "../components/video-frame";
import { StoryOptions } from "../types";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Takeoff, Media, Location } from "./locations";
import {
  TAKEOFF_VISIBILITY_THRESHOLD,
  createMarker,
  type Marker,
  setupLabelRenderer,
  setupPopupContainer,
  VISIBILITY_THRESHOLDS
} from './helpers';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls } = options;

    const navigateTo = (position: THREE.Vector3, location?: Location) => {
      const lookAtPos = position.clone();
      
      if (location) {
        // Use location's camera configuration
        const view = location.cameraView;
        const distance = view.distance || 20000;
        
        // Calculate camera position based on the configured direction and distance
        const cameraDirection = view.position.clone().multiplyScalar(distance);
        const cameraPos = position.clone().add(cameraDirection);
        
        // Use specific lookAt point if provided, otherwise look at location position
        const lookAt = view.lookAt ? view.lookAt.clone() : lookAtPos;
        
        camera.animateTo(cameraPos, lookAt, 1000, controls);
      } else {
        // Default behavior for takeoffs or when no location is provided
        const offset = 3000;
        const cameraPos = position.clone().add(new THREE.Vector3(offset, offset, offset));
        camera.animateTo(cameraPos, lookAtPos, 1000, controls);
      }
    };

    // Setup renderers and containers
    const labelRenderer = setupLabelRenderer();
    const popupContainer = setupPopupContainer();
    console.log('Initialized popup container:', popupContainer); // Debug log

    // Create markers
    const markers = locations.reduce((allMarkers, location) => {
      // Create location marker
      const locationMarker = createMarker(
        location.position,
        location.title,
        location.description,
        [],
        false, // isTakeoff = false
        scene,
        popupContainer,
        navigateTo,
        location,  // Pass the location object
        camera     // Pass the camera
      );
      console.log('Created location marker:', {
        title: location.title,
        isTakeoff: locationMarker.isTakeoff,
        pinType: locationMarker.pin.userData.type
      });

      // Create takeoff markers
      const takeoffMarkers = location.takeoffs.map(takeoff => {
        return createMarker(
          takeoff.position,
          takeoff.title,
          takeoff.description,
          takeoff.mediaItems,
          true, // isTakeoff = true
          scene,
          popupContainer,
          navigateTo,
          location,  // Pass the location object
          camera     // Pass the camera
        );
      });

      return [...allMarkers, locationMarker, ...takeoffMarkers];
    }, [] as Marker[]);

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
        console.log('Canvas clicked', event);
        onMouseMove(event);
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          scene.children.filter(obj => obj.visible)
        );
        
        const clickedObject = intersects.find(i => i.object.userData.clickable)?.object;
        if (clickedObject) {
          if (clickedObject.userData.type === 'landing') {
            clickedObject.userData.showPopup();
          } else {
            const marker = markers.find(m => m.pin === clickedObject);
            marker?.showPopup();
          }
        }
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

      // Update marker visibility
      markers.forEach(marker => {
        const distance = camera.position.distanceTo(marker.pin.position);
        const shouldBeVisible = marker.isTakeoff 
          ? distance < VISIBILITY_THRESHOLDS.TAKEOFF_PIN
          : distance > VISIBILITY_THRESHOLDS.LOCATION_PIN;
        marker.setVisibility(shouldBeVisible);
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
        markers.find(m => m.pin === hoveredObject)?.unhoverAnimation.start();
        markers.find(m => m.pin === hoveredMarker)?.hoverAnimation.start();
        hoveredObject = hoveredMarker || null;
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
      const buttons = locations.map(location => (
        <div key={location.id}>
          <button onClick={() => navigateTo(location.position, location)}>
            {location.title}
          </button>
        </div>
      ));
      root.render(<div className="points">{buttons}</div>);
    };

    // Initialize
    createUI();
    window.addEventListener('resize', () => labelRenderer.setSize(window.innerWidth, window.innerHeight));
    navigateTo(locations[0].position);
    animate();
  },
};

export default FlyZones;
