import * as THREE from 'three';
import type {
  GliderOptions,
  GliderPatch,
  ParagliderVoxelOptions,
} from '../../foundation/components/vehicles';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import { FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';
import type { BackdropSwaySettings, CameraFollowSettings } from './cameraFollow';
import type { TwistSettings, WingoverSettings } from './paragliderMotion';

export type ParagliderVoxelConfig = {
  options: ParagliderVoxelOptions;
  /** Where on the ridge loop this pilot starts, 0 to 1, so the pilots spread out */
  startProgress: number;
  /** Shifts this pilot's copy of the loop so the pilots don't fly through each other */
  pathOffset: THREE.Vector3;
  /** A loop of this pilot's own, flown instead of the shared one (pathOffset still applies) */
  waypoints?: THREE.Vector3[];
  /** Twists thrown now and then, spinning round to fly looking backwards */
  twist?: TwistSettings;
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

/**
 * How pilots on rollers fly: they keep the ridge loop but fly it `drop` lower, and now and
 * then throw two to four wingovers, then fly straight for 20 s to a minute (see
 * WingoverSettings). Their speed is the roller's speedFactor in Glider.ts.
 */
export const ROLLER_FLIGHT: { drop: number; wingover: WingoverSettings } = {
  drop: 40,
  wingover: {
    period: 8,
    sway: 60,
    climb: 30,
    bank: THREE.MathUtils.degToRad(60),
    turns: [2, 4],
    rest: [20, 60],
  },
};

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

/** Adri's: yellow, navy swoosh, white accents */
export const ADRI_RUSH = ozoneRush({
  base: '#f5c400',
  swoosh: '#1f3a6e',
  accent: '#ffffff',
  inlets: '#b08c00',
});

/**
 * David's Ozone Delta 4: blue at the front, red behind, split by a thin yellow line along the
 * span that steps forward round a red bump in the middle of the wing.
 */
const DELTA_YELLOW = '#f2cc2a';
const DELTA_RED = '#d6322a';
export const DAVID_DELTA: GliderOptions = {
  wingColor1: '#3f6ea8',
  wingColor2: '#3f6ea8',
  undersideColor: '#b02a22',
  inletsColor: '#2a4a78',
  patches: [
    // The bump: yellow sides slanting out from its front edge, red filled in row by row
    { color: DELTA_YELLOW, from: [0.1, 0.2], to: [0.18, 0.5], width: 0.03 },
    { color: DELTA_YELLOW, from: [-0.1, 0.2], to: [-0.18, 0.5], width: 0.03 },
    { color: DELTA_YELLOW, from: [-0.1, 0.2], to: [0.1, 0.2], width: 0.03 },
    { color: DELTA_RED, from: [-0.12, 0.3], to: [0.12, 0.3], width: 0.02 },
    { color: DELTA_RED, from: [-0.14, 0.4], to: [0.14, 0.4], width: 0.02 },
    { color: DELTA_RED, from: [-0.17, 0.5], to: [0.17, 0.5], width: 0.02 },
    { color: DELTA_YELLOW, from: [-1.1, 0.5], to: [1.1, 0.5], width: 0.03 },
    { color: DELTA_RED, from: [-1.1, 0.775], to: [1.1, 0.775], width: 0.2 },
  ],
  numeroCajones: 32,
};

/**
 * Franz's Ozone Buzz Z6, asymmetric on top: blue, except on the right half, where a white line
 * edged in grey in front runs diagonally from the trailing edge at the centre to 38% of the
 * chord at the tip, with lime behind it. The underside is lime.
 */
const BUZZ_LIME = '#a8d42c';
export const FRANZ_BUZZ: GliderOptions = {
  wingColor1: '#1f86d8',
  wingColor2: '#1f86d8',
  undersideColor: BUZZ_LIME,
  inletsColor: '#16609c',
  patches: [
    { color: '#f4f6f6', from: [0.0, 0.85], to: [1.05, 0.38], width: 0.05 },
    { color: '#7a8682', from: [-0.012, 0.743], to: [1.038, 0.273], width: 0.06 },
    { color: BUZZ_LIME, from: [0.071, 1.484], to: [1.121, 1.014], width: 0.6 },
  ],
  numeroCajones: 27,
};

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
  // The real one has 35 cells, so 17 a side: fewer and fatter than a Rush's
  numeroCajones: 17,
});

/** A common roller: teal, yellow accents, black tip */
export const GREEN_ROLLER = niviukRoller({ base: '#17806f', accent: '#f0b830', tip: '#2a2a2a' });

/** The same roller in purple */
export const PURPLE_ROLLER = niviukRoller({ base: '#b45be0', accent: '#f0c020', tip: '#1c1c1c' });

/**
 * The Niviuk Ikuma's design, the same on both halves: the front of each tip in the tip colour,
 * edged by a thin white line running back to the trailing edge, a white flash swept back from
 * the nose further in, and a pale underside.
 */
