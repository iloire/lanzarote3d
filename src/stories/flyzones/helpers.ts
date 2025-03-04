import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Media } from "./locations";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Constants
export const TAKEOFF_VISIBILITY_THRESHOLD = 15000;

export const PIN_COLORS = {
  location: { main: 0xff0000, emissive: 0x440000 },
  takeoff: { main: 0x000000, emissive: 0x000044 },
};

export const PIN_SIZES = {
  location: { radius: 300, height: 1500 },
  takeoff: { radius: 150, height: 800 },
};

export const PIN_FADE_DURATION = 200;

export const createPinMesh = (isTakeoff: boolean) => {
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

export const createBounceAnimation = (pin: THREE.Mesh, isTakeoff: boolean) => {
  const startY = pin.position.y;
  const bounceHeight = isTakeoff ? 100 : 200;
  return new TWEEN.Tween(pin.position)
    .to({ y: startY + bounceHeight }, 1000)
    .easing(TWEEN.Easing.Bounce.InOut)
    .repeat(Infinity)
    .yoyo(true)
    .start();
};

export const createHoverAnimations = (pin: THREE.Mesh, isTakeoff: boolean) => {
  const colors = isTakeoff ? PIN_COLORS.takeoff : PIN_COLORS.location;
  return {
    hover: new TWEEN.Tween(pin.material)
      .to({ opacity: 1, emissive: new THREE.Color(colors.main) }, 200),
    unhover: new TWEEN.Tween(pin.material)
      .to({ opacity: 0.8, emissive: new THREE.Color(colors.emissive) }, 200)
  };
};

export const createLabel = (title: string) => {
  const labelDiv = document.createElement('div');
  labelDiv.className = 'marker-label';
  labelDiv.textContent = title;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 600, 0);
  return label;
};

export const createPopupContent = (title: string, description: string, mediaItems: Media[]) => {
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

export type Marker = {
  pin: THREE.Mesh;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  isTakeoff: boolean;
  setVisibility: (visible: boolean) => void;
};

export const createMarker = (
  position: THREE.Vector3,
  title: string,
  description: string,
  mediaItems: Media[],
  isTakeoff: boolean,
  scene: THREE.Scene,
  popupContainer: HTMLDivElement,
  navigateTo: (position: THREE.Vector3, showTakeoffs: boolean) => void
): Marker => {
  console.log('createMarker', isTakeoff, title, description);
  const pin = createPinMesh(isTakeoff);
  pin.position.copy(position);
  pin.position.y += isTakeoff ? 20 : 40;
  pin.rotation.x = Math.PI;
  pin.visible = !isTakeoff;
  pin.userData.hoverable = true;
  pin.userData.clickable = true;

  const { hover, unhover } = createHoverAnimations(pin, isTakeoff);
  
  const label = createLabel(title);
  pin.add(label);
  scene.add(pin);

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
          label.visible = visible;
        });
    }
  };

  const showPopup = () => {
    if (isTakeoff) {
      popupContainer.style.display = 'block';
      popupContainer.innerHTML = createPopupContent(title, description, mediaItems);
      popupContainer.querySelector('.close-popup')?.addEventListener('click', 
        () => { popupContainer.style.display = 'none'; }
      );
    } else {
      navigateTo(position, true);
    }
  };

  return { pin, hoverAnimation: hover, unhoverAnimation: unhover, showPopup, isTakeoff, setVisibility };
};

export const setupLabelRenderer = () => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(labelRenderer.domElement);
  return labelRenderer;
};

export const setupPopupContainer = () => {
  const container = document.createElement('div');
  container.style.display = 'none';
  container.className = 'location-popup';
  document.body.appendChild(container);
  return container;
}; 