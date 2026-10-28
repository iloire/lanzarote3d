import terrainModel from '../../assets/locations/tenerife.glb';
import config from './tenerife.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The south-west of Tenerife: Taucho above Adeje, the landing at La Caleta, and El Teide with
 * Pico Viejo and Las Cañadas behind. Terrain: uv run 3d/dem-to-glb.py src/locations/tenerife.json
 * assets/locations/tenerife.glb
 */
export const TENERIFE: Location = demLocation(config, terrainModel);

export { config as TENERIFE_CONFIG };
