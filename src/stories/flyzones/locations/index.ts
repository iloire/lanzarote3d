import * as THREE from "three";

export type Condition = {
  from: number;
  to: number;
  minWindKmh: number;
  maxWindKmh: number;
  rating: number;
};

export type Takeoff = {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  coordinates: GPS;
  conditions: Condition[];
  mediaItems: Media[];
};

export type GPS = {
  latitude: number;
  longitude: number;
  altitude?: number;
};

export type LandingSpot = {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  coordinates: GPS;
  safety: 'primary' | 'secondary' | 'emergency';
  mediaItems: Media[];
};

export type FlyZonePoint = {
  position: THREE.Vector3;
  radius: number; // Radius at this height
};

export type FlyZoneShape = {
  points: FlyZonePoint[];
  color?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type CameraView = {
  position: THREE.Vector3;  // Camera position relative to location
  lookAt?: THREE.Vector3;   // Optional specific look-at point (defaults to location position)
  distance?: number;        // Optional distance override
};

export type Location = {
  id: string;
  title: string;
  description: string;
  takeoffs: Takeoff[];
  position: THREE.Vector3;
  coordinates: GPS;
  flyzone?: FlyZoneShape;
  landingSpots?: LandingSpot[];
  cameraView: CameraView;  // Add camera view configuration
};

export type Media = {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
};
