import * as THREE from 'three';
import { bakeRegionTint, GroundRegion } from '../../src/foundation/rendering/regionTint';

// One small level triangle centred on each (x, z).
const facesAt = (...centres: [number, number][]) => {
  const corners = centres.flatMap(([x, z]) => [x - 1, 0, z - 1, x + 2, 0, z - 1, x - 1, 0, z + 2]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(corners, 3));
  return geometry;
};

const red: GroundRegion = { x: 0, z: 0, radius: 100, color: '#ff0000', strength: 1 };
const blue: GroundRegion = { x: 60, z: 0, radius: 100, color: '#0000ff', strength: 1 };

describe('bakeRegionTint', () => {
  it('fully recolours a region’s middle, fades at its edge and leaves the rest alone', () => {
    const tint = bakeRegionTint(facesAt([0, 0], [80, 0], [200, 0]), [red], new THREE.Matrix4());
    expect([tint.getX(0), tint.getY(0), tint.getZ(0), tint.getW(0)]).toEqual([1, 0, 0, 1]);
    expect(tint.getW(3)).toBeGreaterThan(0);
    expect(tint.getW(3)).toBeLessThan(0.5);
    expect(tint.getW(6)).toBe(0);
    for (let k = 1; k < 3; k++) expect(tint.getW(k)).toBe(tint.getW(0));
  });

  it('blends overlapping regions by weight', () => {
    const tint = bakeRegionTint(facesAt([30, 0]), [red, blue], new THREE.Matrix4());
    expect(tint.getX(0)).toBeCloseTo(0.5);
    expect(tint.getZ(0)).toBeCloseTo(0.5);
    expect(tint.getW(0)).toBe(1);
  });

  it('measures from the world position, not the local one', () => {
    const toWorld = new THREE.Matrix4().makeScale(100, 100, 100);
    const tint = bakeRegionTint(facesAt([2, 0]), [red], toWorld);
    expect(tint.getW(0)).toBe(0);
  });
});
