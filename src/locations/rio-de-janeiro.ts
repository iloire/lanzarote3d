import terrainModel from '../../assets/locations/rio-de-janeiro.glb';
import config from './rio-de-janeiro.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * Pedra Bonita over São Conrado, with Pedra da Gávea, Dois Irmãos, the Tijuca forest, Corcovado
 * and the Sugarloaf around it. Terrain: uv run 3d/dem-to-glb.py src/locations/rio-de-janeiro.json
 * assets/locations/rio-de-janeiro.glb
 */
export const RIO_DE_JANEIRO: Location = demLocation(config, terrainModel);

export { config as RIO_CONFIG };
