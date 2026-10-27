import * as THREE from 'three';
import { wakeGeometry } from '../../src/foundation/components/effects/BoatWake';

// A boat 20 long and 6 wide, bow at z = −10, stern at z = 10
const bounds = new THREE.Box3(new THREE.Vector3(-3, -2, -10), new THREE.Vector3(3, 8, 10));

const vertices = (geometry: THREE.BufferGeometry) => {
  const position = geometry.getAttribute('position');
  const color = geometry.getAttribute('color');
  return Array.from({ length: position.count }, (_, i) => ({
    x: position.getX(i),
    y: position.getY(i),
    z: position.getZ(i),
    alpha: color.getW(i),
  }));
};

describe('wakeGeometry', () => {
  const points = vertices(wakeGeometry(bounds));

  it('lies astern of the boat, flat just above the water', () => {
    points.forEach(p => {
      expect(p.z).toBeGreaterThanOrEqual(10);
      expect(p.y).toBeCloseTo(0.15);
    });
  });

  it('runs three boat lengths astern and opens at the Kelvin angle', () => {
    const far = Math.max(...points.map(p => p.z));
    expect(far).toBeCloseTo(10 + 60);
    // Each arm's centre moves out by 60 · tan 19.5° ≈ 21.2 from the stern corner
    const widest = Math.max(...points.map(p => Math.abs(p.x)));
    expect(widest).toBeCloseTo(3 + 60 * Math.tan(THREE.MathUtils.degToRad(19.5)) + 3 * 0.35, 1);
  });

  it('is foam at the stern and fades to nothing at its end', () => {
    points.filter(p => p.z === 10).forEach(p => expect(p.alpha).toBeCloseTo(0.6));
    points.filter(p => p.z > 10).forEach(p => expect(p.alpha).toBe(0));
  });
});