const niviukIkuma = (colors: { base: string; tip: string; inlets: string }): GliderOptions => ({
  wingColor1: colors.base,
  wingColor2: colors.base,
  undersideColor: '#e6e6e6',
  inletsColor: colors.inlets,
  patches: (
    [
      { color: colors.tip, from: [0.96, 0], to: [0.96, 0.45], width: 0.22 },
      { color: '#f4f4f4', from: [0.82, 0], to: [0.88, 1], width: 0.025 },
      { color: '#f4f4f4', from: [0.55, 0.05], to: [0.74, 0.35], width: 0.07 },
    ] satisfies GliderPatch[]
  ).flatMap(mirrored),
  numeroCajones: 27,
});

/** Fabio's: pink with black tips */
export const FABIO_IKUMA = niviukIkuma({ base: '#9c1a58', tip: '#161616', inlets: '#6a1040' });

/**
 * Roos's Ozone Mojo: turquoise at the front, purple behind, split by a white band along the span
 * that rises in a sharp peak into the purple either side of the centre. The underside is pale.
 */
const MOJO_WHITE = '#f4f2f6';
const MOJO_PURPLE = '#9a38bc';
/** Where the white band runs on each half, as (span, chord) points from the centre out */
const MOJO_EDGE: [number, number][] = [
  [0, 0.46],
  [0.17, 0.5],
  [0.3, 0.8],
  [0.42, 0.56],
  [0.7, 0.5],
  [1.1, 0.45],
];
/** The white band's chord position at span s, between the MOJO_EDGE points */
const mojoEdgeAt = (s: number): number => {
  const i = Math.max(1, MOJO_EDGE.findIndex(([span]) => span >= s));
  const [[s0, c0], [s1, c1]] = [MOJO_EDGE[i - 1], MOJO_EDGE[i]];
  return c0 + ((s - s0) / (s1 - s0)) * (c1 - c0);
};
export const ROOS_MOJO: GliderOptions = {
  wingColor1: '#34a4d4',
  wingColor2: '#34a4d4',
  undersideColor: '#e6deee',
  inletsColor: '#1f7aa6',
  patches: [
    // The white band first, so it wins over the purple strips that start on it
    ...MOJO_EDGE.slice(1).map(
      (to, i): GliderPatch => ({ color: MOJO_WHITE, from: MOJO_EDGE[i], to, width: 0.06 })
    ),
    // The purple filled in chordwise strips from the band back past the trailing edge
    ...Array.from({ length: 23 }, (_, i): GliderPatch => {
      const s = i * 0.05;
      return { color: MOJO_PURPLE, from: [s, mojoEdgeAt(s)], to: [s, 1.2], width: 0.06 };
    }),
  ].flatMap(mirrored),
  numeroCajones: 35,
};

/** The pilot the camera flies in to and follows round the loop, unless ?pilot= picks another */
export const LEAD_PILOT = CharacterType.IVAN;

/**
 * They spread out along the Risco: Roos low by takeoff at the south-west end, the middle group
 * stepped up the cliff towards La Graciosa every ~500 m, each higher than the last (865-1147 m,
 * every one at least 124 m clear of the ground), then Bernt and Magne far out and highest.
 * They are listed in that order, so the arrows step from takeoff up the Risco.
 */
