import * as THREE from 'three';
import { GeoAnchor, RegionConfig, geoToWorld, projectRegions } from '../shared/geo';
import type { Location } from './types';

/**
 * The JSON a location built from elevation data is described by (src/locations/<id>.json).
 * 3d/dem-to-glb.py reads the same file to build the terrain, so the two always agree.
 */
export interface DemLocationConfig {
  id: string;
  name: string;
  bbox: { south: number; north: number; west: number; east: number };
  /** Grid spacing of the terrain, metres */
  spacing: number;
  unitsPerMetre: number;
  /** Heights are stretched by this much so the relief reads from the air */
  verticalExaggeration: number;
  regions: RegionConfig[];
}

/** The GLB's origin is the centre of the bbox, unturned */
export function demAnchor(config: DemLocationConfig): GeoAnchor {
  const { bbox, unitsPerMetre } = config;
  return {
    lat: (bbox.north + bbox.south) / 2,
    lon: (bbox.east + bbox.west) / 2,
    x: 0,
    z: 0,
    unitsPerMetre,
  };
}

/** [lat, lon, metres above sea level] → world position, stretched like the terrain */
export function demPoint(config: DemLocationConfig, at: number[]): THREE.Vector3 {
  const [lat, lon, metres = 0] = at;
  const { x, z } = geoToWorld(lat, lon, demAnchor(config));
  return new THREE.Vector3(x, metres * config.unitsPerMetre * config.verticalExaggeration, z);
}

/** A location whose terrain 3d/dem-to-glb.py built from `config`; the GLB is in world units */
export function demLocation(config: DemLocationConfig, terrainModel: string): Location {
  const anchor = demAnchor(config);
  return {
    id: config.id,
    name: config.name,
    terrainModel,
    terrainScale: 1,
    terrainPosition: [0, 0, 0],
    anchor,
    regions: projectRegions(config.regions, anchor),
  };
}
