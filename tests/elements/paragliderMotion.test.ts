import * as THREE from 'three';
import { ParagliderMotion } from '../../src/applications/home/paragliderMotion';

const STEP = 1 / 60;
const SPEED = 15;

function setup() {
  const rig = new THREE.Object3D();
  const body = new THREE.Object3D();
  const swing = new THREE.Object3D();
  rig.add(body);
  const motion = new ParagliderMotion(rig, body, SPEED, swing);
  return { rig, swing, motion };
}

/** Flies the rig along its heading for `seconds`, turning left at `turnRate` and at `speed` */
function fly(
  { rig, motion }: ReturnType<typeof setup>,
  seconds: number,
  turnRate: number,
  speed = SPEED,
  sample?: () => void
) {
  const forward = new THREE.Vector3();
  for (let t = 0; t < seconds; t += STEP) {
    rig.rotation.y += turnRate * STEP;
    forward.set(0, 0, -1).applyQuaternion(rig.quaternion);
    rig.position.addScaledVector(forward, speed * STEP);
    motion.update(STEP);
    sample?.();
  }
}

test('the pilot lags the wing into a turn, swings out past it and settles in line', () => {
  const glider = setup();
  fly(glider, 3, 0);
  expect(Math.abs(glider.swing.rotation.z)).toBeLessThan(1e-6);

  // Rolling into a left turn: the wing banks first, so the pilot trails on the inside.
  let lag = 0;
  let overshoot = 0;
  fly(glider, 6, 0.4, SPEED, () => {
    lag = Math.min(lag, glider.swing.rotation.z);
    overshoot = Math.max(overshoot, glider.swing.rotation.z);
  });
  expect(lag).toBeLessThan(THREE.MathUtils.degToRad(-3));
  expect(overshoot).toBeGreaterThan(THREE.MathUtils.degToRad(0.5));

  // In the steady turn the pilot hangs in line with the banked wing.
  fly(glider, 15, 0.4);
  expect(Math.abs(glider.swing.rotation.z)).toBeLessThan(THREE.MathUtils.degToRad(0.2));
});

test('speeding up swings the pilot back and slowing down swings it forward', () => {
  const glider = setup();
  fly(glider, 3, 0);

  fly(glider, 1.5, 0, SPEED * 1.6);
  expect(glider.swing.rotation.x).toBeLessThan(THREE.MathUtils.degToRad(-3));

  fly(glider, 10, 0, SPEED * 1.6);
  fly(glider, 1.5, 0, SPEED * 0.6);
  expect(glider.swing.rotation.x).toBeGreaterThan(THREE.MathUtils.degToRad(3));
});

const WINGOVER = {
  period: 8,
  sway: 60,
  climb: 30,
  bank: THREE.MathUtils.degToRad(60),
  turns: [2, 2] as [number, number],
  rest: [0, 0] as [number, number],
};

test('a wingover banks hardest and climbs highest at each end of its weave', () => {
  const rig = new THREE.Object3D();
  const body = new THREE.Object3D();
  rig.add(body);
  const motion = new ParagliderMotion(rig, body, SPEED, undefined, WINGOVER);

  // Flying straight, the wing alone weaves: record it at its farthest out to each side
  let right = { x: -Infinity, y: 0, bank: 0 };
  let left = { x: Infinity, y: 0, bank: 0 };
  let lowest = Infinity;
  for (let t = 0; t < 16; t += STEP) {
    rig.position.z -= SPEED * STEP;
    motion.update(STEP);
    const at = { x: body.position.x, y: body.position.y, bank: motion.bankAngle };
    if (at.x > right.x) right = at;
    if (at.x < left.x) left = at;
    lowest = Math.min(lowest, body.position.y);
  }

  expect(right.x).toBeGreaterThan(55);
  expect(left.x).toBeLessThan(-55);
  // Out to the right it turns back left (positive bank), and the other way on the left
  expect(right.bank).toBeGreaterThan(THREE.MathUtils.degToRad(50));
  expect(left.bank).toBeLessThan(THREE.MathUtils.degToRad(-50));
  // High at the ends, low through the middle
  expect(right.y).toBeGreaterThan(25);
  expect(left.y).toBeGreaterThan(25);
  expect(lowest).toBeLessThan(-25);
});

test('wingovers come in bursts, with straight flying in between', () => {
  const rig = new THREE.Object3D();
  const body = new THREE.Object3D();
  rig.add(body);
  // No wait before the first burst; one wingover a burst, then 30 s of rest
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  const motion = new ParagliderMotion(rig, body, SPEED, undefined, {
    ...WINGOVER,
    turns: [1, 1],
    rest: [30, 30],
  });
  random.mockRestore();

  /** The farthest the wing weaves off the path between two times */
  const widest = (from: number, to: number) => {
    let farthest = 0;
    for (let t = from; t < to; t += STEP) {
      rig.position.z -= SPEED * STEP;
      motion.update(STEP);
      farthest = Math.max(farthest, Math.abs(body.position.x));
    }
    return farthest;
  };

  expect(widest(0, 8)).toBeGreaterThan(20);
  expect(widest(8, 37)).toBeLessThan(1e-6);
  expect(widest(37, 46)).toBeGreaterThan(20);
});

test('a twist spins the pilot half a turn to face backwards, holds it and spins back', () => {
  const rig = new THREE.Object3D();
  const body = new THREE.Object3D();
  const swing = new THREE.Object3D();
  rig.add(body);
  // No wait before the first twist, the shortest hold, and spinning to the right
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  const motion = new ParagliderMotion(rig, body, SPEED, swing, undefined, {
    spin: 1.5,
    hold: [8, 15],
    rest: [30, 90],
  });

  /** The pilot's twist after flying straight on to `to` seconds */
  let t = 0;
  const twistAt = (to: number) => {
    for (; t < to; t += STEP) {
      rig.position.z -= SPEED * STEP;
      motion.update(STEP);
    }
    return swing.rotation.y;
  };

  expect(Math.abs(twistAt(0.75))).toBeGreaterThan(1);
  expect(twistAt(2)).toBeCloseTo(-Math.PI, 5);
  expect(twistAt(9)).toBeCloseTo(-Math.PI, 5);
  // Hold ends at 9.5 s; it spins back and faces forward again by 11 s, then rests 30 s
  expect(Math.abs(twistAt(11.2))).toBeLessThan(1e-6);
  expect(Math.abs(twistAt(40))).toBeLessThan(1e-6);
  random.mockRestore();
});

test('startTwist twists straight away instead of waiting out the rest', () => {
  const rig = new THREE.Object3D();
  const body = new THREE.Object3D();
  const swing = new THREE.Object3D();
  rig.add(body);
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
  const motion = new ParagliderMotion(rig, body, SPEED, swing, undefined, {
    spin: 1.5,
    hold: [8, 15],
    rest: [30, 90],
  });
  random.mockRestore();

  const fly = (seconds: number) => {
    for (let t = 0; t < seconds; t += STEP) motion.update(STEP);
  };
  fly(5);
  expect(swing.rotation.y).toBe(0);
  motion.startTwist();
  fly(2);
  expect(Math.abs(swing.rotation.y)).toBeCloseTo(Math.PI, 5);
});
