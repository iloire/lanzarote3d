import * as THREE from 'three';
import type { ParagliderVoxelOptions } from '../../foundation/components/vehicles';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import { FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';

export type ParagliderVoxelConfig = {
  options: ParagliderVoxelOptions;
  position: THREE.Vector3;
  flightPattern?: FlightPattern;
  speed?: number;
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
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
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
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
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
};

export const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    options: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        characterType: CharacterType.ADRI,
      },
    },
    position: new THREE.Vector3(6897, 920, -705),
    flightPattern: FlightPattern.WAYPOINT,
    speed: 15,
    waypoints: [
      new THREE.Vector3(6897, 700, -705),
      new THREE.Vector3(6700, 720, 200),
      new THREE.Vector3(5800, 750, 1000),
      new THREE.Vector3(5400, 720, 1400),
      new THREE.Vector3(5800, 680, 500),
      new THREE.Vector3(6200, 650, -1500),
      new THREE.Vector3(6500, 680, -2800),
      new THREE.Vector3(7000, 700, -2200),
      new THREE.Vector3(7200, 720, -1000),
      new THREE.Vector3(7000, 700, -200),
    ],
    waypointTension: 0.5,
    waypointLoop: true,
  },
];

export const hanggliderConfig: HanggliderConfig = {
  position: new THREE.Vector3(4800, 950, -500),
  scale: 1.0,
  flightPattern: FlightPattern.WAYPOINT,
  speed: 25,
  turnSpeed: 7.0,
  flightRadius: 145,
  returnDistance: 155,
  minHeight: 900,
  maxHeight: 1225,
  obstacleAvoidanceDistance: 150,
  forwardAxis: 'x',
  waypoints: [
    new THREE.Vector3(7679, 800, -5245),
    new THREE.Vector3(8079, 820, -5445),
    new THREE.Vector3(8079, 800, -5645),
    new THREE.Vector3(7679, 780, -5645),
    new THREE.Vector3(8079, 790, -6255),
    new THREE.Vector3(8479, 800, -6455),
    new THREE.Vector3(8479, 820, -6655),
    new THREE.Vector3(8079, 800, -6655),
    new THREE.Vector3(7879, 810, -6055),
  ],
  waypointTension: 0.7,
  waypointLoop: true,
};

export const cessnaConfig: CessnaConfig = {
  position: new THREE.Vector3(7200, 1000, 500),
  scale: 3.0,
  bodyColor: '#F4F4F4',
  wingColor: '#E8E8E8',
  propellerColor: '#2C3E50',
  windowColor: '#87CEEB',
  stripeColor: '#FF4500',
  flightPattern: FlightPattern.WAYPOINT,
  speed: 120,
  turnSpeed: 5.0,
  flightRadius: 250,
  returnDistance: 300,
  minHeight: 1000,
  maxHeight: 1500,
  obstacleAvoidanceDistance: 200,
  forwardAxis: 'x',
  waypoints: [
    new THREE.Vector3(6600, 950, -705),
    new THREE.Vector3(6279, 1000, -3155),
    new THREE.Vector3(7879, 980, -5445),
    new THREE.Vector3(8279, 950, -6455),
    new THREE.Vector3(7827, 1050, -3460),
    new THREE.Vector3(5600, 1100, 1205),
    new THREE.Vector3(6200, 1000, 200),
  ],
  waypointTension: 0.6,
  waypointLoop: true,
};

export const herculesConfig: HerculesConfig = {
  position: new THREE.Vector3(6200, 1200, -1200),
  scale: 2.5,
  bodyColor: '#6B7280',
  wingColor: '#4B5563',
  propellerColor: '#1F2937',
  windowColor: '#3B82F6',
  flightPattern: FlightPattern.WAYPOINT,
  speed: 60,
  turnSpeed: 4.0,
  flightRadius: 300,
  returnDistance: 350,
  minHeight: 1100,
  maxHeight: 1600,
  obstacleAvoidanceDistance: 250,
  forwardAxis: 'x',
  waypoints: [
    new THREE.Vector3(5200, 1500, 2000),
    new THREE.Vector3(7500, 1600, 1500),
    new THREE.Vector3(9000, 1550, -4000),
    new THREE.Vector3(8500, 1500, -7500),
    new THREE.Vector3(6500, 1450, -8000),
    new THREE.Vector3(4500, 1400, -5000),
    new THREE.Vector3(4000, 1450, -1000),
    new THREE.Vector3(4800, 1500, 500),
  ],
  waypointTension: 0.3,
  waypointLoop: true,
};

// Visibility flags for easy toggling
export const SHOW_HANGGLIDER = false;
export const SHOW_CESSNA = true;
export const SHOW_HERCULES = true;

// Camera Target Controller
export const SHOW_CAMERA_TARGET_UI = false;

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

// Navigation box configuration
export interface NavigationLink {
  id: string;
  label: string;
  description: string;
  url: string;
  icon: string;
  category: 'pilot' | 'general';
}

export const NAVIGATION_LINKS: NavigationLink[] = [
  {
    id: 'wind',
    label: 'Wind',
    description: 'Wind Forecast',
    url: 'https://wind.lanzaroteparagliding.com?ref=home',
    icon: '\uD83C\uDF2C\uFE0F', // wind emoji
    category: 'pilot',
  },
  {
    id: 'guide',
    label: 'Guide',
    description: 'Flying Guide',
    url: 'https://guide.lanzaroteparagliding.com?ref=home',
    icon: '\uD83D\uDDFA\uFE0F', // map emoji
    category: 'pilot',
  },
  {
    id: 'tandem',
    label: 'Tandem',
    description: 'Try Paragliding!',
    url: 'https://venturilanzarote.com?ref=home',
    icon: '\uD83E\uDE82', // parachute emoji
    category: 'general',
  },
];
