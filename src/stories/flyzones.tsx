import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import locations from "./locations/lanzarote";
import VideoFrame from "../components/video-frame";
import { StoryOptions } from "./types";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Takeoff, Media, Location } from "./locations";

// Types
type Marker = {
  pin: THREE.Mesh;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  isTakeoff: boolean;
  setVisibility: (visible: boolean) => void;
};

// Constants
const TAKEOFF_VISIBILITY_THRESHOLD = 15000;
const LOCATION_VISIBILITY_THRESHOLD = 10000; // New constant for location pins
const PIN_COLORS = {
  location: { main: 0xff0000, emissive: 0x440000 },
  takeoff: { main: 0x000000, emissive: 0x000044 },
};
const PIN_SIZES = {
  location: { radius: 300, height: 1500 },
  takeoff: { radius: 150, height: 800 },
};
const PIN_FADE_DURATION = 200; // milliseconds

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

    const createPinMesh = (isTakeoff: boolean) => {
      const colors = isTakeoff ? PIN_COLORS.takeoff : PIN_COLORS.location;
      const sizes = isTakeoff ? PIN_SIZES.takeoff : PIN_SIZES.location;
      
      const geometry = new THREE.CylinderGeometry(0, sizes.radius, sizes.height, 12, 1);
      const material = new THREE.MeshPhongMaterial({ 
        color: colors.main,
        emissive: colors.emissive,
        transparent: true,
        opacity: 0.8
      });
      return new THREE.Mesh(geometry, material);
    };

    const createBounceAnimation = (pin: THREE.Mesh, isTakeoff: boolean) => {
      const startY = pin.position.y;
      const bounceHeight = isTakeoff ? 100 : 200;
      return new TWEEN.Tween(pin.position)
        .to({ y: startY + bounceHeight }, 1000)
        .easing(TWEEN.Easing.Bounce.InOut)
        .repeat(Infinity)
        .yoyo(true)
        .start();
    };

    const createHoverAnimations = (pin: THREE.Mesh, isTakeoff: boolean) => {
      const colors = isTakeoff ? PIN_COLORS.takeoff : PIN_COLORS.location;
      return {
        hover: new TWEEN.Tween(pin.material)
          .to({ opacity: 1, emissive: new THREE.Color(colors.main) }, 200),
        unhover: new TWEEN.Tween(pin.material)
          .to({ opacity: 0.8, emissive: new THREE.Color(colors.emissive) }, 200)
      };
    };

    const createLabel = (title: string) => {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'marker-label';
      labelDiv.textContent = title;
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, 600, 0);
      return label;
    };

    const createPopupContent = (title: string, description: string, mediaItems: Media[]) => {
      return `
        <div class="popup-content">
          <h2>${title}</h2>
          <p>${description || 'No description available'}</p>
          ${mediaItems.map(mediaItem => 
            mediaItem.type === 'image' 
              ? `<img src="${mediaItem.url}" alt="${mediaItem.title}">`
              : `<video controls><source src="${mediaItem.url}" type="video/mp4"></video>`
          ).join('')}
          <button class="close-popup">Close</button>
        </div>
      `;
    };

    const navigateTo = (position: THREE.Vector3, showTakeoffs: boolean = false) => {
      const lookAtPos = position.clone();
      const offset = showTakeoffs ? 5000 : 20000; // Adjusted distances
      const cameraPos = position.clone().add(new THREE.Vector3(offset, offset, offset));
      camera.animateTo(cameraPos, lookAtPos, 1000, controls);
    };

    const createMarker = (
      position: THREE.Vector3, 
      title: string, 
      description: string,
      mediaItems: Media[],
      isTakeoff: boolean
    ): Marker => {
      const pin = createPinMesh(isTakeoff);
      pin.position.copy(position);
      pin.position.y += isTakeoff ? 20 : 40;
      pin.rotation.x = Math.PI;
      pin.visible = !isTakeoff;  // Initially show only location pins
      pin.userData.hoverable = true;
      pin.userData.clickable = true;

      const { hover, unhover } = createHoverAnimations(pin, isTakeoff);
      
      // Create and add label
      const label = createLabel(title);
      pin.add(label);
      scene.add(pin);

      // Create fade animation
      const fadeAnimation = new TWEEN.Tween(pin.material)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .duration(PIN_FADE_DURATION);

      const setVisibility = (visible: boolean) => {
        if (visible !== pin.visible) {
          fadeAnimation.stop();
          fadeAnimation
            .to({ opacity: visible ? 0.8 : 0 }, PIN_FADE_DURATION)
            .start()
            .onComplete(() => {
              pin.visible = visible;
              label.visible = visible;  // Make label visibility match pin visibility
            });
        }
      };

      const showPopup = () => {
        if (isTakeoff) {
          // Show media popup only for takeoff pins
          popupContainer.style.display = 'block';
          popupContainer.innerHTML = createPopupContent(title, description, mediaItems);
          popupContainer.querySelector('.close-popup')?.addEventListener('click', 
            () => { popupContainer.style.display = 'none'; }
          );
        } else {
          // Zoom in when location pin is clicked
          navigateTo(position, true);
        }
      };

      return { 
        pin, 
        hoverAnimation: hover, 
        unhoverAnimation: unhover, 
        showPopup, 
        isTakeoff,
        setVisibility 
      };
    };

    // Setup renderers and containers
    const labelRenderer = setupLabelRenderer();
    const popupContainer = setupPopupContainer();

    // Create markers
    const markers = locations.reduce((allMarkers, location) => [
      ...allMarkers,
      createMarker(location.position, location.title, location.description, [], false),
      ...location.takeoffs.map(takeoff => 
        createMarker(takeoff.position, takeoff.title, takeoff.description, takeoff.mediaItems, true)
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
          <button onClick={() => navigateTo(location.position)}>
            {location.title}
          </button>
          <div style={{ marginLeft: '20px' }}>
            {location.takeoffs.map(takeoff => (
              <button 
                key={takeoff.id} 
                onClick={() => navigateTo(takeoff.position, true)}
              >
                {takeoff.title}
              </button>
            ))}
          </div>
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
