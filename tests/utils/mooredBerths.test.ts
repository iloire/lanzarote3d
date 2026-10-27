import * as THREE from 'three';
import { mooredBerths } from '../../src/shared/env/boat-group-utils';

describe('mooredBerths', () => {
  const south = new THREE.Vector3(0, 0, 100);
  const north = new THREE.Vector3(0, 0, 0);

  it('fits as many berths as the spacing allows, centred on the segment', () => {
    const berths = mooredBerths(south, north, 30, 0);
    // Three 30-unit berths in 100 leave 5 at each end; each boat lies at its berth's middle
    expect(berths.map(b => b.position.z)).toEqual([80, 50, 20]);
  });

  it('points every bow from the start towards the end', () => {
    // A boat at heading 0 points north (−z); one going east turns a quarter to the right
    expect(mooredBerths(south, north, 30, 0)[0]!.heading).toBeCloseTo(0);
    const east = mooredBerths(new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 0, 0), 30, 0);
    const bow = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      east[0]!.heading
    );
    expect(bow.x).toBeCloseTo(1);
    expect(bow.z).toBeCloseTo(0);
  });

  it('puts a positive offset to the right of the line and a negative one to the left', () => {
    // Heading north, right is east (+x)
    expect(mooredBerths(south, north, 30, 7)[0]!.position.x).toBeCloseTo(7);
    expect(mooredBerths(south, north, 30, -7)[0]!.position.x).toBeCloseTo(-7);
  });

  it('gives no berths on a segment shorter than one boat', () => {
    expect(mooredBerths(south, new THREE.Vector3(0, 0, 80), 30, 0)).toEqual([]);
  });
});
