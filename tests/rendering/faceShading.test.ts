import * as THREE from 'three';
import { bakeFaceShading } from '../../src/foundation/rendering/faceShading';

const triangles = (...corners: number[][]) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(corners.flat(), 3));
  return geometry;
};

describe('bakeFaceShading', () => {
  it('gives every corner of a face the same centre height, flatness and jitter', () => {
    const face = bakeFaceShading(triangles([0, 0, 0], [1, 3, 0], [0, 6, 1]));
    for (let k = 1; k < 3; k++) {
      expect(face.getX(k)).toBe(face.getX(0));
      expect(face.getY(k)).toBe(face.getY(0));
      expect(face.getZ(k)).toBe(face.getZ(0));
    }
    expect(face.getX(0)).toBeCloseTo(3);
  });

  it('measures level faces as 1 and vertical ones as 0, whatever the winding', () => {
    const face = bakeFaceShading(
      triangles(
        [0, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, 0],
        [1, 0, 0],
        [0, 0, 1],
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0]
      )
    );
    expect(face.getY(0)).toBeCloseTo(1);
    expect(face.getY(3)).toBeCloseTo(1);
    expect(face.getY(6)).toBeCloseTo(0);
  });

  it('jitters faces apart, within [-1, 1], the same on every bake', () => {
    const corners = Array.from({ length: 300 }, (_, i) => [i, 0, i % 3 === 1 ? 1 : 0]);
    const first = bakeFaceShading(triangles(...corners));
    const second = bakeFaceShading(triangles(...corners));
    const jitters = Array.from({ length: 100 }, (_, f) => first.getZ(f * 3));
    expect(jitters.every(j => j >= -1 && j <= 1)).toBe(true);
    expect(new Set(jitters).size).toBeGreaterThan(95);
    expect(Math.min(...jitters)).toBeLessThan(-0.8);
    expect(Math.max(...jitters)).toBeGreaterThan(0.8);
    expect(Array.from(second.array)).toEqual(Array.from(first.array));
  });
});
