import * as THREE from 'three';
import type { Location } from '../../locations/types';
import type { CloudSite, TownConfig } from '../../shared/env/environment';
import type { ScatterArea, ScatterKind } from '../../shared/env/scatter';
import type { Landmark } from '../../shared/env/landmarks';
import type { GeoAnchor } from '../../shared/geo';
import { LANZAROTE } from '../../locations/lanzarote';
import { RIO_CONFIG, RIO_DE_JANEIRO } from '../../locations/rio-de-janeiro';
import { TENERIFE, TENERIFE_CONFIG } from '../../locations/tenerife';
import { CASTEJON_DE_SOS, CASTEJON_DE_SOS_CONFIG } from '../../locations/castejon-de-sos';
import { DemLocationConfig, demAnchor, demPoint } from '../../locations/dem';
import { geoToWorld } from '../../shared/geo';
import { RIDGE_LOOP } from '../home/config';

/** One place to relax in: where the gliders soar and where the camera watches from */
export interface RelaxScene {
  location: Location;
  /** The loop the gliders soar, closed */
  loop: THREE.Vector3[];
  camera: { position: THREE.Vector3; target: THREE.Vector3 };
  /** Lanzarote's cumulus unless given */
  clouds?: CloudSite[];
  /** World height of the cloud base; the theme's (Lanzarote's) unless given */
  cloudBase?: number;
  /**
   * How far the viewer may take the camera, so a terrain's edges never show: how many times the
   * starting distance it may zoom out (1.5) and how far, in world units, it may pan (3000)
   */
  limits?: { zoomOut?: number; pan?: number };
  towns?: TownConfig[];
  scatter?: ScatterArea[];
  landmarks?: { list: Landmark[]; anchor: GeoAnchor };
}

/** The relax fields of a location JSON (see src/locations/README.md) */
interface DemSceneConfig extends DemLocationConfig {
  soaringLoop: { waypoints: number[][] };
  camera: { at: number[]; lookAt: number[]; zoomOut?: number; pan?: number };
  clouds: { at: number[]; kind: string; scale: number }[];
  /** Metres above sea level */
  cloudBase?: number;
  towns?: { at: number[]; houseCount: number; formation: string; spacing?: number }[];
  scatter?: {
    kind: string;
    at: number[];
    radius: number;
    count: number;
    minAltitude?: number;
    maxAltitude?: number;
    /** Degrees, for buildings: the street grid's turn from east, towards north */
    heading?: number;
  }[];
  landmarks?: { name: string; kind: string; at: number[]; heading?: number; top?: number }[];
}

function demScene(location: Location, config: DemSceneConfig): RelaxScene {
  const anchor = demAnchor(config);
  const toHeight = (metres?: number) =>
    metres === undefined ? undefined : metres * config.unitsPerMetre * config.verticalExaggeration;
  return {
    location,
    loop: config.soaringLoop.waypoints.map(at => demPoint(config, at)),
    camera: {
      position: demPoint(config, config.camera.at),
      target: demPoint(config, config.camera.lookAt),
    },
    clouds: config.clouds.map(({ at, kind, scale }) => ({
      ...geoToWorld(at[0], at[1], anchor),
      kind: kind as CloudSite['kind'],
      scale,
    })),
    cloudBase: toHeight(config.cloudBase),
    limits: {
      zoomOut: config.camera.zoomOut,
      pan: config.camera.pan,
    },
    // Houses settle onto the terrain, so the town centre's height doesn't matter
    towns: config.towns?.map(({ at, houseCount, formation, spacing }) => ({
      position: demPoint(config, [at[0]!, at[1]!, 0]),
      houseCount,
      formation: formation as TownConfig['formation'],
      spacing,
    })),
    scatter: config.scatter?.map(area => ({
      kind: area.kind as ScatterKind,
      ...geoToWorld(area.at[0]!, area.at[1]!, anchor),
      radius: area.radius * config.unitsPerMetre,
      count: area.count,
      minHeight: toHeight(area.minAltitude),
      maxHeight: toHeight(area.maxAltitude),
      heading: area.heading === undefined ? undefined : THREE.MathUtils.degToRad(area.heading),
    })),
    landmarks: config.landmarks && {
      list: config.landmarks.map(landmark => ({
        ...landmark,
        kind: landmark.kind as Landmark['kind'],
        at: [landmark.at[0]!, landmark.at[1]!],
      })),
      anchor,
    },
  };
}

export const RELAX_SCENES: Record<string, RelaxScene> = {
  lanzarote: {
    location: LANZAROTE,
    // The Famara ridge loop of the home scene, watched from out over the sea
    loop: RIDGE_LOOP,
    camera: {
      position: new THREE.Vector3(5600, 980, -150),
      target: new THREE.Vector3(6850, 880, -700),
    },
    // The whole island, sea all round: nothing to hide, so look anywhere
    limits: { zoomOut: 8, pan: 20000 },
  },
  tenerife: demScene(TENERIFE, TENERIFE_CONFIG),
  'rio-de-janeiro': demScene(RIO_DE_JANEIRO, RIO_CONFIG),
  'castejon-de-sos': demScene(CASTEJON_DE_SOS, CASTEJON_DE_SOS_CONFIG),
};

export const DEFAULT_SCENE = 'lanzarote';
