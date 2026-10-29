import terrainModel from '../../assets/locations/paris.glb';
import cityModel from '../../assets/locations/paris-city.glb';
import config from './paris.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The Eiffel Tower and round it, Trocadéro to the École Militaire, its buildings and the tower as voxels.
 * Ground: uv run 3d/dem-to-glb.py src/locations/paris.json assets/locations/paris.glb;
 * buildings and the tower: uv run 3d/city-to-glb.py src/locations/paris.json assets/locations/paris-city.glb
 */
export const PARIS: Location = demLocation(config, terrainModel);

export { config as PARIS_CONFIG, cityModel as PARIS_CITY };
