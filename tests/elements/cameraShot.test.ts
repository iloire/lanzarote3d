import * as THREE from 'three';
import { CameraShot, ShotKey } from '../../src/applications/puerto-del-carmen/cameraShot';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const keys: ShotKey[] = [
  { at: 0, position: v(10, 5, 0), lookAt: v(0, 0, 0), followPilot: true },
  { at: 4, position: v(100, 50, 0), lookAt: v(200, 0, 0) },
  { at: 10, position: v(300, 20, 100), lookAt: v(400, 0, 0) },
];
const pilot = v(-50, 400, 20);

const expectAt = (actual: THREE.Vector3, expected: THREE.Vector3) => {
  expect(actual.x).toBeCloseTo(expected.x, 3);
  expect(actual.y).toBeCloseTo(expected.y, 3);
  expect(actual.z).toBeCloseTo(expected.z, 3);
};

describe('CameraShot', () => {
  const shot = new CameraShot(keys);

  it('passes each key at its time, offset from the pilot where the key follows it', () => {
    expectAt(shot.at(0, pilot).position, v(-40, 405, 20));
    expectAt(shot.at(0, pilot).lookAt, pilot);
    expectAt(shot.at(4, pilot).position, keys[1]!.position);
    expectAt(shot.at(10, pilot).lookAt, keys[2]!.lookAt);
  });

  it('holds the last key after the shot ends', () => {
    expect(shot.duration).toBe(10);
    expectAt(shot.at(25, pilot).position, keys[2]!.position);
  });

  it('starts and ends at rest and never jumps', () => {
    const step = 0.01;
    const speed = (t: number) =>
      shot.at(t + step, pilot).position.distanceTo(shot.at(t, pilot).position) / step;
    expect(speed(0)).toBeLessThan(speed(2) * 0.05);
    expect(speed(10 - step)).toBeLessThan(speed(7) * 0.05);
    for (let t = 0; t < 10; t += step) {
      expect(speed(t)).toBeLessThan(150);
    }
  });
});
