import terrainModel from '../../assets/locations/hong-kong.glb';
import cityModel from '../../assets/locations/hong-kong-city.glb';
import config from './hong-kong.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * Victoria Harbour at night: Central and Wan Chai under the Peak, Tsim Sha Tsui and Kowloon
 * across the water, its buildings as voxels on the bare ground of the elevation model.
 * Ground: uv run 3d/dem-to-glb.py src/locations/hong-kong.json assets/locations/hong-kong.glb;
 * buildings: uv run 3d/city-on-hills.py src/locations/hong-kong.json assets/locations/hong-kong-city.glb
 */
export const HONG_KONG: Location = demLocation(config, terrainModel);

export { config as HONG_KONG_CONFIG, cityModel as HONG_KONG_CITY };
