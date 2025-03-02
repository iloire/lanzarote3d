import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import locations from "./locations/lanzarote";
import VideoFrame from "../components/video-frame";
import { StoryOptions } from "./types";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Takeoff, Media } from "./locations";

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls } = options;

    // Add distance threshold for showing takeoff pins
    const TAKEOFF_VISIBILITY_THRESHOLD = 2000;
    
    const navigateTo = (position: THREE.Vector3, showTakeoffs: boolean = false) => {
      const lookAtPos = position.clone();
      const cameraPos = position.clone().add(
        showTakeoffs 
          ? new THREE.Vector3(500, 500, 500) // Closer view for takeoffs
          : new THREE.Vector3(2000, 2000, 2000) // Further view for locations
      );
      camera.animateTo(cameraPos, lookAtPos, 1000, controls, () => {
        console.log("done");
      });
    };

    // Setup CSS2D renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    // Create popup container
    const popupContainer = document.createElement('div');
    popupContainer.style.display = 'none';
    popupContainer.className = 'location-popup';
    document.body.appendChild(popupContainer);

    // Create marker for a location or takeoff
    const createMarker = (
      position: THREE.Vector3, 
      title: string, 
      description: string,
      mediaItems: Media[],
      isTakeoff: boolean
    ) => {
      const pinGeometry = new THREE.CylinderGeometry(
        0, 
        isTakeoff ? 150 : 300, // Smaller pins for takeoffs
        isTakeoff ? 800 : 1500, // Shorter pins for takeoffs
        12, 
        1
      );
      const pinMaterial = new THREE.MeshPhongMaterial({ 
        color: isTakeoff ? 0x0000ff : 0xff0000, // Blue for takeoffs, red for locations
        emissive: isTakeoff ? 0x000044 : 0x440000,
        transparent: true,
        opacity: 0.8
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      
      pin.position.copy(position);
      pin.position.y += isTakeoff ? 20 : 40;
      pin.rotation.x = Math.PI;
      pin.visible = !isTakeoff; // Initially hide takeoff pins

      // Add bouncing animation
      const startY = pin.position.y;
      new TWEEN.Tween(pin.position)
        .to({ y: startY + (isTakeoff ? 100 : 200) }, 1000)
        .easing(TWEEN.Easing.Bounce.InOut)
        .repeat(Infinity)
        .yoyo(true)
        .start();

      // Add hover animation
      const hoverAnimation = new TWEEN.Tween(pin.material)
        .to({ opacity: 1, emissive: new THREE.Color(isTakeoff ? 0x0000ff : 0xff0000) }, 200);
      const unhoverAnimation = new TWEEN.Tween(pin.material)
        .to({ opacity: 0.8, emissive: new THREE.Color(isTakeoff ? 0x000044 : 0x440000) }, 200);

      // Create label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'marker-label';
      labelDiv.textContent = title;
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, 600, 0);
      pin.add(label);

      // Make pin interactive
      pin.userData.hoverable = true;
      pin.userData.clickable = true;

      // Create popup content
      const showPopup = () => {
        popupContainer.style.display = 'block';
        popupContainer.innerHTML = `
          <div class="popup-content">
            <h2>${title}</h2>
            <p>${description || 'No description available'}</p>
            ${mediaItems.map(mediaItem => {
              if (mediaItem.type === 'image') {
                return `<img src="${mediaItem.url}" alt="${mediaItem.title}">`;
              } else if (mediaItem.type === 'video') {
                return `
                  <video controls>
                    <source src="${mediaItem.url}" type="video/mp4">
                  </video>
                `;
              }
              return '';
            }).join('')}
            <button class="close-popup">Close</button>
          </div>
        `;

        const closeButton = popupContainer.querySelector('.close-popup');
        closeButton?.addEventListener('click', () => {
          popupContainer.style.display = 'none';
        });
      };

      // Add to scene
      scene.add(pin);

      return { pin, hoverAnimation, unhoverAnimation, showPopup, isTakeoff };
    };

    // Create all markers
    const markers = locations.reduce((allMarkers, location) => {
      // Create location marker
      const locationMarker = createMarker(
        location.position,
        location.title,
        location.description,
        [], // Locations don't have direct media items
        false
      );
      
      // Create takeoff markers for this location
      const takeoffMarkers = location.takeoffs.map(takeoff => 
        createMarker(
          takeoff.position,
          takeoff.title,
          takeoff.description,
          takeoff.mediaItems,
          true
        )
      );

      return [...allMarkers, locationMarker, ...takeoffMarkers];
    }, [] as ReturnType<typeof createMarker>[]);

    // Create buttons for locations
    const rootElement = document.getElementById("legend-points");
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

    // Setup raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject: THREE.Object3D | null = null;

    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', () => {
      if (hoveredObject) {
        const locationMarker = markers.find(m => m.pin === hoveredObject);
        locationMarker?.showPopup();
      }
    });

    // const meshes = await Promise.all(media.map(async (media) => {
    //   const videoFrame = new VideoFrame({
    //     imgUrl: media.imgUrl,
    //     videoUrl: media.videoUrl,
    //     camera: camera
    //   });
    //   const mesh = await videoFrame.load();
    //   const scale = 300;
    //   mesh.scale.set(scale, scale, scale);
    //   mesh.position.copy(media.position);
    //   scene.add(mesh);
    //   return mesh;
    // }));

    // Update visibility based on camera distance
    const updateMarkersVisibility = () => {
      markers.forEach(marker => {
        if (marker.isTakeoff) {
          const distance = camera.position.distanceTo(marker.pin.position);
          marker.pin.visible = distance < TAKEOFF_VISIBILITY_THRESHOLD;
        }
      });
    };

    // Update animate function
    const animate = () => {
      TWEEN.update();
      updateMarkersVisibility();
      
      // Update raycaster
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      
      // Handle hover states
      const hoveredMarker = intersects.find(i => i.object.userData.hoverable)?.object;
      if (hoveredMarker !== hoveredObject) {
        if (hoveredObject) {
          const oldMarker = markers.find(m => m.pin === hoveredObject);
          oldMarker?.unhoverAnimation.start();
        }
        if (hoveredMarker) {
          const newMarker = markers.find(m => m.pin === hoveredMarker);
          newMarker?.hoverAnimation.start();
        }
        hoveredObject = hoveredMarker || null;
      }

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    // Handle window resize
    window.addEventListener('resize', () => {
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start with overview of first location
    const initial = locations[0];
    navigateTo(initial.position);

    animate();
  },
};

export default FlyZones;
