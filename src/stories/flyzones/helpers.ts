import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Media } from "./locations";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { FlyZoneShape, LandingSpot, Location, WindCondition, FlightPhase } from "./locations/index";
import Paraglider from '../../components/paraglider';
import { PilotHeadType } from "../../components/parts/pilot-head";

// Constants
export const TAKEOFF_VISIBILITY_THRESHOLD = 15000;

// Add MarkerType enum
export enum MarkerType {
  LOCATION = 'location',
  TAKEOFF = 'takeoff',
  LANDING = 'landing'
}

// Update PIN_COLORS to use MarkerType
export const PIN_COLORS = {
  [MarkerType.LOCATION]: { main: 0xff0000, emissive: 0x440000 },
  [MarkerType.TAKEOFF]: { main: 0x00ff00, emissive: 0x000044 },
  [MarkerType.LANDING]: { main: 0x0000ff, emissive: 0x004400 },
};

// Update PIN_SIZES to use MarkerType
export const PIN_SIZES = {
  [MarkerType.LOCATION]: { radius: 300, height: 1500 },
  [MarkerType.TAKEOFF]: { radius: 100, height: 150 },
  [MarkerType.LANDING]: { radius: 300, height: 50 },
};

export const PIN_FADE_DURATION = 200;

export const FLYZONE_COLORS = {
  safe: 0x00ff00,
  caution: 0xffff00,
  danger: 0xff0000
};

export const LANDING_COLORS = {
  primary: 0x00ff00,
  secondary: 0xffff00,
  emergency: 0xff0000
};

// Update visibility thresholds
export const VISIBILITY_THRESHOLDS = {
  LOCATION_PIN: 15000,    // Show location pin when far (> 15000)
  DETAIL_VIEW: 15000,     // Switch to detailed view when closer than this
};

export const createPinMesh = async (type: MarkerType) => {
  const colors = PIN_COLORS[type];
  const sizes = PIN_SIZES[type];
  
  const geometry = new THREE.CylinderGeometry(0, sizes.radius, sizes.height, 12, 1);
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
    lineBackColor: '#ffffff',
    inletsColor: '#333333',
    numeroCajones: 40,
    bandLength: 500,
    carabinersSeparationMM: 300
  };
  const pilotOptions = {
    head: {
      headType: PilotHeadType.Default,
      helmetOptions: {
        color: '#ffffff',
        color2: '#cccccc',
        color3: '#999999'
      }
    },
    carabinerColor: '#333',
  };

  const paragliderOptions = {
    glider: gliderOptions,
    pilot: pilotOptions
  }

  // Create pin or paraglider based on type
  const paraglider = await new Paraglider(paragliderOptions).load();
  const scale = 0.1;
  paraglider.scale.set(scale, scale, scale);
  paraglider.position.y = 160;

  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  if (type === MarkerType.TAKEOFF) {
    group.add(paraglider);
  }
  return group;
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
  // Return no-op animations for non-mesh objects
  return {
    hover: new TWEEN.Tween({}).to({}, 0),
    unhover: new TWEEN.Tween({}).to({}, 0)
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
  const mediaContent = mediaItems.map(mediaItem => 
    mediaItem.type === 'image' 
      ? `<img src="${mediaItem.url}" alt="${mediaItem.title || ''}">`
      : `<video controls><source src="${mediaItem.url}" type="video/mp4"></video>`
  ).join('');

  return `
    <div class="popup-content">
      <h2>${title}</h2>
      <p>${description || 'No description available'}</p>
      <div class="media-container">
        ${mediaContent}
      </div>
      <button class="close-popup">Close</button>
    </div>
  `;
};

// Update Marker type to handle both types
export type Marker = {
  pin: THREE.Object3D;  // More generic type to handle both Paraglider and Mesh
  type: MarkerType;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  setVisibility: (visible: boolean) => void;
  flyzone?: THREE.Object3D;
};

