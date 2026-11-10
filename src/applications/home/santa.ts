import * as THREE from 'three';
import { SANTA_SUIT } from './christmasWings';
import type { ParagliderVoxelConfig } from './config';

/**
 * At Christmas Santa flies a paramotor under a wing like his suit, towing his sleigh of presents:
 * Abel's 9.4 km loop over Famara beach and the sea, 600 m further out and twice as high, at
 * 1000-1080 m: 150+ m over the ridge pilots and 380+ m seaward of their loops, 150+ m under the
 * Cessna, and over the beach and the sea, well clear of the cliff. He's last in the pilot list, so the arrows reach
 * him, and ?pilot=santa flies the camera straight to him.
 */
export const SANTA_FLIGHT: ParagliderVoxelConfig = {
  name: 'santa',
  options: {
    glider: SANTA_SUIT,
    pilot: {},
    paramotor: true,
    santa: true,
  },
  startProgress: 0.5,
  pathOffset: new THREE.Vector3(0, 0, 0),
  waypoints: [
    new THREE.Vector3(6000, 1080, -1200),
    new THREE.Vector3(5400, 1060, -2200),
    new THREE.Vector3(5000, 1040, -3400),
    new THREE.Vector3(5400, 1020, -4600),
    new THREE.Vector3(6400, 1000, -5000),
    new THREE.Vector3(7200, 1010, -4200),
    new THREE.Vector3(7000, 1040, -3000),
    new THREE.Vector3(6600, 1060, -1900),
  ],
};
