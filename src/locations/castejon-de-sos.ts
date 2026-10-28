import terrainModel from '../../assets/locations/castejon-de-sos.glb';
import config from './castejon-de-sos.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The Ésera valley in the Pyrenees: the Liri takeoff under Punta Gallinero, the landing by
 * Castejón de Sos and El Turbón to the south. Terrain: uv run 3d/dem-to-glb.py
 * src/locations/castejon-de-sos.json assets/locations/castejon-de-sos.glb
 */
export const CASTEJON_DE_SOS: Location = demLocation(config, terrainModel);

export { config as CASTEJON_DE_SOS_CONFIG };
