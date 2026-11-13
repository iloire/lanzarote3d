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
import type { Place } from './places';

/** One place to relax in: where the gliders soar and where the camera watches from */
export interface RelaxScene {
  location: Location;
  /** The place picker groups places by this, in the order they first appear */
  region: string;
  /** The loop the gliders soar, closed */
  loop: THREE.Vector3[];
  /** How far round the loop (0-1) the first pilot starts; 0 unless given */
  loopStart?: number;
  camera: { position: THREE.Vector3; target: THREE.Vector3 };
  /**
   * A flight into the scene before the viewer gets the camera: through `positions`, looking
   * at `targets`, over `seconds`; both end on `camera`
   */
  intro?: { seconds: number; positions: THREE.Vector3[]; targets: THREE.Vector3[] };
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
  /** The pilots who fly the ridge, by character id; the app's first few unless given */
  pilots?: string[];
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
  /** Left out of the place picker: reached only by its ?location= URL */
  unlisted?: boolean;
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
  soaringLoop: { waypoints: number[][]; start?: number };
  camera: {
    at: number[];
    lookAt: number[];
    zoomOut?: number;
    pan?: number;
    orbit?: number;
    intro?: { seconds: number; keys: { at: number[]; lookAt: number[] }[] };
  };
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
  pilots?: string[];
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
    loopStart: config.soaringLoop.start,
    camera: {
      position: demPoint(config, config.camera.at),
      target: demPoint(config, config.camera.lookAt),
    },
    intro: config.camera.intro && {
      seconds: config.camera.intro.seconds,
      positions: [...config.camera.intro.keys.map(key => key.at), config.camera.at].map(at =>
        demPoint(config, at)
      ),
      targets: [...config.camera.intro.keys.map(key => key.lookAt), config.camera.lookAt].map(at =>
        demPoint(config, at)
      ),
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
    pilots: config.pilots,
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
  // Franz and Daniel high over the Caldera del Cuchillo by Tinajo, just under the cumulus: the
  // island model has the bowl about 100 units up, opening north, with its rim at ~300. The
  // clouds' flat bases line up on the horizon when seen from their own height, so the camera
  // stays well under them, looking up at the pilots against the cloud ceiling.
  'el-cuchillo': {
    location: { ...LANZAROTE, id: 'el-cuchillo', name: 'El Cuchillo' },
    region: 'Canary Islands',
    loop: [
      new THREE.Vector3(-1200, 1410, -1300),
      new THREE.Vector3(-400, 1400, -1400),
      new THREE.Vector3(400, 1405, -1380),
      new THREE.Vector3(1100, 1420, -1250),
      new THREE.Vector3(1150, 1400, -1600),
      new THREE.Vector3(400, 1380, -1750),
      new THREE.Vector3(-400, 1375, -1750),
      new THREE.Vector3(-1250, 1390, -1600),
    ],
    pilots: ['franz', 'daniel'],
    // Lower than the theme's 1750, so the bases sit some 100-400 units over the loop
    cloudBase: 1550,
    clouds: [
      { x: -600, z: -1500, kind: 'puff', scale: 1 },
      { x: 900, z: -1900, kind: 'puff', scale: 1 },
      { x: -200, z: -3000, kind: 'tower', scale: 1.4 },
      { x: 2200, z: -800, kind: 'puff', scale: 1.2 },
      { x: -2400, z: -900, kind: 'puff', scale: 1.2 },
    ],
    camera: {
      position: new THREE.Vector3(-200, 1050, 100),
      target: new THREE.Vector3(-100, 1200, -1550),
    },
    limits: { zoomOut: 8, pan: 20000 },
    unlisted: true,
  },
  tenerife: { ...demScene(TENERIFE, TENERIFE_CONFIG), unlisted: true },
  'el-hierro': demScene(EL_HIERRO, EL_HIERRO_CONFIG),
  'castejon-de-sos': { ...demScene(CASTEJON_DE_SOS, CASTEJON_DE_SOS_CONFIG), unlisted: true },
  'rio-de-janeiro': demScene(RIO_DE_JANEIRO, RIO_CONFIG),
  'new-york': demScene(NEW_YORK, NEW_YORK_CONFIG, NEW_YORK_CITY),
  giza: demScene(GIZA, GIZA_CONFIG, GIZA_MONUMENTS),
  paris: demScene(PARIS, PARIS_CONFIG, PARIS_CITY),
  'mont-saint-michel': {
    ...demScene(MONT_SAINT_MICHEL, MONT_SAINT_MICHEL_CONFIG),
    setPiece: montSaintMichel,
    unlisted: true,
  },
  'hong-kong': { ...demScene(HONG_KONG, HONG_KONG_CONFIG, HONG_KONG_CITY), unlisted: true },
  venice: demScene(VENICE, VENICE_CONFIG, VENICE_CITY),
};

export const DEFAULT_SCENE = 'lanzarote';

/** The places in the picker, in order; an unlisted one shows only while it's the one open */
export const pickerPlaces = (current: string): Place[] =>
  Object.entries(RELAX_SCENES)
    .filter(([id, scene]) => !scene.unlisted || id === current)
    .map(([id, scene]) => ({ id, name: scene.location.name, region: scene.region }));
