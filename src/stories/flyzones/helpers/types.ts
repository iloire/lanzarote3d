import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { MarkerObject } from '../markers/markers';

export enum MarkerType {
  LOCATION = 'location',
  TAKEOFF = 'takeoff',
  LANDING = 'landing'
}

// Use the Marker interface from markers.ts
export { Marker } from '../markers/markers';

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
  type: string;
  gps: GPS;
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