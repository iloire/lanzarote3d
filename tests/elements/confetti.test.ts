import * as THREE from 'three';
import { ConfettiBurst } from '../../src/foundation/components/effects/Confetti';

const flakeAt = (burst: ConfettiBurst, i: number) => {
  const matrix = new THREE.Matrix4();
  burst.mesh.getMatrixAt(i, matrix);
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  matrix.decompose(pos, new THREE.Quaternion(), scale);
  return { pos, scale: scale.x };
};

test('a burst throws its flakes up from the origin, and they drift back down and vanish', () => {
  const origin = new THREE.Vector3(10, 20, 30);
  const burst = new ConfettiBurst(origin, 4);
  expect(flakeAt(burst, 0).pos).toEqual(origin);

  for (let t = 0; t < 0.4; t += 0.02) burst.update(0.02);
  for (let i = 0; i < burst.mesh.count; i++) expect(flakeAt(burst, i).pos.y).toBeGreaterThan(20);

  let alive = true;
  let seconds = 0;
  while (alive && seconds < 10) {
    alive = burst.update(0.05);
    seconds += 0.05;
  }
  expect(seconds).toBeLessThan(4);
  for (let i = 0; i < burst.mesh.count; i++) {
    expect(flakeAt(burst, i).scale).toBe(0);
    // Gone before they fall far: it stays a small puff round the pilot
    expect(flakeAt(burst, i).pos.distanceTo(origin)).toBeLessThan(4 * 6);
  }
  burst.dispose();
});
