import terrainModel from '../../assets/locations/el-hierro.glb';
import config from './el-hierro.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The whole of El Hierro: the takeoffs on the rim of El Golfo above Frontera, El Pinar's pines
 * and the lava of La Restinga. Terrain: uv run 3d/dem-to-glb.py src/locations/el-hierro.json
 * assets/locations/el-hierro.glb
 */
export const EL_HIERRO: Location = demLocation(config, terrainModel);

export { config as EL_HIERRO_CONFIG };
