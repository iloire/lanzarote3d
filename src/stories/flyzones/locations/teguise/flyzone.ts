import * as THREE from 'three';
import { FlyZoneShape } from '../index';

const flyzone: FlyZoneShape = {
  phases: {
    takeoff: {
      type: 'takeoff',
      position: new THREE.Vector3(5200, 400, 5000),
      dimensions: {
        width: 400,
        height: 200,
        length: 400
      },
      nextPhases: ['approach']
    },
    approach: {
      type: 'approach',
      position: new THREE.Vector3(5350, 200, 5150),
      dimensions: {
        width: 400,
        height: 300,
        length: 400
      },
      nextPhases: ['landing']
    },
    landing: {
      type: 'landing',
      position: new THREE.Vector3(5500, 50, 5300),
      dimensions: {
        width: 400,
        height: 100,
        length: 400
      }
    }
  }
};

export default flyzone; 