import terrainModel from '../../assets/locations/mont-saint-michel.glb';
import mountModel from '../../assets/locations/mont-saint-michel-mount.glb';
import bayTexture from '../../assets/locations/mont-saint-michel-bay.png';
import config from './mont-saint-michel.json';
import { demLocation } from './dem';
import type { Location } from './types';

/**
 * The Bay of Mont-Saint-Michel at the turn of the tide: the flats, the salt meadows and the
 * Mount, all built by uv run 3d/mont-saint-michel-to-glb.py src/locations/mont-saint-michel.json
 * assets/locations
 */
export const MONT_SAINT_MICHEL: Location = demLocation(config, terrainModel);

export {
  config as MONT_SAINT_MICHEL_CONFIG,
  mountModel as MONT_SAINT_MICHEL_MOUNT,
  bayTexture as MONT_SAINT_MICHEL_BAY,
};
