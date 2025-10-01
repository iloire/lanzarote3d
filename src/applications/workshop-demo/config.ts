import * as THREE from 'three';
import {
  PineTree,
  PalmTree,
  CoconutPalm,
  DatePalm,
  FanPalm,
  Tree,
  Stone,
} from '../../foundation/components/scenery';

export interface CameraConfig {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export interface TreeConfig {
  type: string;
  position: [number, number, number];
  scale: number;
  label: string;
  component: new () => { load: () => THREE.Object3D };
}

export interface StoneConfig {
  position: [number, number, number];
  scale: [number, number, number];
  label: string;
}

export interface CactusConfig {
  type: 'Saguaro' | 'Barrel' | 'PricklyPear' | 'OrganPipe';
  position: [number, number, number];
  scale: number;
  label: string;
  lowPoly: boolean;
}

export interface IglooConfig {
  position: THREE.Vector3;
  scale: number;
}

export interface PoolConfig {
  position: THREE.Vector3;
  scale: number;
}

export interface GroundConfig {
  size: { width: number; height: number };
  color: number;
  opacity: number;
  position: { y: number };
  labelPosition: THREE.Vector3;
}

// Camera configuration
export const cameraConfig: CameraConfig = {
  position: new THREE.Vector3(200, 150, 200),
  lookAt: new THREE.Vector3(0, 0, 0),
};

// Ground level constant
export const GROUND_LEVEL = -15;

// Igloo configuration
export const iglooConfig: IglooConfig = {
  position: new THREE.Vector3(-120, GROUND_LEVEL, 0),
  scale: 0.8,
};

// Tree configurations
export const treeConfigs: TreeConfig[] = [
  { type: 'Pine', position: [-60, 0, 0], scale: 2.5, label: 'Pine Tree', component: PineTree },
  { type: 'Tree', position: [0, 0, 0], scale: 2, label: 'Tree', component: Tree },
  { type: 'Palm', position: [60, 0, 0], scale: 2, label: 'Palm Tree', component: PalmTree },
  { type: 'Coconut', position: [-60, 0, 60], scale: 2, label: 'Coconut Palm', component: CoconutPalm },
  { type: 'Date', position: [0, 0, 60], scale: 2, label: 'Date Palm', component: DatePalm },
  { type: 'Fan', position: [60, 0, 60], scale: 1.5, label: 'Fan Palm', component: FanPalm },
];

// Stone configurations
export const stoneConfigs: StoneConfig[] = [
  { position: [120, 0, 0], scale: [2, 2, 2], label: 'Stone' },
  { position: [120, 0, 60], scale: [1.5, 3, 1.5], label: 'Tall Stone' },
];

// Pool configuration
export const poolConfig: PoolConfig = {
  position: new THREE.Vector3(-120, GROUND_LEVEL, 60),
  scale: 0.8,
};

// Cactus configurations - high poly and low poly versions side by side
export const cactusConfigs: CactusConfig[] = [
  { type: 'Saguaro', position: [-80, 0, -60], scale: 0.6, label: 'Saguaro (High)', lowPoly: false },
  { type: 'Saguaro', position: [-40, 0, -60], scale: 0.6, label: 'Saguaro (Low)', lowPoly: true },
  { type: 'Barrel', position: [-20, 0, -60], scale: 1.0, label: 'Barrel (High)', lowPoly: false },
  { type: 'Barrel', position: [20, 0, -60], scale: 1.0, label: 'Barrel (Low)', lowPoly: true },
  { type: 'PricklyPear', position: [40, 0, -60], scale: 0.8, label: 'Prickly (High)', lowPoly: false },
  { type: 'PricklyPear', position: [80, 0, -60], scale: 0.8, label: 'Prickly (Low)', lowPoly: true },
  { type: 'OrganPipe', position: [100, 0, -60], scale: 0.7, label: 'Organ (High)', lowPoly: false },
  { type: 'OrganPipe', position: [140, 0, -60], scale: 0.7, label: 'Organ (Low)', lowPoly: true },
];

// Ground configuration
export const groundConfig: GroundConfig = {
  size: { width: 400, height: 300 },
  color: 0x8fbc8f, // Dark sea green
  opacity: 0.3,
  position: { y: GROUND_LEVEL },
  labelPosition: new THREE.Vector3(0, -10, 30),
};
