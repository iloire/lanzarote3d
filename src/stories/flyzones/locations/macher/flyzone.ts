import * as THREE from 'three';
import { FlyZoneShape } from '../index';

const flyzone: FlyZoneShape = {
  phases: {
    takeoff: {
      type: 'takeoff',
      position: new THREE.Vector3(-3200, 300, 8100),
      dimensions: {
        width: 300,
        height: 150,
        length: 300
      },
      nextPhases: ['thermal']
    },
    thermal: {
      type: 'ridge',
      position: new THREE.Vector3(-3100, 500, 8200),
      dimensions: {
        width: 600,
        height: 400,
        length: 600
      },
      nextPhases: ['approach']
    },
    approach: {
      type: 'approach',
      position: new THREE.Vector3(-2900, 200, 8250),
      dimensions: {
        width: 400,
        height: 250,
        length: 400
      },
      nextPhases: ['landing']
    },
    landing: {
      type: 'landing',
      position: new THREE.Vector3(-2800, 40, 8300),
      dimensions: {
        width: 300,
        height: 80,
        length: 300
      }
    }
  }
};

export default flyzone; 