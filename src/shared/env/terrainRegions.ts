import regionsData from './terrain-regions.json';
import { ISLAND_ANCHOR, projectRegions } from '../geo';
import { GroundRegion } from '../../foundation/rendering/regionTint';

/** The ground colour regions from terrain-regions.json, projected into the scene */
export const TERRAIN_REGIONS: GroundRegion[] = projectRegions(regionsData.regions, ISLAND_ANCHOR);