// Add type guard
const isMeshWithMaterial = (obj: THREE.Object3D): obj is THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> => {
  return obj instanceof THREE.Mesh && 'material' in obj;
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
  conditions?: WindCondition[]
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

// Helper functions
const setupPinBasics = (pin: THREE.Object3D, position: THREE.Vector3, type: MarkerType) => {
  pin.position.copy(position);
  pin.position.y += type === MarkerType.LOCATION ? 0 : 0;
  // pin.rotation.x = Math.PI;
  pin.visible = type === MarkerType.LOCATION;

  // Set userData for the group and all its children
  const setUserData = (obj: THREE.Object3D) => {
    obj.userData.hoverable = true;
    obj.userData.clickable = true;
    obj.userData.type = type;
    
    // Recursively set for children
    obj.children.forEach(setUserData);
  };
  setUserData(pin);

  // Set raycast for meshes
  if (pin instanceof THREE.Mesh) {
    pin.raycast = new THREE.Mesh().raycast;
  }
};

const createFadeAnimation = (pin: THREE.Object3D) => {
  if (isMeshWithMaterial(pin)) {
    return new TWEEN.Tween(pin.material)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .duration(PIN_FADE_DURATION);
  }
  // Return no-op animation for non-mesh objects
  return new TWEEN.Tween({}).to({}, 0);
};


// Update createVisibilityHandler
const createVisibilityHandler = (params: {
  pin: THREE.Object3D,  // More generic type
  label: CSS2DObject,
  type: MarkerType,
  position: THREE.Vector3,
  camera: THREE.Camera,
  fadeAnimation: TWEEN.Tween<any>
}) => {
  const { pin, label, type, position, camera, fadeAnimation } = params;

  return (visible: boolean) => {
    const distance = camera.position.distanceTo(position);
    const isDetailView = distance < VISIBILITY_THRESHOLDS.DETAIL_VIEW;
    
    pin.visible = type === MarkerType.LOCATION 
      ? visible && !isDetailView 
      : visible && isDetailView;
    label.visible = pin.visible;

    // Handle fade animation only for mesh pins
    if (isMeshWithMaterial(pin)) {
      if (pin.material.opacity !== (pin.visible ? 0.8 : 0)) {
        fadeAnimation.stop();
        fadeAnimation
          .to({ opacity: pin.visible ? 0.8 : 0 }, PIN_FADE_DURATION)
          .start();
      }
    }
  };
};

const createPopupHandler = (params: {
  type: MarkerType,
  title: string,
  description: string,
  mediaItems: Media[],
  position: THREE.Vector3,
  location: Location | undefined,
  popupContainer: HTMLDivElement,
  navigateTo: (position: THREE.Vector3, location?: Location) => void
}) => {
  const { type, title, description, mediaItems, position, location, popupContainer, navigateTo } = params;

  return () => {
    if (type === MarkerType.TAKEOFF || type === MarkerType.LANDING) {
      showDetailPopup(title, description, mediaItems, popupContainer);
    } else {
      navigateTo(position, location);
    }
  };
};

const showDetailPopup = (title: string, description: string, mediaItems: Media[], popupContainer: HTMLDivElement) => {
  popupContainer.style.display = 'block';
  popupContainer.innerHTML = createPopupContent(title, description, mediaItems);

  const closeButton = popupContainer.querySelector('.close-popup');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      popupContainer.style.display = 'none';
    });
  }
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
  // Remove existing popup container if it exists
  const existingContainer = document.querySelector('.location-popup');
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement('div');
  container.style.display = 'none';
  container.className = 'location-popup';
  // Add some debug styling to make sure it's visible
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  // Debug log when display changes
  const originalSetProperty = container.style.setProperty;
  container.style.setProperty = function(prop, value) {
    console.log(`Setting ${prop} to ${value}`);
    return originalSetProperty.call(this, prop, value);
  };

  return container;
};

