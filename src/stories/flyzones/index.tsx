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
  PIN_FADE_DURATION,
  createPinMesh,
  createLabel,
  createPopupContent,
  createHoverAnimations,
  createMarker,
  type Marker
} from './helpers';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls } = options;
    
    // Setup functions
    const setupLabelRenderer = () => {
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelRenderer.domElement.style.pointerEvents = 'none';
      document.body.appendChild(labelRenderer.domElement);
      return labelRenderer;
    };

    const setupPopupContainer = () => {
      const container = document.createElement('div');
      container.style.display = 'none';
      container.className = 'location-popup';
      document.body.appendChild(container);
      return container;
    };

    const navigateTo = (position: THREE.Vector3, showTakeoffs: boolean = false) => {
      const lookAtPos = position.clone();
      const offset = showTakeoffs ? 5000 : 20000;
      const cameraPos = position.clone().add(new THREE.Vector3(offset, offset, offset));
      camera.animateTo(cameraPos, lookAtPos, 1000, controls);
    };

    // Setup renderers and containers
    const labelRenderer = setupLabelRenderer();
    const popupContainer = setupPopupContainer();

    // Create markers
    const markers = locations.reduce((allMarkers, location) => [
      ...allMarkers,
      createMarker(
        location.position, 
        location.title, 
        location.description, 
        [], 
        false,
        scene,
        popupContainer,
        navigateTo
      ),
      ...location.takeoffs.map(takeoff => 
        createMarker(
          takeoff.position, 
          takeoff.title, 
          takeoff.description, 
          takeoff.mediaItems, 
          true,
          scene,
          popupContainer,
          navigateTo
        )
      )
    ], [] as Marker[]);

    console.log(markers);
    

    // Setup interaction
    const setupInteraction = () => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let hoveredObject: THREE.Object3D | null = null;

      window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      });

      window.addEventListener('click', () => {
        if (hoveredObject) {
          markers.find(m => m.pin === hoveredObject)?.showPopup();
        }
      });

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
          ? distance < TAKEOFF_VISIBILITY_THRESHOLD  // Show takeoffs only when CLOSE
          : distance >= TAKEOFF_VISIBILITY_THRESHOLD; // Show locations only when FAR
        marker.setVisibility(shouldBeVisible);
        console.log(shouldBeVisible, marker.isTakeoff ? 'takeoff' : 'location', distance);

      });
      
      // Update hover states
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
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
