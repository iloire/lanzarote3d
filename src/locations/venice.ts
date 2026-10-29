import terrainModel from '../../assets/locations/venice.glb';
import cityModel from '../../assets/locations/venice-city.glb';
import config from './venice.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The historic centre of Venice, its islands, canals and buildings from OpenStreetMap.
 * Lagoon floor: uv run 3d/dem-to-glb.py src/locations/venice.json assets/locations/venice.glb;
 * city: uv run 3d/city-to-glb.py src/locations/venice.json assets/locations/venice-city.glb
 */
export const VENICE: Location = demLocation(config, terrainModel);

export { config as VENICE_CONFIG, cityModel as VENICE_CITY };
