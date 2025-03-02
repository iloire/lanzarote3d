import * as THREE from "three";

export type Location = {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  lookFrom: THREE.Vector3;
  lookAt: THREE.Vector3;
  idealWindDirectionDegreesFromNorth: number;
  idealSunPositionDegrees: number;
  availableForPlaying: boolean;
};

export type Media = {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
};
