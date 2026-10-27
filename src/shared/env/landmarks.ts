import * as THREE from 'three';
import landmarksData from './landmarks.json';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { getTerrainHeight } from './mesh-utils';
import {
  createErmita,
  createMast,
  createRadarStation,
  createWindsock,
} from '../../foundation/components/scenery/landmarks/Landmarks';

type LandmarkKind = 'radar' | 'ermita' | 'mast' | 'windsock';

interface LandmarksData {
  scale: number;
  landmarks: {
    name: string;
    kind: LandmarkKind;
    at: [number, number];
    heading?: number;
    height?: number;
    top?: number;
  }[];
}

// JSON arrays type as number[] and kinds as string, not as the pairs and names they hold
const data = landmarksData as unknown as LandmarksData;

const build: Record<LandmarkKind, (height?: number) => THREE.Object3D> = {
  radar: createRadarStation,
  ermita: createErmita,
  mast: createMast,
  windsock: createWindsock,
};

/** How many samples a side the `top` search takes over its square */
const TOP_SAMPLES = 9;

/**
 * The highest ground within `radius` of (x, z). The projection can be ~170 units off near the
 * coast, which on the Risco is the difference between the top and the cliff face.
 */
const highestNear = (x: number, z: number, radius: number, terrain: THREE.Mesh) => {
  let best = { x, z, y: getTerrainHeight(x, z, terrain) };
  for (let i = 0; i < TOP_SAMPLES; i++) {
    for (let j = 0; j < TOP_SAMPLES; j++) {
      const px = x + radius * ((2 * i) / (TOP_SAMPLES - 1) - 1);
      const pz = z + radius * ((2 * j) / (TOP_SAMPLES - 1) - 1);
      const y = getTerrainHeight(px, pz, terrain);
      if (!(y <= best.y)) best = { x: px, z: pz, y };
    }
  }
  return best;
};

/** The landmarks on the Risco and its takeoffs, placed from OpenStreetMap and set on the terrain */
export const createLandmarks = (terrain: THREE.Mesh): THREE.Object3D[] =>
  data.landmarks.flatMap(({ name, kind, at: [lat, lon], heading, height, top }) => {
    const projected = geoToWorld(lat, lon, ISLAND_ANCHOR);
    const { x, z, y } = top
      ? highestNear(projected.x, projected.z, top, terrain)
      : { ...projected, y: getTerrainHeight(projected.x, projected.z, terrain) };
    if (isNaN(y)) return [];
    const object = build[kind](height);
    object.name = name;
    object.position.set(x, y, z);
    // Compass heading of the front (+z): north is -z, clockwise seen from above. The windsock
    // has none, it turns itself to the wind.
    if (heading !== undefined) object.rotation.y = THREE.MathUtils.degToRad(180 - heading);
    object.scale.setScalar(data.scale);
    return [object];
  });
