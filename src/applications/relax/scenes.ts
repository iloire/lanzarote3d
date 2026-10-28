import * as THREE from 'three';
import type { Location } from '../../locations/types';
import type { CloudSite } from '../../shared/env/environment';
import { LANZAROTE } from '../../locations/lanzarote';
import { RIO_CONFIG, RIO_DE_JANEIRO } from '../../locations/rio-de-janeiro';
import { demAnchor, demPoint } from '../../locations/dem';
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

const rioAnchor = demAnchor(RIO_CONFIG);

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
  'rio-de-janeiro': {
    location: RIO_DE_JANEIRO,
    loop: RIO_CONFIG.soaringLoop.waypoints.map(at => demPoint(RIO_CONFIG, at)),
    camera: {
      position: demPoint(RIO_CONFIG, RIO_CONFIG.camera.at),
      target: demPoint(RIO_CONFIG, RIO_CONFIG.camera.lookAt),
    },
    clouds: RIO_CONFIG.clouds.map(({ at, kind, scale }) => ({
      ...geoToWorld(at[0], at[1], rioAnchor),
      kind: kind as CloudSite['kind'],
      scale,
    })),
  },
};

export const DEFAULT_SCENE = 'lanzarote';
