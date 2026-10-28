import * as THREE from 'three';
import type { Location } from '../../locations/types';
import type { CloudSite } from '../../shared/env/environment';
import { LANZAROTE } from '../../locations/lanzarote';
import { RIO_CONFIG, RIO_DE_JANEIRO } from '../../locations/rio-de-janeiro';
import { TENERIFE, TENERIFE_CONFIG } from '../../locations/tenerife';
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
}

/** The relax fields of a location JSON (see src/locations/README.md) */
interface DemSceneConfig extends DemLocationConfig {
  soaringLoop: { waypoints: number[][] };
  camera: { at: number[]; lookAt: number[] };
  clouds: { at: number[]; kind: string; scale: number }[];
}

function demScene(location: Location, config: DemSceneConfig): RelaxScene {
  const anchor = demAnchor(config);
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
  },
  'rio-de-janeiro': demScene(RIO_DE_JANEIRO, RIO_CONFIG),
  tenerife: demScene(TENERIFE, TENERIFE_CONFIG),
};

export const DEFAULT_SCENE = 'lanzarote';
