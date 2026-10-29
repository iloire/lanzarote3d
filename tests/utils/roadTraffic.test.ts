import * as THREE from 'three';
import { Road, RoadTraffic } from '../../src/shared/env/roadTraffic';

/** Every car's position and the way its nose points */
const cars = (traffic: RoadTraffic) =>
  Array.from({ length: traffic.mesh.count }, (_, i) => {
    const matrix = new THREE.Matrix4();
    traffic.mesh.getMatrixAt(i, matrix);
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    const nose = new THREE.Vector3(0, 0, 1).transformDirection(matrix);
    return { position, nose };
  });

const settings = {
  unitsPerMetre: 1,
  maxCars: 60,
  spacing: 20,
  speed: [8, 12] as [number, number],
  laneWidth: 3,
  keepLeft: true,
};

describe('RoadTraffic', () => {
  // Two ways, one lane each, running east (+x) and climbing 50 over 400
  const road: Road = [-1, 0, 0, 0, 400, 50, 0];

  it('keeps to the left: eastbound cars on the north side (-z), westbound on the south', () => {
    const traffic = new RoadTraffic([road], settings);
    for (let i = 0; i < 37; i++) traffic.update(0.3);
    const all = cars(traffic);
    expect(all.length).toBeGreaterThan(4);
    all.forEach(({ position, nose }) => {
      expect(Math.abs(position.z)).toBeCloseTo(1.5, 5);
      if (nose.x > 0) expect(position.z).toBeLessThan(0);
      else expect(position.z).toBeGreaterThan(0);
    });
  });

  it('follows the road up the hill, nose up or down it', () => {
    const traffic = new RoadTraffic([road], settings);
    traffic.update(1);
    cars(traffic).forEach(({ position, nose }) => {
      expect(position.y).toBeCloseTo((position.x / 400) * 50, 3);
      expect(Math.sign(nose.y)).toBe(Math.sign(nose.x));
    });
  });

  it('drives on the right where asked, and leaves out roads too short for a car', () => {
    const traffic = new RoadTraffic([road, [-1, 0, 0, 0, 5, 0, 0]], {
      ...settings,
      keepLeft: false,
    });
    traffic.update(1);
    cars(traffic).forEach(({ position, nose }) => {
      if (nose.x > 0) expect(position.z).toBeGreaterThan(0);
      else expect(position.z).toBeLessThan(0);
      expect(position.x).toBeGreaterThan(-1);
    });
  });
});
