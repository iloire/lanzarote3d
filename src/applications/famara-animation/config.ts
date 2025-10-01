import * as THREE from 'three';
import type { ParagliderVoxelOptions } from '../../foundation/components/vehicles';
import adriModel from '../../../assets/foundation/models/characters/adri/adri.obj';
import adriTextureImage from '../../../assets/foundation/models/characters/adri/adri.png';
import { FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';

export type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: THREE.Vector3;
};

export type HanggliderConfig = {
  position: THREE.Vector3;
  scale: number;
  flightPattern: FlightPattern;
  speed: number;
  turnSpeed: number;
  flightRadius: number;
  returnDistance: number;
  minHeight: number;
  maxHeight: number;
  obstacleAvoidanceDistance: number;
  forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
};

export type CessnaConfig = {
  position: THREE.Vector3;
  scale: number;
  bodyColor: string;
  wingColor: string;
  propellerColor: string;
  windowColor: string;
  stripeColor: string;
  flightPattern: FlightPattern;
  speed: number;
  turnSpeed: number;
  flightRadius: number;
  returnDistance: number;
  minHeight: number;
  maxHeight: number;
  obstacleAvoidanceDistance: number;
  forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
};

export type HerculesConfig = {
  position: THREE.Vector3;
  scale: number;
  bodyColor: string;
  wingColor: string;
  propellerColor: string;
  windowColor: string;
  flightPattern: FlightPattern;
  speed: number;
  turnSpeed: number;
  flightRadius: number;
  returnDistance: number;
  minHeight: number;
  maxHeight: number;
  obstacleAvoidanceDistance: number;
  forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
};

export const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage,
      },
    },
    position: new THREE.Vector3(6897, 920, -705),
  },
];

export const hanggliderConfig: HanggliderConfig = {
  position: new THREE.Vector3(4800, 950, -500),
  scale: 1.0,
  flightPattern: FlightPattern.FIGURE_EIGHT,
  speed: 3.0,
  turnSpeed: 7.0,
  flightRadius: 145,
  returnDistance: 155,
  minHeight: 900,
  maxHeight: 1225,
  obstacleAvoidanceDistance: 150,
  forwardAxis: 'x',
};

export const cessnaConfig: CessnaConfig = {
  position: new THREE.Vector3(5500, 1100, -800),
  scale: 3.0,
  bodyColor: '#F4F4F4',
  wingColor: '#E8E8E8',
  propellerColor: '#2C3E50',
  windowColor: '#87CEEB',
  stripeColor: '#FF4500',
  flightPattern: FlightPattern.WAYPOINT,
  speed: 50,
  turnSpeed: 5.0,
  flightRadius: 250,
  returnDistance: 300,
  minHeight: 1000,
  maxHeight: 1500,
  obstacleAvoidanceDistance: 200,
  forwardAxis: 'x',
  // Flight path over houses and boats
  waypoints: [
    // Start over paraglider area (suburban neighborhood)
    new THREE.Vector3(6879, 1100, 545),
    // Over Famara coastal village
    new THREE.Vector3(6279, 1200, -3155),
    // Over boats area 1 (marina/harbor)
    new THREE.Vector3(7879, 1150, -5445),
    // Over boats area 2 (open water)
    new THREE.Vector3(8279, 1100, -6455),
    // Over Noruegos rural settlement
    new THREE.Vector3(7827, 1250, -3460),
    // Over Teguise town center
    new THREE.Vector3(5600, 1300, 1205),
    // Return path back to start
    new THREE.Vector3(6200, 1200, 200),
  ],
  waypointTension: 0.5,
  waypointLoop: true,
};

export const herculesConfig: HerculesConfig = {
  position: new THREE.Vector3(6200, 1200, -1200),
  scale: 2.5,
  bodyColor: '#6B7280',
  wingColor: '#4B5563',
  propellerColor: '#1F2937',
  windowColor: '#3B82F6',
  flightPattern: FlightPattern.FIGURE_EIGHT,
  speed: 5.0,
  turnSpeed: 4.0,
  flightRadius: 300,
  returnDistance: 350,
  minHeight: 1100,
  maxHeight: 1600,
  obstacleAvoidanceDistance: 250,
  forwardAxis: 'x',
};

// Visibility flags for easy toggling
export const SHOW_HANGGLIDER = true;
export const SHOW_CESSNA = true;
export const SHOW_HERCULES = true;

// Animation configuration
export const ANIMATION_DURATION_MS = 6000; // 6 seconds

// Bird path configuration
export const birdPath = [
  new THREE.Vector3(5000, 1000, 0),
  new THREE.Vector3(6000, 1100, -500),
  new THREE.Vector3(7000, 1200, -1000),
  new THREE.Vector3(8000, 1000, -500),
  new THREE.Vector3(7000, 900, 0),
];
