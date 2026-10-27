import * as THREE from 'three';
import { calculateHousePositions } from '../../src/shared/env/house-group-utils';

const extent = (positions: THREE.Vector3[], axis: 'x' | 'z') => {
  const values = positions.map(p => p[axis]);
  return Math.max(...values) - Math.min(...values);
};

describe('grid formation', () => {
  const grid = (count: number) =>
    calculateHousePositions(count, {
      center: new THREE.Vector3(0, 0, 0),
      formation: 'grid',
      spacing: 50,
      randomVariation: 0,
    });

  it('lays a big town out near square, not in a long strip', () => {
    const positions = grid(80);
    expect(positions).toHaveLength(80);
    // 9 columns by 9 rows at 50 apart: 400 each way
    expect(extent(positions, 'x')).toBe(400);
    expect(extent(positions, 'z')).toBe(400);
  });

  it('keeps a block of nine at three by three', () => {
    const positions = grid(9);
    expect(extent(positions, 'x')).toBe(100);
    expect(extent(positions, 'z')).toBe(100);
  });
});
