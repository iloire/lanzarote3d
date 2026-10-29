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
import { EL_HIERRO, EL_HIERRO_CONFIG } from '../../locations/el-hierro';
import { NEW_YORK, NEW_YORK_CITY, NEW_YORK_CONFIG } from '../../locations/new-york';
import { GIZA, GIZA_CONFIG, GIZA_MONUMENTS } from '../../locations/giza';
import { PARIS, PARIS_CITY, PARIS_CONFIG } from '../../locations/paris';
import { MONT_SAINT_MICHEL, MONT_SAINT_MICHEL_CONFIG } from '../../locations/mont-saint-michel';
import { HONG_KONG, HONG_KONG_CITY, HONG_KONG_CONFIG } from '../../locations/hong-kong';
import type { AtmosphereTheme } from '../../foundation/types/Theme';
import type { NightLook } from '../../foundation/rendering/nightSky';
import type { CruiseRoute, FerryRoute } from '../../shared/env/harbourBoats';
import type { LaserSite } from '../../shared/env/lightShow';
import { VENICE, VENICE_CITY, VENICE_CONFIG } from '../../locations/venice';
import type { VenetianLandmark } from '../../shared/env/venetianLandmarks';
import { DemLocationConfig, demAnchor, demPoint } from '../../locations/dem';
import { geoToWorld } from '../../shared/geo';
import { RIDGE_LOOP } from '../home/config';
import { montSaintMichel } from './montSaintMichel';
import type { SetPieceLoader } from './setPiece';

/** One place to relax in: where the gliders soar and where the camera watches from */
export interface RelaxScene {
  location: Location;
  /** The place picker groups places by this, in the order they first appear */
  region: string;
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
  /**
   * URL of the place's buildings, in the terrain's world units: a city's from 3d/city-to-glb.py,
   * Giza's monuments and town from 3d/giza-to-glb.py
   */
  city?: string;
  /** Venice's hand-built landmarks, standing on the quays at world height `ground` */
  venetian?: { list: VenetianLandmark[]; anchor: GeoAnchor; ground: number; unitsPerMetre: number };
  /** Fly paramotors, which need no ridge, instead of paragliders */
  paramotor?: boolean;
  /** How many times a wing's speed the paramotor flies; the app's own unless given */
  paramotorSpeed?: number;
  /** Share of the city's cars that are yellow cabs, New York's unless given */
  taxiShare?: number;
  /** FogExp2 density, thicker than the theme's to hide a city's far edges */
  fogDensity?: number;
  look?: SceneLook;
  /** Inland: no sea, the land runs on to the horizon as a plain instead */
  plain?: { color: string; height: number };
  /**
   * Seconds for the camera to circle the place once instead of swaying from side to side; with
   * paramotors, the whole group flies the loop and the camera watches rather than chases
   */
  orbit?: number;
  /** The place's own show, loaded after the environment (Mont-Saint-Michel's tide) */
  setPiece?: SetPieceLoader;
  /** Boats on the harbour, in world x, z */
  harbour?: { ferries: FerryRoute[]; cruises: CruiseRoute[] };
  /** Rooftops that send beams into the night sky */
  lasers?: LaserSite[];
}

/** How a place is lit, where it differs from the theme */
export interface SceneLook {
  /** Hours, for the sun's height and bearing */
  timeOfDay?: number;
  /** Share of the theme's flat ambient light to keep */
  ambient?: number;
  /** The fog's colour, instead of the sky's at the horizon */
  fogColor?: string;
  /** Tone-mapping exposure and warmth, instead of the theme's (0.72 and 0.04) */
  exposure?: number;
  warmth?: number;
  /** Exposure, bloom and grade, over the theme's */
  atmosphere?: AtmosphereTheme;
  /** Night instead of day: the sky, the moon and the light (nightSky.ts) */
  night?: NightLook;
  /** The sea's deep and shallow colours, instead of the theme's (a lagoon's green) */
  seaColor?: string;
  shallowColor?: string;
}

