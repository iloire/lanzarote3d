import terrainModel from '../../assets/foundation/models/environment/lanzarote.glb';
import { ISLAND_ANCHOR } from '../shared/geo';
import { TERRAIN_REGIONS } from '../shared/env/terrainRegions';
import type { Location } from './types';

/** The hand-modelled island (3d/lanzarote.blend), Graciosa and the islets included */
export const LANZAROTE: Location = {
  id: 'lanzarote',
  name: 'Lanzarote',
  terrainModel,
  terrainScale: 20000,
  terrainPosition: [0, -10, 0],
  anchor: ISLAND_ANCHOR,
  regions: TERRAIN_REGIONS,
};
