import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { MarkerType } from '../helpers/types';
import { PIN_COLORS, PIN_SIZES, PIN_FADE_DURATION } from '../helpers/constants';
import Paraglider from '../../../components/paraglider';
import { PilotHeadType } from '../../../components/parts/pilot-head';
import { createLabel, createPopupContent, createPopupHandler } from '../helpers/popup';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Location, Media } from '../locations';
import { createWindArrow } from '../helpers/flyzone';

export const setupLabelRenderer = () => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(labelRenderer.domElement);
  return labelRenderer;
};

export class MarkerObject {
  pin: THREE.Object3D;
  type: MarkerType;
  hoverAnimation: () => void;
  unhoverAnimation: () => void;
  showPopup: () => void;
  setVisibility: (visible: boolean) => void;
  flyzone?: THREE.Object3D;
  
  constructor(pin: THREE.Object3D, type: MarkerType) {
    this.pin = pin;
    this.type = type;
    this.hoverAnimation = () => {};
    this.unhoverAnimation = () => {};
    this.showPopup = () => {};
    this.setVisibility = () => {};
  }
  
  get userData() {
    return this.pin.userData;
  }
  
  get visible() {
    return this.pin.visible;
  }
  
  set visible(value: boolean) {
    this.pin.visible = value;
  }
  
  traverse(callback: (object: THREE.Object3D) => void) {
    this.pin.traverse(callback);
  }
}

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
): Promise<MarkerObject> => {
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

  const marker = new MarkerObject(pin, type);
  marker.hoverAnimation = hover;
  marker.unhoverAnimation = unhover;
  marker.showPopup = showPopup;
  marker.setVisibility = setVisibility;
  marker.flyzone = undefined;  // Will be set by caller if needed

  return marker;
};

export const createPinMesh = async (type: MarkerType) => {
  const colors = PIN_COLORS[type];
  const sizes = PIN_SIZES[type];
  
  const geometry = new THREE.CylinderGeometry(sizes.radius/3, sizes.radius, sizes.height, 12, 1);
  const material = new THREE.MeshPhongMaterial({ 
    color: colors.main,
    emissive: colors.emissive,
    transparent: true,
    opacity: 0.8
  });

  const gliderOptions = {
    wingColor1: '#c30010',
    wingColor2: '#b100cd',
    breakColor: '#ffffff',
    lineFrontColor: '#ffffff',
    lineRearColor: '#ffffff',
    lineMiddleColor: '#ffffff',
    riserColor: '#ffffff',
    pilotOptions: {
      suitColor: '#0000ff',
      headType: PilotHeadType.Default,
      helmetOptions: {
        color: '#ffffff',
        color2: '#cccccc',
        color3: '#999999'
      }
    },
    carabinerColor: '#333',
  };

  const pilotOptions = {
    suitColor: '#0000ff',
    headType: PilotHeadType.Default,
    helmetOptions: {
      color: '#ffffff',
      color2: '#cccccc',
      color3: '#999999'
    }
  };

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.add(new THREE.Vector3(0, sizes.height/2, 0));
  const group = new THREE.Group();
  group.add(mesh);

  if (type === MarkerType.TAKEOFF) {
    const paraglider = await new Paraglider({ glider: gliderOptions, pilot: pilotOptions }).load();
    const scale = 0.1;
    paraglider.scale.set(scale, scale, scale);
    paraglider.position.y = 160;
    group.add(paraglider);
  }

  return group;
};

export const setupPinBasics = (pin: THREE.Object3D, position: THREE.Vector3, type: MarkerType) => {
  pin.position.copy(position);
  pin.userData.type = type;
  pin.userData.hoverable = true;
  pin.userData.clickable = true;
  
  // Make sure all children inherit the clickable property
  pin.traverse(child => {
    if (child !== pin) {
      child.userData.type = type;
      child.userData.clickable = true;
      // We don't set hoverable on children to avoid multiple hover events
    }
  });
};

export const createHoverAnimations = (pin: THREE.Object3D, isTakeoff: boolean) => {
  if (isMeshWithMaterial(pin)) {
    const colors = isTakeoff ? PIN_COLORS[MarkerType.TAKEOFF] : PIN_COLORS[MarkerType.LOCATION];
    return {
      hover: new TWEEN.Tween(pin.material)
        .to({ opacity: 1, emissive: new THREE.Color(colors.main) }, 200),
      unhover: new TWEEN.Tween(pin.material)
        .to({ opacity: 0.8, emissive: new THREE.Color(colors.emissive) }, 200)
    };
  }
  return {
    hover: new TWEEN.Tween({}).to({}, 0),
    unhover: new TWEEN.Tween({}).to({}, 0)
  };
};

export const createFadeAnimation = (pin: THREE.Object3D) => {
  const fadeTargets: { material: THREE.Material }[] = [];
  
  pin.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      fadeTargets.push({ material: child.material });
    }
  });
  
  return {
    fadeIn: new TWEEN.Tween({ opacity: 0 })
      .to({ opacity: 1 }, PIN_FADE_DURATION)
      .onUpdate(({ opacity }) => {
        fadeTargets.forEach(target => {
          if ('opacity' in target.material) {
            target.material.opacity = opacity;
          }
        });
      }),
    fadeOut: new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, PIN_FADE_DURATION)
      .onUpdate(({ opacity }) => {
        fadeTargets.forEach(target => {
          if ('opacity' in target.material) {
            target.material.opacity = opacity;
          }
        });
      })
  };
};

export const createVisibilityHandler = (params: {
  pin: THREE.Object3D,
  label: CSS2DObject,
  type: MarkerType,
  position: THREE.Vector3,
  camera: THREE.Camera,
  fadeAnimation: ReturnType<typeof createFadeAnimation>
}) => {
  return (visible: boolean) => {
    params.pin.visible = visible;
    params.label.visible = visible;

    if (visible) {
      params.fadeAnimation.fadeIn.start();
    } else {
      params.fadeAnimation.fadeOut.start();
    }
  };
};

const isMeshWithMaterial = (obj: THREE.Object3D): obj is THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> => {
  return obj instanceof THREE.Mesh && 'material' in obj;
};

// Add a simplified version of createMarker for landing markers
export const createSimpleMarker = async (
  position: THREE.Vector3,
  type: MarkerType
): Promise<MarkerObject> => {
  const pin = await createPinMesh(type);
  setupPinBasics(pin, position, type);
  
  // Setup animations
  const { hover, unhover } = createHoverAnimations(pin, type === MarkerType.TAKEOFF);
  
  // Create a simple marker using the MarkerObject class
  const marker = new MarkerObject(pin, type);
  marker.hoverAnimation = hover;
  marker.unhoverAnimation = unhover;
  marker.showPopup = () => {};
  marker.setVisibility = (visible: boolean) => {
    pin.visible = visible;
    pin.traverse(child => {
      if (child !== pin) {
        child.visible = visible;
      }
    });
  };
  
  return marker;
}; 