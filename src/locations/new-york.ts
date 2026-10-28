import terrainModel from '../../assets/locations/new-york.glb';
import cityModel from '../../assets/locations/new-york-city.glb';
import config from './new-york.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * Midtown Manhattan, river to river from 34th Street to Central Park, its buildings as voxels.
 * Ground: uv run 3d/dem-to-glb.py src/locations/new-york.json assets/locations/new-york.glb;
 * buildings: uv run 3d/city-to-glb.py src/locations/new-york.json assets/locations/new-york-city.glb
 */
export const NEW_YORK: Location = demLocation(config, terrainModel);

export { config as NEW_YORK_CONFIG, cityModel as NEW_YORK_CITY };
