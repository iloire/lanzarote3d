import * as THREE from 'three';
import type { TownConfig } from '../../shared/env/environment';
import type { HouseStyle } from '../../shared/env/house-group-types';
import type { BoatConfig } from '../../shared/env/boat-group-types';
import type { FlightLoop } from '../home/vehicleLoader';
import type { ParagliderVoxelConfig } from '../home/config';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import type { ShotKey } from './cameraShot';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Where the camera starts: out to sea south-east of the harbour, the town and slope behind it */
export const CAMERA = {
  position: new THREE.Vector3(-2950, 170, 13300),
  lookAt: new THREE.Vector3(-3650, 40, 12700),
};

/**
 * The harbour from harbour.json is placed with its centre here, on the model's coast below the
 * old town, turned by `rotation`, and drawn `exaggeration` times its real size so it matches the houses and boats,
 * which the scenes draw about twice life size.
 */
export const HARBOUR_PLACEMENT = {
  centre: new THREE.Vector3(-3500, 0, 12795),
  exaggeration: 2,
  /** Turned this far anticlockwise (from above) so its east root meets the model's coarser coast */
  rotation: 0.24,
};

/** Spacing of the boats along a pontoon or quay, and how far off its centreline they lie */
export const BERTH_SPACING = 28;
export const PONTOON_BERTH_OFFSET = 7;
export const QUAY_BERTH_OFFSET = 15;

/** Boats for the pontoons, taken in turn; their scale makes each about twice life size */
export const PONTOON_BOATS: BoatConfig[] = [
  { type: 'SmallSailBoat', scale: 1.6 },
  { type: 'Yacht', scale: 0.7 },
  { type: 'SmallSailBoat', scale: 1.6 },
  { type: 'SpeedBoat', scale: 1.0 },
];

/** Fishing boats along the north quay */
export const QUAY_BOATS: BoatConfig[] = Array.from({ length: 4 }, () => ({
  type: 'FishingBoat' as const,
  scale: 1.0,
}));

/**
 * A few boats out at sea south-east of the breakwater, some under way; half their usual scale
 * matches the moored ones
 */
export const BOATS_OUTSIDE = { center: new THREE.Vector3(-3000, 0, 13350), count: 4, scale: 0.5 };

/**
 * The island's building rule: white walls with green or blue doors, windows and trim. Each
 * option is drawn from its list at random.
 */
export const LANZAROTE_STYLE: HouseStyle = {
  types: { DesertHouse: 0.7, DesertHouseWithPool: 0.3 },
  palette: {
    wallColor: ['#FFFFFF', '#F7F5F0', '#F1EEE7'],
    roofColor: ['#E9E5DC', '#DDD8CC'],
    doorColor: ['#1F6E43', '#2E7D4F', '#1E5AA8', '#2B4C7E'],
    windowColor: ['#3E6E8E', '#2F4F5F'],
    accentColor: ['#1F6E43', '#1E5AA8'],
  },
  // Small yards of pale volcanic sand and grey picón
  plot: { scale: 0.5, colors: ['#D8CFBF', '#CFC6B4', '#A39E95', '#8E8A84'] },
};

/** Blocks of nine along the seafront, a second row behind, and the old town above the harbour */
const block = (x: number, z: number, spacing = 0.8): TownConfig => ({
  position: new THREE.Vector3(x, 0, z),
  houseCount: 9,
  formation: 'grid',
  spacing,
  style: LANZAROTE_STYLE,
});

export const TOWN: TownConfig[] = [
  // Old town, packed tight on the slope above the harbour
  block(-3750, 12560, 0.6),
  block(-3550, 12560, 0.6),
  block(-3350, 12560, 0.6),
  block(-3650, 12380, 0.6),
  block(-3450, 12380, 0.6),
  // The seafront strip running east
  ...[-3100, -2850, -2600, -2350, -2100, -1850, -1600, -1350, -1100, -850, -600, -350, -100].map(
    x => block(x, 12520)
  ),
  // The row behind it
  ...[-3000, -2600, -2200, -1800, -1400, -1000, -600].map(x => block(x, 12280, 1.0)),
  // Scattered houses up the slope
  {
    position: new THREE.Vector3(-2600, 0, 11950),
    houseCount: 30,
    formation: 'rural',
    spacing: 1.5,
    style: LANZAROTE_STYLE,
  },
];

/** Gulls over the harbour */
export const HARBOUR_GULLS = [{ center: new THREE.Vector3(-3500, 120, 12800), count: 10 }];

/** One pilot soaring the Los Ajaches slopes above Playa Quemada, west of the town */
export const PLAYA_QUEMADA_PILOT: ParagliderVoxelConfig = {
  options: {
    glider: {
      wingColor1: '#f2b705',
      wingColor2: '#1d4e89',
      inletsColor: 'white',
      numeroCajones: 35,
    },
    pilot: { characterType: CharacterType.IVAN },
  },
  startProgress: 0,
  pathOffset: new THREE.Vector3(0, 0, 0),
};

/**
 * A loop along the sea-facing slopes above Playa Quemada and out over the bay. The ground below
 * is at most about 350, so it clears it by 100 or more.
 */
export const PLAYA_QUEMADA_LOOP: FlightLoop = {
  waypoints: [
    new THREE.Vector3(-7250, 470, 13300),
    new THREE.Vector3(-7150, 460, 13900),
    new THREE.Vector3(-7250, 450, 14500),
    new THREE.Vector3(-6950, 440, 14300),
    new THREE.Vector3(-6900, 450, 13700),
    new THREE.Vector3(-7000, 465, 13250),
  ],
  tension: 0.5,
};

/**
 * The opening shot, 36 s: round the Playa Quemada pilot, east down the coast, low over the sea
 * to the beacon on the breakwater tip, in along the harbour between the pontoons and the quay,
 * then back and up to CAMERA, where the orbit controls take over. Any click or scroll ends it.
 */
export const INTRO_SHOT: ShotKey[] = [
  { at: 0, position: v(220, 50, -260), lookAt: v(0, 0, 0), followPilot: true },
  { at: 5, position: v(260, 20, 160), lookAt: v(0, 0, 0), followPilot: true },
  { at: 10, position: v(-6300, 330, 13950), lookAt: v(-4300, 60, 12850) },
  { at: 17, position: v(-4400, 110, 13350), lookAt: v(-3700, 20, 12900) },
  { at: 22, position: v(-3830, 16, 13030), lookAt: v(-3620, 8, 12840) },
  { at: 27, position: v(-3660, 13, 12775), lookAt: v(-3420, 10, 12715) },
  { at: 31, position: v(-3350, 60, 12900), lookAt: v(-3550, 20, 12740) },
  { at: 36, position: CAMERA.position, lookAt: CAMERA.lookAt },
];
