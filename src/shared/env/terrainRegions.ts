import regionsData from './terrain-regions.json';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { GroundRegion } from '../../foundation/rendering/regionTint';

/** The ground colour regions from terrain-regions.json, projected into the scene */
export const TERRAIN_REGIONS: GroundRegion[] = regionsData.regions.map(region => {
  const [lat, lon] = region.at;
  const { x, z } = geoToWorld(lat, lon, ISLAND_ANCHOR);
  return {
    x,
    z,
    radius: region.radius * ISLAND_ANCHOR.unitsPerMetre,
    color: region.color,
    strength: region.strength,
  };
});
