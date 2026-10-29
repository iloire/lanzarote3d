import terrainModel from '../../assets/locations/giza.glb';
import monumentsModel from '../../assets/locations/giza-monuments.glb';
import config from './giza.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The Giza plateau: the three pyramids course by course, their queens, the Sphinx, the temples,
 * causeways and mastaba fields, and Nazlet el-Samman below the escarpment.
 * Ground: uv run 3d/dem-to-glb.py src/locations/giza.json assets/locations/giza.glb;
 * monuments: uv run 3d/giza-to-glb.py src/locations/giza.json assets/locations/giza-monuments.glb
 */
export const GIZA: Location = demLocation(config, terrainModel);

export { config as GIZA_CONFIG, monumentsModel as GIZA_MONUMENTS };
