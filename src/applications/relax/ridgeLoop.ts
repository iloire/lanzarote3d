import * as THREE from 'three';

// World units (the island model's ~0.77 a metre). The loop is an oval in front of the slope's
// edge, RIDGE either way along it and NEAR to FAR out from it, RISE over the takeoff and at
// least CLEARANCE over the ground under every point, the same as the Famara ridge loop
const RIDGE = 700;
const NEAR = 150;
const FAR = 600;
const RISE = 150;
const CLEARANCE = 130;
const POINTS = 8;
// A takeoff's coordinates are often its car park or chapel, back from the edge: the loop starts
// where the ground first falls DROP below it, looked for up to REACH out, in steps of STEP
const DROP = 60;
const REACH = 2500;
const STEP = 50;
// The camera watches from further out and a little to one side, a touch above the gliders, or
// higher where a hill would hide them
const CAMERA_OUT = 1300;
const CAMERA_SIDE = 300;
const CAMERA_RISE = 100;
// Points along the camera's sight line checked for hills in the way
const SIGHT_SAMPLES = 12;

/** Ground height at a world x, z: NaN off the terrain, which is the sea */
export type GroundAt = (x: number, z: number) => number;

export interface Ridge {
  loop: THREE.Vector3[];
  camera: { position: THREE.Vector3; target: THREE.Vector3 };
}

/**
 * The soaring loop and camera for a takeoff whose slope faces `faces` degrees from north: what
 * a generated flying zone flies, worked out from the ground once the terrain is in.
 */
export function ridgeLoop(
  takeoff: { x: number; z: number },
  faces: number,
  groundAt: GroundAt
): Ridge {
  const ground = (x: number, z: number) => Math.max(0, groundAt(x, z) || 0);
  const bearing = THREE.MathUtils.degToRad(faces);
  // North is −z, east +x; `side` is along the slope, to the right looking out
  const out = new THREE.Vector2(Math.sin(bearing), -Math.cos(bearing));
  const side = new THREE.Vector2(-out.y, out.x);
  const at = (along: number, away: number) =>
    new THREE.Vector2(takeoff.x, takeoff.z).addScaledVector(side, along).addScaledVector(out, away);

  const top = ground(takeoff.x, takeoff.z);
  const edge =
    Array.from({ length: REACH / STEP }, (_, i) => i * STEP).find(away => {
      const { x, y } = at(0, away);
      return ground(x, y) < top - DROP;
    }) ?? 0;
  const middle = edge + (NEAR + FAR) / 2;
  const ring = Array.from({ length: POINTS }, (_, i) => {
    const turn = (i / POINTS) * Math.PI * 2;
    return at(RIDGE * Math.cos(turn), middle + ((FAR - NEAR) / 2) * Math.sin(turn));
  });
  const height = Math.max(top + RISE, ...ring.map(({ x, y }) => ground(x, y) + CLEARANCE));
  const loop = ring.map(({ x, y }) => new THREE.Vector3(x, height, y));

  const centre = at(0, middle);
  const eye = at(CAMERA_SIDE, middle + CAMERA_OUT);
  // High enough to see the gliders over any hill between: at a point `t` of the way to them the
  // sight line, from `y` down to the loop, must clear the ground there
  const sightLine = Array.from({ length: SIGHT_SAMPLES }, (_, i) => {
    const t = i / SIGHT_SAMPLES;
    const { x, y } = eye.clone().lerp(centre, t);
    return (ground(x, y) + CLEARANCE - height * t) / (1 - t);
  });
  return {
    loop,
    camera: {
      target: new THREE.Vector3(centre.x, height, centre.y),
      position: new THREE.Vector3(eye.x, Math.max(height + CAMERA_RISE, ...sightLine), eye.y),
    },
  };
}