/** The relax fields of a location JSON (see src/locations/README.md) */
interface DemSceneConfig extends DemLocationConfig {
  region: string;
  soaringLoop: { waypoints: number[][] };
  camera: { at: number[]; lookAt: number[]; zoomOut?: number; pan?: number; orbit?: number };
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
  paramotor?: boolean;
  paramotorSpeed?: number;
  /** Built by 3d/city-to-glb.py; `taxis` is the share of its cars that are yellow cabs */
  city?: { voxel: number; taxis?: number };
  /** Metres: the city's land and quays */
  flatLand?: number;
  /** Metres at which the fog has hidden half of what's behind it */
  fog?: number;
  look?: SceneLook;
  /** Metres above sea level */
  plain?: { color: string; height: number };
  harbour?: {
    ferries: { from: number[]; to: number[]; count: number }[];
    cruises: { kind: string; speed: number; route: number[][] }[];
  };
  lasers?: { sites: { at: number[]; beams: number }[] };
  venetian?: { name: string; kind: string; at: number[]; heading?: number; size?: number }[];
}

function demScene(location: Location, config: DemSceneConfig, city?: string): RelaxScene {
  const anchor = demAnchor(config);
  const xz = (at: number[]): [number, number] => {
    const { x, z } = geoToWorld(at[0]!, at[1]!, anchor);
    return [x, z];
  };
  const toHeight = (metres?: number) =>
    metres === undefined ? undefined : metres * config.unitsPerMetre * config.verticalExaggeration;
  return {
    location,
    region: config.region,
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
    city,
    venetian: config.venetian && {
      list: config.venetian.map(landmark => ({
        ...landmark,
        kind: landmark.kind as VenetianLandmark['kind'],
        at: [landmark.at[0]!, landmark.at[1]!],
      })),
      anchor,
      ground: toHeight(config.flatLand ?? 0)!,
      unitsPerMetre: config.unitsPerMetre,
    },
    paramotor: config.paramotor,
    paramotorSpeed: config.paramotorSpeed,
    taxiShare: config.city?.taxis,
    // FogExp2 hides half where (density × distance)² = ln 2
    fogDensity: config.fog && Math.sqrt(Math.LN2) / (config.fog * config.unitsPerMetre),
    look: config.look,
    plain: config.plain && {
      color: config.plain.color,
      height: config.plain.height * config.unitsPerMetre * config.verticalExaggeration,
    },
    orbit: config.camera.orbit,
    harbour: config.harbour && {
      ferries: config.harbour.ferries.map(({ from, to, count }) => ({
        from: xz(from),
        to: xz(to),
        count,
      })),
      cruises: config.harbour.cruises.map(({ kind, speed, route }) => ({
        kind: kind as CruiseRoute['kind'],
        speed,
        route: route.map(xz),
      })),
    },
    lasers: config.lasers?.sites.map(({ at, beams }) => ({ at: demPoint(config, at), beams })),
  };
}

export const RELAX_SCENES: Record<string, RelaxScene> = {
  lanzarote: {
    location: LANZAROTE,
    region: 'Canary Islands',
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
  'el-hierro': demScene(EL_HIERRO, EL_HIERRO_CONFIG),
  'castejon-de-sos': demScene(CASTEJON_DE_SOS, CASTEJON_DE_SOS_CONFIG),
  'rio-de-janeiro': demScene(RIO_DE_JANEIRO, RIO_CONFIG),
  'new-york': demScene(NEW_YORK, NEW_YORK_CONFIG, NEW_YORK_CITY),
  giza: demScene(GIZA, GIZA_CONFIG, GIZA_MONUMENTS),
  paris: demScene(PARIS, PARIS_CONFIG, PARIS_CITY),
  'mont-saint-michel': {
    ...demScene(MONT_SAINT_MICHEL, MONT_SAINT_MICHEL_CONFIG),
    setPiece: montSaintMichel,
  },
  'hong-kong': demScene(HONG_KONG, HONG_KONG_CONFIG, HONG_KONG_CITY),
  venice: demScene(VENICE, VENICE_CONFIG, VENICE_CITY),
};

export const DEFAULT_SCENE = 'lanzarote';
