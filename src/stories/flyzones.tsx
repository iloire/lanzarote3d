import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import locations from "./locations/lanzarote";
import media from "./locations/media";
import VideoFrame from "../components/video-frame";
import { StoryOptions } from "./types";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const FlyZones = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls } = options;

    const navigateTo = (point: THREE.Vector3, lookAt: THREE.Vector3) => {
      camera.animateTo(point, lookAt, 1000, controls, () => {
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

    const createLocationMarker = (location: typeof locations[0]) => {
      // Find all media for this location (since there might be multiple)
      const locationMediaItems = media.filter(m => m.id === location.id);
      
      // Create pin geometry
      const pinGeometry = new THREE.CylinderGeometry(0, 210, 1200, 1102, 10);
      const pinMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0x440000,
        transparent: true,
        opacity: 0.8
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      
      pin.position.copy(location.position);
      pin.position.y += 40;
      pin.rotation.x = Math.PI;

      // Add bouncing animation
      const startY = pin.position.y;
      new TWEEN.Tween(pin.position)
        .to({ y: startY + 200 }, 1000)
        .easing(TWEEN.Easing.Bounce.InOut)
        .repeat(Infinity)
        .yoyo(true)
        .start();

      // Add hover animation
      const hoverAnimation = new TWEEN.Tween(pin.material)
        .to({ opacity: 1, emissive: new THREE.Color(0xff0000) }, 200);
      const unhoverAnimation = new TWEEN.Tween(pin.material)
        .to({ opacity: 0.8, emissive: new THREE.Color(0x440000) }, 200);

      // Create label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'marker-label';
      labelDiv.textContent = location.title;
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
            <h2>${location.title}</h2>
            <p>${location.description || 'No description available'}</p>
            ${locationMediaItems.map(mediaItem => {
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

      return { pin, hoverAnimation, unhoverAnimation, showPopup };
    };

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
        const locationMarker = locationMarkers.find(m => m.pin === hoveredObject);
        locationMarker?.showPopup();
      }
    });

    const locationMarkers = locations.map(location => {
      return createLocationMarker(location);
    });

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    const buttons = locations.map((location) => (
      <button key={location.title} onClick={() => navigateTo(location.lookFrom, location.lookAt)}>
        {location.title}sadf asdf d
      </button>
    ));
    root.render(<div className="points">{buttons}</div>);

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


    const initial = locations[0];
    navigateTo(initial.lookFrom, initial.lookAt);

    const animate = () => {
      TWEEN.update();
      
      // Update raycaster
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      
      // Handle hover states
      const hoveredMarker = intersects.find(i => i.object.userData.hoverable)?.object;
      if (hoveredMarker !== hoveredObject) {
        if (hoveredObject) {
          const oldMarker = locationMarkers.find(m => m.pin === hoveredObject);
          oldMarker?.unhoverAnimation.start();
        }
        if (hoveredMarker) {
          const newMarker = locationMarkers.find(m => m.pin === hoveredMarker);
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

    animate();
  },
};

export default FlyZones;
