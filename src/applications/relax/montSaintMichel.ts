import * as THREE from 'three';
import Models from '../../foundation/utils/models';
import { addMountStone } from '../../foundation/rendering/mountStone';
import { OceanMaterial } from '../../foundation/rendering/OceanMaterial';
import { TidalBay } from '../../foundation/rendering/tidalBay';
import { BayWalkers, bayFlocks } from '../../shared/env/bayLife';
import { Tide } from '../../shared/env/tide';
import {
  MONT_SAINT_MICHEL_BAY,
  MONT_SAINT_MICHEL_CONFIG,
  MONT_SAINT_MICHEL_MOUNT,
} from '../../locations/mont-saint-michel';
import { createTideGauge } from './tideGauge';
import type { SetPieceLoader } from './setPiece';

// Same constants as src/shared/geo.ts and 3d/mont-saint-michel-to-glb.py
const METRES_PER_DEGREE_LAT = 110574;
const METRES_PER_DEGREE_LON_AT_EQUATOR = 111320;
// The R channel of the bay texture at full scale, metres (CARVE_MAX in the script)
const CARVE_MAX = 5;
// The open sea beyond the bay's own water sits this far under the tide, metres, so the two
// never fight where they overlap
const SEA_UNDER_TIDE = 0.6;
// Where in the tide the scene opens (0 low water, 0.5 high water): early in the flood, so the
// sea is already on its way in. ?tide= overrides it.
const OPENING_TIDE = 0.12;

/**
 * Mont-Saint-Michel at the turn of the tide: the Mount and Tombelaine on the flats, the bay's
 * painted ground and its tide rising over the sand and falling back, sheep on the salt meadows,
 * walkers crossing the sand while it's dry, and a gauge showing how high the water stands.
 */
export const montSaintMichel: SetPieceLoader = async ({ scene, terrain, water }) => {
  const config = MONT_SAINT_MICHEL_CONFIG;
  const up = config.unitsPerMetre * config.verticalExaggeration;
  const tide = new Tide(config.tide);
  const asked = Number(new URLSearchParams(window.location.search).get('tide'));
  const opening = Number.isFinite(asked) && asked > 0 ? asked : OPENING_TIDE;
  // Seconds into the cycle where the scene opens: a share of the full tide, flood then ebb
  const fromLow = (share: number) =>
    share < 0.5
      ? share * 2 * config.tide.flood * config.tide.period
      : (config.tide.flood + (share - 0.5) * 2 * (1 - config.tide.flood)) * config.tide.period;
  const start = fromLow(opening % 1);

  const [mount, bayTexture] = await Promise.all([
    Models.loadGltf(MONT_SAINT_MICHEL_MOUNT),
    new THREE.TextureLoader().loadAsync(MONT_SAINT_MICHEL_BAY),
  ]);
  mount.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    // Every triangle has its own corners, so these are the faces' own normals
    object.geometry.computeVertexNormals();
    addMountStone(object, up);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  scene.add(mount.scene);
  const extras = mount.scene.getObjectByName('Mount')?.userData ?? {};

  bayTexture.colorSpace = THREE.NoColorSpace;
  bayTexture.anisotropy = 8;
  const { bbox, unitsPerMetre } = config;
  const lat0 = (bbox.north + bbox.south) / 2;
  const width =
    (bbox.east - bbox.west) *
    Math.cos(THREE.MathUtils.degToRad(lat0)) *
    METRES_PER_DEGREE_LON_AT_EQUATOR *
    unitsPerMetre;
  const depth = (bbox.north - bbox.south) * METRES_PER_DEGREE_LAT * unitsPerMetre;
  const bay = new TidalBay(terrain, {
    texture: bayTexture,
    bounds: new THREE.Vector4(-width / 2, -depth / 2, width, depth),
    unitsUp: up,
    carveMax: CARVE_MAX,
    low: config.tide.low,
    high: config.tide.high,
  });
  scene.add(bay.ground, bay.water);
  if (scene.fog instanceof THREE.FogExp2) bay.setHaze(scene.fog.color);

  // The open sea rises and falls with the tide; its surf and shallows were baked for a sea at
  // 0 m, so it goes without them
  const ocean = water?.material;
  if (ocean instanceof OceanMaterial) ocean.oceanUniforms.uHasCoast.value = 0;

  const flocks = bayFlocks((extras['sheep'] as number[] | undefined) ?? [], up);
  scene.add(flocks);
  const walkers = new BayWalkers(
    (extras['walkers'] as number[] | undefined) ?? [],
    config.walkers.count,
    up
  );
  scene.add(walkers.mesh);
  const gauge = createTideGauge(tide);

  const update = (deltaTime: number, elapsed: number) => {
    const seconds = start + elapsed;
    const level = tide.level(seconds);
    bay.setTide(level, tide.phase(seconds));
    if (water) water.position.y = (level - SEA_UNDER_TIDE) * up;
    walkers.update(deltaTime, level * up);
    gauge.update(seconds);
  };
  update(0, 0);

  return {
    update,
    dispose: () => {
      gauge.remove();
      bay.dispose();
      walkers.dispose();
      flocks.geometry.dispose();
      (flocks.material as THREE.Material).dispose();
      scene.remove(mount.scene, bay.ground, bay.water, flocks, walkers.mesh);
    },
  };
};
