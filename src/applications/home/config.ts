import * as THREE from 'three';
import type {
  GliderOptions,
  GliderPatch,
  ParagliderVoxelOptions,
} from '../../foundation/components/vehicles';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import { FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';
import type { BackdropSwaySettings, CameraFollowSettings } from './cameraFollow';

export type ParagliderVoxelConfig = {
  options: ParagliderVoxelOptions;
  /** Where on the ridge loop this pilot starts, 0 to 1, so the pilots spread out */
  startProgress: number;
  /** Shifts this pilot's copy of the loop so the pilots don't fly through each other */
  pathOffset: THREE.Vector3;
  /** A loop of this pilot's own, flown instead of the shared one (pathOffset still applies) */
  waypoints?: THREE.Vector3[];
};

export type HanggliderConfig = {
  scale: number;
  speed: number;
  /** The loop it flies: the ridge loop raised and widened, so it soars above the paragliders */
  waypoints: THREE.Vector3[];
  waypointTension: number;
};

export type CessnaConfig = {
  position: THREE.Vector3;
  scale: number;
  bodyColor: string;
  wingColor: string;
  propellerColor: string;
  windowColor: string;
  stripeColor: string;
  flightPattern: FlightPattern;
  speed: number;
  turnSpeed: number;
  flightRadius: number;
  returnDistance: number;
  minHeight: number;
  maxHeight: number;
  obstacleAvoidanceDistance: number;
  forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
};

export type HerculesConfig = {
  position: THREE.Vector3;
  scale: number;
  bodyColor: string;
  wingColor: string;
  propellerColor: string;
  windowColor: string;
  flightPattern: FlightPattern;
  speed: number;
  turnSpeed: number;
  flightRadius: number;
  returnDistance: number;
  minHeight: number;
  maxHeight: number;
  obstacleAvoidanceDistance: number;
  forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
  waypoints?: THREE.Vector3[];
  waypointTension?: number;
  waypointLoop?: boolean;
};

/**
 * Ridge-soaring beat along the Famara cliff, flown as a closed loop by every pilot. The first
 * point is where the camera arrives, so the lead pilot starts in view. It clears the terrain
 * by at least ~130 m everywhere; check that again after moving a point.
 */
export const RIDGE_LOOP: THREE.Vector3[] = [
  // South along the cliff edge, out over the sea and back north in front of the cliff
  new THREE.Vector3(6897, 920, -705),
  new THREE.Vector3(7120, 905, -1050),
  new THREE.Vector3(7330, 890, -1400),
  new THREE.Vector3(7230, 875, -1620),
  new THREE.Vector3(6980, 880, -1250),
  new THREE.Vector3(6650, 895, -600),
  new THREE.Vector3(6380, 915, -50),
  new THREE.Vector3(6400, 935, 250),
  new THREE.Vector3(6620, 935, -150),
];
export const RIDGE_LOOP_TENSION = 0.5;
export const PARAGLIDER_SPEED = 15;

/** Raises the ridge loop by `rise` and widens it about its centre by `widen` */
function liftLoop(rise: number, widen: number): THREE.Vector3[] {
  const centre = RIDGE_LOOP.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(
    RIDGE_LOOP.length
  );
  return RIDGE_LOOP.map(p =>
    p
      .clone()
      .sub(centre)
      .multiplyScalar(widen)
      .add(centre)
      .setY(p.y + rise)
  );
}

/** A panel and its mirror image on the other half */
const mirrored = (patch: GliderPatch): GliderPatch[] => [
  patch,
  { ...patch, from: [-patch.from[0], patch.from[1]], to: [-patch.to[0], patch.to[1]] },
];

/**
 * The Ozone Rush's design, the same on both halves: a swoosh from the nose by the centre out and
 * back, a hook behind it bending in from the trailing edge, a bar further out, the swoosh colour
 * again at the tips and two accent stripes across their noses.
 */
const ozoneRush = (colors: {
  base: string;
  swoosh: string;
  accent: string;
  inlets: string;
}): GliderOptions => ({
  kind: 'rush',
  wingColor1: colors.base,
  wingColor2: colors.base,
  stripeColor: colors.accent,
  stripeChord: 0.3,
  inletsColor: colors.inlets,
  patches: (
    [
      { color: colors.swoosh, from: [0.03, 0], to: [0.03, 0.12], width: 0.04 },
      { color: colors.swoosh, from: [0.03, 0.12], to: [0.4, 0.5], width: 0.045 },
      { color: colors.accent, from: [0.56, 1], to: [0.56, 0.8], width: 0.06 },
      { color: colors.accent, from: [0.56, 0.8], to: [0.45, 0.5], width: 0.06 },
      { color: colors.accent, from: [0.63, 1], to: [0.63, 0.75], width: 0.04 },
      { color: colors.accent, from: [0.63, 0.75], to: [0.73, 0.5], width: 0.06 },
      { color: colors.swoosh, from: [0.8, 0.42], to: [0.95, 0.55], width: 0.06 },
    ] satisfies GliderPatch[]
  ).flatMap(mirrored),
  numeroCajones: 35,
});

/** Ivan's: red, navy swoosh, yellow accents */
export const IVAN_RUSH = ozoneRush({
  base: '#f01e12',
  swoosh: '#2b4a66',
  accent: '#f5c800',
  inlets: '#9e1810',
});

/** Jehosua's: black with a red swoosh */
export const JEHOSUA_RUSH = ozoneRush({
  base: '#1c1c1c',
  swoosh: '#d42020',
  accent: '#1c1c1c',
  inlets: '#0e0e0e',
});

/** Magne's: lime, deep blue swoosh, steel blue accents */
export const MAGNE_RUSH = ozoneRush({
  base: '#b4dc2c',
  swoosh: '#2010c0',
  accent: '#3f86b0',
  inlets: '#8a9a1c',
});

/**
 * The Niviuk Roller's design, on the top surface: the front half of the right tip in the tip
 * colour, an accent line just behind it out to the tip, stepping forward to the nose left of
 * centre, and a pale underside.
 */
const niviukRoller = (colors: { base: string; accent: string; tip: string }): GliderOptions => ({
  kind: 'roller',
  wingColor1: colors.base,
  wingColor2: colors.base,
  undersideColor: '#d8dbd6',
  inletsColor: colors.tip,
  patches: [
    { color: colors.tip, from: [0.48, 0.25], to: [1.1, 0.25], width: 0.25 },
    { color: colors.accent, from: [-0.12, 0.05], to: [0.3, 0.6], width: 0.08 },
    { color: colors.accent, from: [0.3, 0.62], to: [1.1, 0.62], width: 0.05 },
  ],
  numeroCajones: 30,
});

/** A common roller: teal, yellow accents, black tip */
export const GREEN_ROLLER = niviukRoller({ base: '#17806f', accent: '#f0b830', tip: '#2a2a2a' });

/** The same roller in purple */
export const PURPLE_ROLLER = niviukRoller({ base: '#b45be0', accent: '#f0c020', tip: '#1c1c1c' });

/** The first pilot leads: the camera flies in to it and follows it round the loop */
export const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    options: {
      glider: IVAN_RUSH,
      pilot: { characterType: CharacterType.IVAN },
    },
    startProgress: 0,
    pathOffset: new THREE.Vector3(0, 0, 0),
  },
  {
    options: {
      // On a roller, so he laps the loop half as fast again as the others
      glider: GREEN_ROLLER,
      pilot: { characterType: CharacterType.MIGUEL },
    },
    startProgress: 0.04,
    pathOffset: new THREE.Vector3(-30, 25, 20),
  },
  {
    options: {
      glider: JEHOSUA_RUSH,
      pilot: { characterType: CharacterType.JEHOSUA },
    },
    startProgress: 0.35,
    pathOffset: new THREE.Vector3(20, -15, 0),
  },
  {
    options: {
      glider: {
        wingColor1: '#7b2d6b',
        wingColor2: '#e8b830',
        inletsColor: 'white',
        numeroCajones: 35,
      },
      pilot: { characterType: CharacterType.ROOS },
    },
    startProgress: 0.65,
    pathOffset: new THREE.Vector3(-20, 40, -10),
  },
  {
    // Magne is the best of them: his loop is raised clear of everyone's (the others top out
    // at ~975 m, his lowest point is ~1005 m) and widened past the hang glider's, so he is
    // always higher and farther out.
    options: {
      glider: MAGNE_RUSH,
      pilot: { characterType: CharacterType.MAGNE },
    },
    startProgress: 0.2,
    pathOffset: new THREE.Vector3(0, 0, 0),
    waypoints: liftLoop(130, 1.5),
  },
];

