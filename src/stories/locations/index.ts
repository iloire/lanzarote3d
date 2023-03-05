import * as THREE from "three";

export type Location = {
  title: string;
  pos: THREE.Vector3;
  lookAt: THREE.Vector3;
  idealWindDirectionDegreesFromNorth: number;
};