export const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    options: {
      glider: ROOS_MOJO,
      pilot: { characterType: CharacterType.ROOS },
    },
    // Low and close to takeoff: a short beat of her own at the south-west end of the Risco,
    // where the cliff bends round towards Teguise, away from La Graciosa. 690-760 m, about
    // 180 m under the ridge loop and at least 99 m clear of the ground.
    startProgress: 0.65,
    pathOffset: new THREE.Vector3(0, 0, 0),
    waypoints: [
      new THREE.Vector3(6600, 760, -420),
      new THREE.Vector3(6300, 730, -120),
      new THREE.Vector3(6000, 710, 150),
      new THREE.Vector3(5750, 700, 300),
      new THREE.Vector3(5650, 690, 150),
      new THREE.Vector3(5900, 690, -100),
      new THREE.Vector3(6250, 700, -350),
      new THREE.Vector3(6550, 720, -650),
      new THREE.Vector3(6750, 750, -650),
    ],
  },
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
      glider: ADRI_RUSH,
      pilot: { characterType: CharacterType.ADRI },
    },
    // 0.2 km up the cliff, between Ivan and Miguel
    startProgress: 0.6,
    pathOffset: new THREE.Vector3(74, 15, -221),
  },
  {
    options: {
      // On the pink roller, so he flies faster and lower than the others, throwing wingovers
      glider: PURPLE_ROLLER,
      pilot: { characterType: CharacterType.MIGUEL },
    },
    // 0.45 km up the cliff (the roller's drop takes his 30 m rise to -10)
    startProgress: 0.04,
    pathOffset: new THREE.Vector3(147, 30, -442),
  },
  {
    options: {
      glider: DAVID_DELTA,
      pilot: { characterType: CharacterType.DAVID },
    },
    // 0.95 km up the cliff
    startProgress: 0.12,
    pathOffset: new THREE.Vector3(488, 80, -816),
  },
  {
    options: {
      // The green roller, like Miguel's, so he laps faster than the rest
      glider: GREEN_ROLLER,
      pilot: { characterType: CharacterType.LUC },
    },
    // 1.45 km up the cliff, out over the sea (the roller's drop takes his rise to 70)
    startProgress: 0.27,
    pathOffset: new THREE.Vector3(671, 110, -1295),
  },
  {
    options: {
      glider: JEHOSUA_RUSH,
      pilot: { characterType: CharacterType.JEHOSUA },
      // He flies for the Piratas Aéreos
      pirateFlag: true,
    },
    // 1.95 km up the cliff
    startProgress: 0.35,
    pathOffset: new THREE.Vector3(1020, 120, -1663),
  },
  {
    options: {
      glider: FABIO_IKUMA,
      pilot: { characterType: CharacterType.FABIO },
    },
    // 2.45 km up the cliff
    startProgress: 0.5,
    pathOffset: new THREE.Vector3(1245, 170, -2114),
  },
  {
    options: {
      glider: FRANZ_BUZZ,
      pilot: { characterType: CharacterType.FRANZ },
    },
    // 2.95 km up the cliff, the highest of the middle group
    startProgress: 0.9,
    pathOffset: new THREE.Vector3(1569, 210, -2499),
  },
  {
    options: {
      // The same lime Rush as Magne's
      glider: MAGNE_RUSH,
      pilot: { characterType: CharacterType.BERNT },
    },
    // Out on his own, 6 km up the Risco towards La Graciosa and 450 m higher (1325-1387 m,
    // at least 179 m clear of the ground)
    startProgress: 0.8,
    pathOffset: new THREE.Vector3(3000, 0, -5200),
    waypoints: liftLoop(450, 1),
    // He likes to twist round and fly looking backwards: a 1.5 s spin, 8-15 s facing back,
    // then 30 s to a minute and a half facing forward
    twist: { spin: 1.5, hold: [8, 15], rest: [30, 90] },
  },
  {
    // Magne is the best of them: his loop is widened 1.5x, raised above everyone's (1625-1687 m;
    // Bernt tops out at ~1387 m) and carried 8.5 km up the Risco towards La Graciosa, past
    // Bernt, out along the cliff edge, so he is always higher and farther out.
    // At least ~430 m clear of the ground.
    options: {
      glider: MAGNE_RUSH,
      pilot: { characterType: CharacterType.MAGNE },
    },
    startProgress: 0.2,
    pathOffset: new THREE.Vector3(4000, 0, -7500),
    waypoints: liftLoop(750, 1.5),
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
  position: new THREE.Vector3(4785, 1240, -870),
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
  minHeight: 1200,
  maxHeight: 1400,
  obstacleAvoidanceDistance: 200,
  forwardAxis: 'x',
  // An oval 1-3 km out to sea off the Risco, parallel to it, at 1230-1260 m: 200+ m above the
  // pilots on the ridge loop and at least 1 km from every pilot, Bernt and Magne included;
  // under the Hercules (2000+). At least 969 m over the ground.
  waypoints: [
    new THREE.Vector3(4785, 1240, -870),
    new THREE.Vector3(5985, 1250, -2070),
    new THREE.Vector3(7585, 1260, -4070),
    new THREE.Vector3(8385, 1250, -6070),
    new THREE.Vector3(7700, 1240, -7100),
    new THREE.Vector3(7170, 1230, -6940),
    new THREE.Vector3(5570, 1230, -4140),
    new THREE.Vector3(3570, 1240, -1740),
    new THREE.Vector3(3900, 1240, -900),
  ],
  waypointTension: 0.6,
  waypointLoop: true,
};

export const herculesConfig: HerculesConfig = {
  position: new THREE.Vector3(6200, 1800, -1200),
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
  // 2000-2200 m: high over everyone, Magne included (he tops out at ~1687 m)
  waypoints: [
    new THREE.Vector3(5200, 2100, 2000),
    new THREE.Vector3(7500, 2200, 1500),
    new THREE.Vector3(9000, 2150, -4000),
    new THREE.Vector3(8500, 2100, -7500),
    new THREE.Vector3(6500, 2050, -8000),
    new THREE.Vector3(4500, 2000, -5000),
    new THREE.Vector3(4000, 2050, -1000),
    new THREE.Vector3(4800, 2100, 500),
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
 * into turns ahead of the pilot. It rolls with a quarter of the pilot's bank. Switching pilots
 * with the arrows glides the camera across on a spring that starts at `switchTime` and tightens.
 */
export const CAMERA_FOLLOW: CameraFollowSettings = {
  smoothTime: 1.2,
  switchTime: 0.75,
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
