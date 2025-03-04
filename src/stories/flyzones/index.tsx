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
  setupPopupContainer
} from './helpers';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls } = options;

    const navigateTo = (position: THREE.Vector3, showTakeoffs: boolean = false) => {
      const lookAtPos = position.clone();
      const offset = showTakeoffs ? 3000 : 20000;
      const cameraPos = position.clone().add(new THREE.Vector3(offset, offset, offset));
      camera.animateTo(cameraPos, lookAtPos, 1000, controls);
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
        navigateTo
      );
      console.log('Created location marker:', {
        title: location.title,
        isTakeoff: locationMarker.isTakeoff,
        pinType: locationMarker.pin.userData.type
      });

      // Create takeoff markers
      const takeoffMarkers = location.takeoffs.map(takeoff => {
        const marker = createMarker(
          takeoff.position,
          takeoff.title,
          takeoff.description,
          takeoff.mediaItems,
          true, // isTakeoff = true
          scene,
          popupContainer,
          navigateTo
        );
        console.log('Created takeoff marker:', {
          title: takeoff.title,
          isTakeoff: marker.isTakeoff,
          pinType: marker.pin.userData.type
        });
        return marker;
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
        // Only intersect with visible objects
        const intersects = raycaster.intersectObjects(
          scene.children.filter(obj => obj.visible)
        );
        
        console.log('Click intersects:', intersects.map(i => ({
          type: i.object.userData.type,
          isTakeoff: i.object.userData.isTakeoff,
          visible: i.object.visible
        })));
        
        const clickedMarker = intersects.find(i => i.object.userData.hoverable)?.object;
        if (clickedMarker) {
          console.log('Clicked on marker:', {
            type: clickedMarker.userData.type,
            isTakeoff: clickedMarker.userData.isTakeoff,
            visible: clickedMarker.visible
          });
          const marker = markers.find(m => m.pin === clickedMarker);
          marker?.showPopup();
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
          ? distance < TAKEOFF_VISIBILITY_THRESHOLD
          : distance > TAKEOFF_VISIBILITY_THRESHOLD;
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
          <button onClick={() => navigateTo(location.position, true)}>
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