export const hanggliderConfig: HanggliderConfig = {
  scale: 1.0,
  // A hang glider trims much faster than a paraglider
  speed: PARAGLIDER_SPEED * 2,
  waypoints: liftLoop(110, 1.25),
  waypointTension: RIDGE_LOOP_TENSION,
};

export const cessnaConfig: CessnaConfig = {
  position: new THREE.Vector3(7200, 1000, 500),
  scale: 3.0,
  bodyColor: '#F4F4F4',
  wingColor: '#E8E8E8',
  propellerColor: '#2C3E50',
  windowColor: '#87CEEB',
  stripeColor: '#FF4500',
  flightPattern: FlightPattern.WAYPOINT,
  speed: 120,
  turnSpeed: 5.0,
  flightRadius: 250,
  returnDistance: 300,
  minHeight: 1000,
  maxHeight: 1500,
  obstacleAvoidanceDistance: 200,
  forwardAxis: 'x',
  waypoints: [
    new THREE.Vector3(6600, 950, -705),
    new THREE.Vector3(6279, 1000, -3155),
    new THREE.Vector3(7879, 980, -5445),
    new THREE.Vector3(8279, 950, -6455),
    new THREE.Vector3(7827, 1050, -3460),
    new THREE.Vector3(5600, 1100, 1205),
    new THREE.Vector3(6200, 1000, 200),
  ],
  waypointTension: 0.6,
  waypointLoop: true,
};

