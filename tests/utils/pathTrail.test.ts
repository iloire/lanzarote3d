import * as THREE from 'three';
import { PathTrail } from '../../src/applications/relax/pathTrail';

describe('PathTrail', () => {
  const trail = () => {
    const t = new PathTrail(10);
    // Along x at 10 units a second
    for (let time = 0; time <= 5; time++) t.push(time, new THREE.Vector3(time * 10, 0, 0));
    return t;
  };

  it('finds where the lead was a while ago, between the points', () => {
    expect(trail().at(2.5, new THREE.Vector3()).x).toBeCloseTo(25);
  });

  it('gives the latest point for no lag', () => {
    expect(trail().at(0, new THREE.Vector3()).x).toBeCloseTo(50);
  });

  it('holds at the oldest point until the trail reaches that far back', () => {
    expect(trail().at(30, new THREE.Vector3()).x).toBe(0);
  });

  it('forgets what is older than it keeps', () => {
    const t = new PathTrail(2);
    for (let time = 0; time <= 10; time++) t.push(time, new THREE.Vector3(time, 0, 0));
    expect(t.at(30, new THREE.Vector3()).x).toBeGreaterThanOrEqual(7);
  });
});
