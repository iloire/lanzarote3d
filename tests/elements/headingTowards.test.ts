import * as THREE from 'three';
import { headingTowards, ForwardAxis } from '../../src/foundation/systems/behaviors/MovingBehavior';

const AXES: Record<ForwardAxis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  z: new THREE.Vector3(0, 0, 1),
  '-z': new THREE.Vector3(0, 0, -1),
};

const COMPASS = {
  north: new THREE.Vector3(0, 0, -1),
  east: new THREE.Vector3(1, 0, 0),
  south: new THREE.Vector3(0, 0, 1),
  west: new THREE.Vector3(-1, 0, 0),
  'north-east': new THREE.Vector3(1, 0, -1).normalize(),
};

describe('headingTowards', () => {
  (Object.keys(AXES) as ForwardAxis[]).forEach(axis => {
    Object.entries(COMPASS).forEach(([name, direction]) => {
      it(`turns a ${axis}-facing object to face ${name}`, () => {
        const front = AXES[axis]
          .clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), headingTowards(direction, axis));
        expect(front.x).toBeCloseTo(direction.x);
        expect(front.z).toBeCloseTo(direction.z);
      });
    });
  });
});
