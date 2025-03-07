import * as THREE from "three";

// Import locations
import famara from './famara/index';
import teguise from './teguise/index';
import macher from './macher/index';

// Export type definitions
export interface GPS {
  latitude: number;
  longitude: number;
  altitude: number;
}

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
  gps?: GPS;
  elevation: number;
  conditions: WindCondition[];
  mediaItems: Media[];
}

export interface LandingSpot {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  gps?: GPS;
  elevation: number;
  type: 'primary' | 'secondary' | 'emergency';
  mediaItems: Media[];
}

export interface FlightPhase {
  type: 'takeoff' | 'landing' | 'ridge' | 'approach';
  position: THREE.Vector3;
  gps?: GPS;
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

export interface LocationMetadata {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  gps?: GPS;
  cameraView: {
    position: THREE.Vector3;
    lookAt?: THREE.Vector3;
    distance?: number;
  };
}

export interface Location extends LocationMetadata {
  takeoffs: Takeoff[];
  landingSpots?: LandingSpot[];
  flyzone?: FlyZoneShape;
}

// Export individual locations
export { default as famara } from './famara/index';
export { default as teguise } from './teguise/index';
export { default as macher } from './macher/index';

// Create a default export with all locations
const locations: Location[] = [
  famara,
  teguise,
  macher
];

export default locations;
