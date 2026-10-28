import * as THREE from 'three';
import { CityTraffic, Lane } from '../../src/shared/env/cityTraffic';

describe('CityTraffic', () => {
  const lanes: Lane[] = [
    [0, 0, 600, 0],
    [100, 50, 100, -350],
  ];
  const traffic = () =>
    new CityTraffic(lanes, { unitsPerMetre: 1, road: 5, maxCars: 40, spacing: 20, speed: [7, 13] });
  const positions = (t: CityTraffic) =>
    Array.from({ length: t.mesh.count }, (_, i) => {
      const m = new THREE.Matrix4();
      t.mesh.getMatrixAt(i, m);
      return new THREE.Vector3().setFromMatrixPosition(m);
    });

  it('puts cars on every lane, no more than asked for', () => {
    const t = traffic();
    expect(t.mesh.count).toBeGreaterThan(lanes.length);
    expect(t.mesh.count).toBeLessThanOrEqual(80);
  });

  it('keeps every car on its lane and the road as they drive round', () => {
    const t = traffic();
    for (let i = 0; i < 500; i++) t.update(0.1);
    positions(t).forEach(p => {
      expect(p.y).toBe(5);
      const onFirst = Math.abs(p.z) < 1e-6 && p.x >= 0 && p.x <= 600;
      const onSecond = Math.abs(p.x - 100) < 1e-6 && p.z <= 50 && p.z >= -350;
      expect(onFirst || onSecond).toBe(true);
    });
  });

  it('drives the cars on', () => {
    const t = traffic();
    const before = positions(t);
    t.update(0.5);
    const after = positions(t);
    expect(after.some((p, i) => p.distanceTo(before[i]!) > 1)).toBe(true);
  });
});
