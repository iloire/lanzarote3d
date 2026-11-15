import terrainModel from '../../assets/locations/los-giles.glb';
import config from './los-giles.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * Los Giles on the north coast of Gran Canaria: ridge soaring on the cliff above El Rincón,
 * Las Palmas and La Isleta to the east. Terrain: uv run 3d/dem-to-glb.py
 * src/locations/los-giles.json assets/locations/los-giles.glb
 */
export const LOS_GILES: Location = demLocation(config, terrainModel);

export { config as LOS_GILES_CONFIG };
