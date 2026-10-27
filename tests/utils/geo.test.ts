import { geoToWorld, GeoAnchor } from '../../src/shared/geo';

const anchor: GeoAnchor = { lat: 28.92, lon: -13.67, x: 100, z: 200, unitsPerMetre: 0.5 };

describe('geoToWorld', () => {
  it('puts the anchor where it was fitted', () => {
    expect(geoToWorld(anchor.lat, anchor.lon, anchor)).toEqual({ x: 100, z: 200 });
  });

  it('maps north to −z and east to +x', () => {
    const north = geoToWorld(anchor.lat + 0.01, anchor.lon, anchor);
    const east = geoToWorld(anchor.lat, anchor.lon + 0.01, anchor);
    expect(north.z).toBeLessThan(200);
    expect(north.x).toBeCloseTo(100);
    expect(east.x).toBeGreaterThan(100);
    expect(east.z).toBeCloseTo(200);
  });

  it('scales metres to units, shrinking longitude degrees by the latitude', () => {
    // 0.01° of latitude is 1105.74 m; 0.01° of longitude at 28.92° is about 974.7 m
    const north = geoToWorld(anchor.lat + 0.01, anchor.lon, anchor);
    const east = geoToWorld(anchor.lat, anchor.lon + 0.01, anchor);
    expect(200 - north.z).toBeCloseTo(1105.74 * 0.5, 1);
    expect(east.x - 100).toBeCloseTo(974.7 * 0.5, 0);
  });
});
