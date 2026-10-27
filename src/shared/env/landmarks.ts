import * as THREE from 'three';
import landmarksData from './landmarks.json';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { getTerrainHeight } from './mesh-utils';
import {
  createCastillo,
  createErmita,
  createMast,
  createMirador,
  createRadarStation,
  createWindsock,
} from '../../foundation/components/scenery/landmarks/Landmarks';
import { MeshBuilder, lowPolyMaterial } from '../../foundation/components/base/lowPolyMesh';
import { buildCanaryPalm } from '../../foundation/components/scenery/trees/CanaryPalm';
import { LevelOfDetail } from '../../foundation/types/lod';

type LandmarkKind = 'radar' | 'ermita' | 'mast' | 'windsock' | 'mirador' | 'palms' | 'castle';

interface LandmarksData {
  scale: number;
  landmarks: {
    name: string;
    kind: LandmarkKind;
    at: [number, number];
    heading?: number;
    height?: number;
    top?: number;
    count?: number;
    radius?: number;
  }[];
}

// JSON arrays type as number[] and kinds as string, not as the pairs and names they hold
const data = landmarksData as unknown as LandmarksData;

type Landmark = LandmarksData['landmarks'][number];

/** Ground lower than this is sea: no palm grows there */
const MIN_LAND_HEIGHT = 2;

/**
 * A grove of `count` Canary palms scattered within `radius` units of (x, z), each on its own
 * ground, built as one mesh around the grove's centre. Seeded, so it grows the same every load.
 */
const createPalmGrove = (
  { count = 30, radius = 300 }: Landmark,
  x: number,
  y: number,
  z: number,
  terrain: THREE.Mesh
): THREE.Object3D => {
  const mesh = new MeshBuilder();
  for (let i = 0; i < count; i++) {
    // Golden-angle spiral with a jitter, for an even but natural spread
    const r = radius * Math.sqrt((i + 0.5) / count) * (0.8 + 0.4 * ((i * 0.618) % 1));
    const a = i * 2.39996;
    const [px, pz] = [x + Math.cos(a) * r, z + Math.sin(a) * r];
    const py = getTerrainHeight(px, pz, terrain);
    if (!(py > MIN_LAND_HEIGHT)) continue;
    const at = new THREE.Vector3(px - x, py - y, pz - z).divideScalar(data.scale);
    buildCanaryPalm(mesh, at, 8 + ((i * 7) % 6), i + 1, LevelOfDetail.LOW);
  }
  return new THREE.Mesh(mesh.build(), lowPolyMaterial());
};

const build: Record<
  LandmarkKind,
  (landmark: Landmark, x: number, y: number, z: number, terrain: THREE.Mesh) => THREE.Object3D
> = {
  radar: () => createRadarStation(),
  ermita: () => createErmita(),
  mast: ({ height }) => createMast(height),
  windsock: () => createWindsock(),
  mirador: () => createMirador(),
  palms: createPalmGrove,
  castle: () => createCastillo(),
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
      if (y > best.y || isNaN(best.y)) best = { x: px, z: pz, y };
    }
  }
  return best;
};

/** The landmarks on the Risco, its takeoffs and Haría's palms, placed from OpenStreetMap and set on the terrain */
export const createLandmarks = (terrain: THREE.Mesh): THREE.Object3D[] =>
  data.landmarks.flatMap(landmark => {
    const {
      name,
      kind,
      at: [lat, lon],
      heading,
      top,
    } = landmark;
    const projected = geoToWorld(lat, lon, ISLAND_ANCHOR);
    const { x, z, y } = top
      ? highestNear(projected.x, projected.z, top, terrain)
      : { ...projected, y: getTerrainHeight(projected.x, projected.z, terrain) };
    if (isNaN(y)) return [];
    const object = build[kind](landmark, x, y, z, terrain);
    object.name = name;
    object.position.set(x, y, z);
    // Compass heading of the front (+z): north is -z, clockwise seen from above. The windsock
    // has none, it turns itself to the wind.
    if (heading !== undefined) object.rotation.y = THREE.MathUtils.degToRad(180 - heading);
    object.scale.setScalar(data.scale);
    return [object];
  });