export const createCustomFlyZone = (shape: FlyZoneShape) => {
  const group = new THREE.Group();
  
  // Create boxes for each phase
  const phases = Object.keys(shape.phases).map(key => ({
    id: key,
    ...shape.phases[key]
  }));
  
  phases.forEach((phase) => {
    // Create box geometry
    const boxGeometry = new THREE.BoxGeometry(
      phase.dimensions.width,
      phase.dimensions.height,
      phase.dimensions.length
    );
    
    // Create material with transparency and color based on phase type
    const color = new THREE.Color();
    switch (phase.type) {
      case 'takeoff':
        color.setHex(FLYZONE_COLORS.danger);
        break;
      case 'landing':
        color.setHex(FLYZONE_COLORS.caution);
        break;
      case 'ridge':
        color.setHex(FLYZONE_COLORS.safe);
        break;
      default:
        color.setHex(shape.color || FLYZONE_COLORS.safe);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    
    // Create box mesh
    const box = new THREE.Mesh(boxGeometry, material);
    box.position.copy(phase.position);
    
    // Add wireframe
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeometry),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      })
    );
    box.add(wireframe);
    
    // Add height indicator line
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      dashSize: 50,
      gapSize: 50,
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(phase.position.x, 0, phase.position.z),
      phase.position
    ]);

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    group.add(line);
    
    // Add connecting lines to next phases
    if (phase.nextPhases) {
      phase.nextPhases.forEach(nextPhaseId => {
        const nextPhase = shape.phases[nextPhaseId];
        if (nextPhase) {
          const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            phase.position,
            nextPhase.position
          ]);
          
          const connectionLine = new THREE.Line(
            connectionGeometry,
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.3
            })
          );
          group.add(connectionLine);
        }
      });
    }
    
    group.add(box);
  });
  
  return group;
};

export const createLandingSpotMarker = (
  landingSpot: LandingSpot,
  popupContainer: HTMLDivElement
) => {
  // Create a flat circle with an arrow pointing down
  const circleGeometry = new THREE.CircleGeometry(200, 32);
  const arrowGeometry = new THREE.ConeGeometry(100, 200, 32);
  
  const material = new THREE.MeshBasicMaterial({
    color: LANDING_COLORS[landingSpot.safety],
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const circle = new THREE.Mesh(circleGeometry, material);
  circle.rotation.x = -Math.PI / 2;
  
  const arrow = new THREE.Mesh(arrowGeometry, material);
  arrow.position.y = 100;
  
  const group = new THREE.Group();
  group.add(circle);
  group.add(arrow);
  group.position.copy(landingSpot.position);
  
  // Add label
  const label = createLabel(landingSpot.title);
  label.position.y = 300;
  group.add(label);

  // Add user data for interaction
  circle.userData.hoverable = true;
  circle.userData.clickable = true;
  circle.userData.type = 'landing';
  circle.userData.landingSpot = landingSpot;

  // Add click handler
  const showPopup = () => {
    console.log('Showing landing spot popup for:', landingSpot.title);
    popupContainer.style.display = 'block';
    const content = createPopupContent(
      landingSpot.title,
      landingSpot.description,
      landingSpot.mediaItems
    );
    popupContainer.innerHTML = content;

    const closeButton = popupContainer.querySelector('.close-popup');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        popupContainer.style.display = 'none';
      });
    }
  };

  circle.userData.showPopup = showPopup;
  arrow.userData.showPopup = showPopup;
  
  return group;
};

export const createWindArrow = (windDirection: number) => {
  // Create arrow geometry - make it much longer
  const height = 1000;  // Increased from 500
  const radius = 50;
  
  // Create arrow body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(radius/3, radius/3, height * 0.7, 8);
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x0066ff,
    transparent: true,
    opacity: 0.8 
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  
  // Create arrow head (cone)
  const headGeometry = new THREE.ConeGeometry(radius, height * 0.3, 8);
  const headMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x0066ff,
    transparent: true,
    opacity: 0.8 
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = height * 0.5;
  
  // Create arrow group
  const arrow = new THREE.Group();
  arrow.add(body);
  arrow.add(head);
  
  // First rotate arrow to horizontal position
  arrow.rotation.z = Math.PI / 2;
  
  // Then rotate to point into wind direction
  // Add 180° because we want arrow to point where wind is coming from
  arrow.rotation.y = THREE.MathUtils.degToRad(windDirection + 180);
  
  return arrow;
}; 