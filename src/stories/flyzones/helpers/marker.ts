import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { MarkerType } from './types';
import { PIN_COLORS, PIN_SIZES, PIN_FADE_DURATION } from './constants';
import Paraglider from '../../../components/paraglider';
import { PilotHeadType } from '../../../components/parts/pilot-head';
import { createLabel } from './popup';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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

  const mesh = new THREE.Mesh(geometry, material);
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