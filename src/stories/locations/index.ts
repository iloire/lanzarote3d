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

export type Location = {
  id: string;
  title: string;
  description: string;
  takeoffs: Takeoff[];
  position: THREE.Vector3;
  coordinates: GPS;
};

export type Media = {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
};
