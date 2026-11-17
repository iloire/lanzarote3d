import { windBearing } from '../../src/applications/flying-zones/zones';
import { ridgeLoop } from '../../src/applications/relax/ridgeLoop';

test('a wind range is the mean of its ends, the short way round', () => {
  expect(windBearing('N')).toBe(0);
  expect(windBearing('N-NW')).toBe(337.5);
  expect(windBearing('S-SE')).toBe(157.5);
  expect(windBearing('NE-E')).toBe(67.5);
  expect(windBearing('Variable')).toBeUndefined();
});

describe('a ridge loop', () => {
  // A cliff 300 high running east-west at z = 0, the sea to the north (−z)
  const cliff = (_x: number, z: number) => (z >= 0 ? 300 : NaN);
  const { loop, camera } = ridgeLoop({ x: 0, z: 0 }, 0, cliff);

  test('sits out over the sea in front of a north-facing slope, above the cliff top', () => {
    loop.forEach(point => {
      expect(point.z).toBeLessThan(0);
      expect(point.y).toBeGreaterThan(300);
    });
  });

  test('is watched from further out, looking back at it', () => {
    expect(camera.position.z).toBeLessThan(camera.target.z);
    expect(camera.position.y).toBeGreaterThan(camera.target.y);
  });

  test('starts at the edge when the takeoff is back from it', () => {
    // A plateau running 1000 north of the takeoff before the cliff
    const plateau = (_x: number, z: number) => (z >= -1000 ? 300 : NaN);
    ridgeLoop({ x: 0, z: 0 }, 0, plateau).loop.forEach(point =>
      expect(point.z).toBeLessThan(-1000)
    );
  });

  test('climbs to see over a hill between the camera and the gliders', () => {
    // A wall 2000 high halfway out to the camera, north of the loop
    const wall = (_x: number, z: number) => (z >= 0 ? 300 : z < -1300 && z > -1500 ? 2000 : NaN);
    const view = ridgeLoop({ x: 0, z: 0 }, 0, wall).camera;
    expect(view.position.y).toBeGreaterThan(2000);
  });

  test('clears ground that rises under it', () => {
    // Flat where the takeoff is, a hill 1000 high in front of it to the east
    const hill = (x: number) => (x > 100 ? 1000 : 0);
    ridgeLoop({ x: 0, z: 0 }, 90, hill).loop.forEach(point => expect(point.y).toBe(1130));
  });
});