export const herculesConfig: HerculesConfig = {
  position: new THREE.Vector3(6200, 1200, -1200),
  scale: 2.5,
  bodyColor: '#6B7280',
  wingColor: '#4B5563',
  propellerColor: '#1F2937',
  windowColor: '#3B82F6',
  flightPattern: FlightPattern.WAYPOINT,
  speed: 60,
  turnSpeed: 4.0,
  flightRadius: 300,
  returnDistance: 350,
  minHeight: 1100,
  maxHeight: 1600,
  obstacleAvoidanceDistance: 250,
  forwardAxis: 'x',
  waypoints: [
    new THREE.Vector3(5200, 1500, 2000),
    new THREE.Vector3(7500, 1600, 1500),
    new THREE.Vector3(9000, 1550, -4000),
    new THREE.Vector3(8500, 1500, -7500),
    new THREE.Vector3(6500, 1450, -8000),
    new THREE.Vector3(4500, 1400, -5000),
    new THREE.Vector3(4000, 1450, -1000),
    new THREE.Vector3(4800, 1500, 500),
  ],
  waypointTension: 0.3,
  waypointLoop: true,
};

// Visibility flags for easy toggling
export const SHOW_HANGGLIDER = true;
export const SHOW_CESSNA = true;
export const SHOW_HERCULES = true;

// Camera Target Controller
export const SHOW_CAMERA_TARGET_UI = false;

// Animation configuration
export const ANIMATION_DURATION_MS = 6000; // 6 seconds

/**
 * How the camera follows the lead pilot once the intro has landed: it trails on a spring that
 * settles in `smoothTime` and aims `lookAhead` seconds along the pilot's flight, so at a steady
 * speed it sits (lookAhead - smoothTime) × speed ahead, about 12 m for a paraglider, and swings
 * into turns ahead of the pilot. It rolls with a quarter of the pilot's bank.
 */
export const CAMERA_FOLLOW: CameraFollowSettings = {
  smoothTime: 1.2,
  lookAhead: 2,
  velocityResponse: 2,
  rollShare: 0.25,
  rollResponse: 1.5,
};

/** La Graciosa, off the north tip of the island, about 14 km from the ridge */
export const LA_GRACIOSA = new THREE.Vector3(10100, 0, -14800);

/**
 * After the intro the camera keeps La Graciosa, Famara beach and the ocean behind the pilots
 * rather than circling round to the cliff: it sways ±18° about a line 5° seaward of Graciosa,
 * so the cliff never fills the frame, there and back in a minute, until someone takes the
 * controls.
 */
export const CAMERA_SWAY: BackdropSwaySettings = {
  amplitude: THREE.MathUtils.degToRad(18),
  bias: THREE.MathUtils.degToRad(5),
  period: 60,
  response: 0.3,
};

/**
 * True when the scene is shown inside another page (?embed=1), e.g. the
 * lanzaroteparagliding.com landing page. The host page has its own title, so
 * the scene renders without its overlay.
 */
export const isEmbedded = (): boolean => new URLSearchParams(window.location.search).has('embed');
