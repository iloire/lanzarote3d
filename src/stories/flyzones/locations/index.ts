import * as THREE from "three";
import famara from './famara';
import teguise from './teguise';
import macher from './macher';

export interface Media {
  type: 'image' | 'video';
  url: string;
  title?: string;
}

export interface WindDirection {
  ideal: number;
  range: [number, number];
}

export interface WindCondition {
  direction: WindDirection;
  speed: {
    min: number;
    max: number;
    ideal: number;
  };
  rating: number;
  description: string;
}

export interface Takeoff {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  elevation: number;
  conditions: WindCondition[];
  mediaItems: Media[];
}

export interface LandingSpot {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  elevation: number;
  type: 'primary' | 'secondary' | 'emergency';
  mediaItems: Media[];
}

export interface FlightPhase {
  type: 'takeoff' | 'landing' | 'ridge' | 'approach';
  position: THREE.Vector3;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  nextPhases?: string[];
}

export interface FlyZoneShape {
  color?: number;
  phases: {
    [key: string]: FlightPhase;
  };
}

export interface Location {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  cameraView: {
    position: THREE.Vector3;
    lookAt?: THREE.Vector3;
    distance?: number;
  };
  takeoffs: Takeoff[];
  landingSpots?: LandingSpot[];
  flyzone?: FlyZoneShape;
}

export { default as famara } from './famara';
export { default as teguise } from './teguise';
export { default as macher } from './macher';



const locations: Location[] = [
  famara,
  teguise,
  macher
];

export default locations;
