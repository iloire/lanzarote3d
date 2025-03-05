import * as THREE from 'three';
import { FlyZoneShape } from '../index';

const flyzone: FlyZoneShape = {
  phases: {
    takeoff: {
      type: 'takeoff',
      position: new THREE.Vector3(500, 600, 0),
      dimensions: {
        width: 500,
        height: 200,
        length: 500
      },
      nextPhases: ['ridge']
    },
    ridge: {
      type: 'ridge',
      position: new THREE.Vector3(700, 500, 300),
      dimensions: {
        width: 2000,
        height: 400,
        length: 500
      },
      nextPhases: ['approach']
    },
    approach: {
      type: 'approach',
      position: new THREE.Vector3(900, 250, 400),
      dimensions: {
        width: 500,
        height: 300,
        length: 500
      },
      nextPhases: ['landing']
    },
    landing: {
      type: 'landing',
      position: new THREE.Vector3(1000, 50, 500),
      dimensions: {
        width: 500,
        height: 100,
        length: 500
      }
    }
  }
};

export default flyzone; 