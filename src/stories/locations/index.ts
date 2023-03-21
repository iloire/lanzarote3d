import * as THREE from "three";

export type Location = {
  title: string;
  position: THREE.Vector3;
  lookFrom: THREE.Vector3;
  lookAt: THREE.Vector3;
  idealWindDirectionDegreesFromNorth: number;
  idealSunPositionDegrees: number;
  availableForPlaying?: boolean;
};
