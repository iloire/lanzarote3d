import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Media } from "./locations";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { FlyZoneShape, LandingSpot, Location } from "./locations/index";

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

// Add new constants for visibility thresholds
export const VISIBILITY_THRESHOLDS = {
  LOCATION_PIN: 15000, // Show location pin when far
  TAKEOFF_PIN: 15000,  // Show takeoff pins when close
  FLYZONE: 20000,      // Show flyzone when moderately close
  LANDING: 15000       // Show landing spots when close
};

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

export type Marker = {
  pin: THREE.Object3D;
  isTakeoff: boolean;
  hoverAnimation: TWEEN.Tween<any>;
  unhoverAnimation: TWEEN.Tween<any>;
  showPopup: () => void;
  setVisibility: (visible: boolean) => void;
  landingSpots?: THREE.Object3D[];
  flyzone?: THREE.Object3D;
};

export const createMarker = (
  position: THREE.Vector3,
  title: string,
  description: string,
  mediaItems: Media[],
  isTakeoff: boolean,
  scene: THREE.Scene,
  popupContainer: HTMLDivElement,
  navigateTo: (position: THREE.Vector3, location?: Location) => void,
  location: Location | undefined,
  camera: THREE.Camera
): Marker => {
  console.log('Creating marker:', {
    title,
    isTakeoff,
    mediaItems,
    hasPopupContainer: !!popupContainer
  });
  const pin = createPinMesh(isTakeoff);
  pin.position.copy(position);
  pin.position.y += isTakeoff ? 20 : 40;
  pin.rotation.x = Math.PI;
  pin.visible = !isTakeoff;
  pin.userData.hoverable = true;
  pin.userData.clickable = true;
  pin.userData.type = isTakeoff ? 'takeoff' : 'location';
  pin.userData.isTakeoff = isTakeoff;
  
  // Make sure the pin can receive raycasts
  pin.raycast = new THREE.Mesh().raycast;

  const { hover, unhover } = createHoverAnimations(pin, isTakeoff);
  
  const label = createLabel(title);
  pin.add(label);
  scene.add(pin);

  const fadeAnimation = new TWEEN.Tween(pin.material)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .duration(PIN_FADE_DURATION);

  // Create landing spots if this is a location marker
  let landingSpots: THREE.Object3D[] | undefined;
  let flyzone: THREE.Object3D | undefined;

  if (location && !isTakeoff) {
    if (location.landingSpots) {
      landingSpots = location.landingSpots.map(spot => {
        const marker = createLandingSpotMarker(spot, popupContainer);
        marker.visible = false;
        scene.add(marker);
        return marker;
      });
    }

    if (location.flyzone) {
      flyzone = createCustomFlyZone(location.flyzone);
      flyzone.visible = false;
      scene.add(flyzone);
    }
  }

  const setVisibility = (visible: boolean) => {
    const distance = camera.position.distanceTo(position);
    
    if (visible !== pin.visible) {
      fadeAnimation.stop();
      
      // Location pin visibility (show when far)
      if (!isTakeoff) {
        pin.visible = distance > VISIBILITY_THRESHOLDS.LOCATION_PIN;
        label.visible = distance > VISIBILITY_THRESHOLDS.LOCATION_PIN;
      } else {
        // Takeoff pin visibility (show when close)
        pin.visible = distance < VISIBILITY_THRESHOLDS.TAKEOFF_PIN;
        label.visible = distance < VISIBILITY_THRESHOLDS.TAKEOFF_PIN;
      }

      // Flyzone and landing spots visibility (show when close to location)
      if (flyzone) {
        flyzone.visible = distance < VISIBILITY_THRESHOLDS.FLYZONE;
      }
      
      landingSpots?.forEach(spot => {
        spot.visible = distance < VISIBILITY_THRESHOLDS.LANDING;
      });

      fadeAnimation
        .to({ opacity: visible ? 0.8 : 0 }, PIN_FADE_DURATION)
        .start();
    }
  };

  const showPopup = () => {
    if (pin.userData.isTakeoff) {
      console.log('Showing popup for:', title);
      console.log('Popup container before:', {
        display: popupContainer.style.display,
        zIndex: popupContainer.style.zIndex,
        className: popupContainer.className
      });
      
      popupContainer.style.display = 'block';
      const content = createPopupContent(title, description, mediaItems);
      popupContainer.innerHTML = content;
      
      // Force a reflow
      void popupContainer.offsetHeight;
      
      console.log('Popup container after:', {
        display: popupContainer.style.display,
        zIndex: popupContainer.style.zIndex,
        className: popupContainer.className,
        content: popupContainer.innerHTML
      });

      const closeButton = popupContainer.querySelector('.close-popup');
      if (closeButton) {
        closeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          popupContainer.style.display = 'none';
        });
      }
    } else {
      navigateTo(position, location);
    }
  };

  return {
    pin,
    isTakeoff,
    hoverAnimation: hover,
    unhoverAnimation: unhover,
    showPopup,
    setVisibility,
    landingSpots,
    flyzone
  };
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
  const { points, color = FLYZONE_COLORS.safe } = shape;
  
  // Create a custom geometry by connecting the points
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Create circular cross-sections at each point
  points.forEach((point, heightIndex) => {
    const segments = 32; // Number of segments in each circle
    const baseIndex = heightIndex * segments;
    
    // Create vertices for this circle
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = point.position.x + Math.cos(angle) * point.radius;
      const z = point.position.z + Math.sin(angle) * point.radius;
      vertices.push(x, point.position.y, z);
    }
    
    // Create faces between this circle and the next
    if (heightIndex < points.length - 1) {
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        indices.push(
          baseIndex + i,
          baseIndex + segments + i,
          baseIndex + next,
          baseIndex + segments + i,
          baseIndex + segments + next,
          baseIndex + next
        );
      }
    }
  });
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshBasicMaterial({
    color: shape.color || FLYZONE_COLORS.safe,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    wireframe: true,
    depthWrite: false // Ensure transparency works correctly
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Add wireframe outline for better visibility
  const wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    })
  );
  mesh.add(wireframe);
  
  return mesh;
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