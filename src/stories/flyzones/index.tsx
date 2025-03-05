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
  type Marker,
  setupPopupContainer,
  VISIBILITY_THRESHOLDS,
  MarkerType,
  createCustomFlyZone
} from './helpers';

import {
  createMarker,
  setupLabelRenderer,
  createPinMesh,
  createHoverAnimations,
  createWindArrow,
  createLabel,
  createFadeAnimation,
  createVisibilityHandler,
  createPopupHandler,
  setupPinBasics
} from './helpers';

import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import { 
  getConfig, 
  updateConfig, 
  defaultConfig 
} from './config';

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

    const navigateTo = (position: THREE.Vector3, location?: Location) => {
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

    // Create a marker
    const createMarker = async (
      position: THREE.Vector3,
      title: string,
      description: string,
      mediaItems: any[],
      type: MarkerType,
      scene: THREE.Scene,
      popupContainer: HTMLDivElement,
      navigateTo: (position: THREE.Vector3, location?: Location) => void,
      location: Location | undefined,
      camera: THREE.Camera,
      conditions?: any[]
    ): Promise<Marker> => {
      const pin = await createPinMesh(type);
      setupPinBasics(pin, position, type);
      
      // Add wind arrow for takeoffs
      if (type === MarkerType.TAKEOFF && conditions && conditions.length > 0) {
        const bestConditions = conditions.reduce((best, current) => 
          current.rating > best.rating ? current : best, conditions[0]
        );
        const windArrow = createWindArrow(bestConditions.direction.ideal);
        pin.add(windArrow);
      }
      
      scene.add(pin);

      // Add label
      const label = createLabel(title);
      pin.add(label);

      // Setup animations
      const { hover, unhover } = createHoverAnimations(pin, type === MarkerType.TAKEOFF);
      const fadeAnimation = createFadeAnimation(pin);

      // Create visibility handler
      const setVisibility = createVisibilityHandler({
        pin,
        label,
        type,
        position,
        camera,
        fadeAnimation
      });

      // Create popup handler
      const showPopup = createPopupHandler({
        type,
        title,
        description,
        mediaItems,
        position,
        location,
        popupContainer,
        navigateTo
      });

      return {
        pin,
        type,
        hoverAnimation: hover,
        unhoverAnimation: unhover,
        showPopup,
        setVisibility,
        flyzone: undefined  // Will be set by caller if needed
      };
    };

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
        console.log('Canvas clicked', event);
        onMouseMove(event);
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          scene.children.filter(obj => obj.visible),
          true  // Set to true to check descendants
        );
        
        const clickedObject = intersects.find(i => i.object.userData.clickable)?.object;
        if (clickedObject) {
          // Find the marker by traversing up the object hierarchy
          const findRootMarker = (obj: THREE.Object3D): Marker | undefined => {
            // Check if this object is a root marker
            const marker = markers.find(m => m.pin === obj);
            if (marker) return marker;
            
            // If not, check its parent
            if (obj.parent) {
              return findRootMarker(obj.parent);
            }
            
            return undefined;
          };

          const marker = findRootMarker(clickedObject);
          if (marker) {
            marker.showPopup();
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
