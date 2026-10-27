import * as THREE from 'three';
import { buildCloudGeometry } from '../../src/foundation/components/environment/Cloud';

const ys = (geometry: THREE.BufferGeometry) => {
  const position = geometry.getAttribute('position');
  return Array.from({ length: position.count }, (_, i) => position.getY(i));
};

describe('buildCloudGeometry', () => {
  it.each(['puff', 'tower'] as const)('sits a %s on a flat base at y = 0', kind => {
    for (let n = 0; n < 20; n++) {
      const geometry = buildCloudGeometry(kind);
      const normal = geometry.getAttribute('normal');
      const heights = ys(geometry);
      expect(Math.min(...heights)).toBe(0);
      // The base is real faces looking straight down, not just vertices touching y = 0
      const downward = Array.from({ length: normal.count }, (_, i) => normal.getY(i)).filter(
        y => y < -0.999
      );
      expect(downward.length).toBeGreaterThan(0);
    }
  });

  it('makes puffs much wider than tall and towers nearly as tall as wide', () => {
    const aspect = (kind: 'puff' | 'tower') => {
      const position = buildCloudGeometry(kind).getAttribute('position') as THREE.BufferAttribute;
      const size = new THREE.Box3().setFromBufferAttribute(position).getSize(new THREE.Vector3());
      return size.y / Math.max(size.x, size.z);
    };
    for (let n = 0; n < 50; n++) {
      expect(aspect('puff')).toBeLessThan(0.55);
      expect(aspect('tower')).toBeGreaterThan(0.6);
    }
  });

  it('gives every vertex a unit face normal and a height from 0 at the base to 1 at the top', () => {
    const geometry = buildCloudGeometry('puff');
    const normal = geometry.getAttribute('normal');
    const cloud = geometry.getAttribute('aCloud');
    const heights = ys(geometry);
    const top = Math.max(...heights);
    for (let i = 0; i < normal.count; i++) {
      expect(new THREE.Vector3().fromBufferAttribute(normal, i).length()).toBeCloseTo(1, 5);
      expect(cloud.getY(i)).toBeCloseTo(heights[i]! / top, 5);
    }
  });

  it('keeps the base level when the cloud is turned and moved', () => {
    const geometry = buildCloudGeometry('puff', {
      offset: new THREE.Vector3(300, 12, -200),
      yaw: 1.2,
    });
    expect(Math.min(...ys(geometry))).toBeCloseTo(12, 5);
  });
});
