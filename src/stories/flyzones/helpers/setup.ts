import * as THREE from "three";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { MarkerType } from './types';
import { Marker } from './types';
import { Location, Media } from '../locations';
import { createLabel, createPopupContent } from './popup';
import { createPinMesh, setupPinBasics, createHoverAnimations, createFadeAnimation, createVisibilityHandler } from './marker';
import { createPopupHandler } from './popup';
import { createWindArrow } from './flyzone';
export const setupLabelRenderer = () => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(labelRenderer.domElement);
  return labelRenderer;
};

export const createMarker = async (
  position: THREE.Vector3,
  title: string,
  description: string,
  mediaItems: Media[],
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

