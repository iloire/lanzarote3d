import * as THREE from 'three';
import { FreeFlight, FreeFlightSettings, PathFlight } from '../../src/applications/home/freeFlight';

const STEP = 1 / 60;
const SPEED = 15;
/** The home scene's FREE_FLIGHT; its config imports images, which jest can't load */
const FREE_FLIGHT: FreeFlightSettings = {
  turnRate: THREE.MathUtils.degToRad(15),
  turnResponse: 1.2,
  speedBar: 1.3,
  brakes: 0.75,
  speedResponse: 0.8,
  sink: 2,
  climb: 1,
  verticalResponse: 0.8,
  clearance: 60,
  ceiling: 2000,
  groundInterval: 0.25,
  returnSpeed: 1.3,
  handBack: 2,
};

/** A straight loop-less path along -Z at height 900, standing in for FlyingBehavior */
const makePath = () => {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(0, 900, 0),
    new THREE.Vector3(0, 900, -20000)
  );
  const path: PathFlight & { running: boolean; progress: number } = {
    waypointPath: curve,
    running: true,
    progress: 0,
    setWaypointProgress(p: number) {
      this.progress = p;
    },
    start() {
      this.running = true;
    },
    stop() {
      this.running = false;
    },
  };
  return path;
};

const makeRig = () => {
  const rig = new THREE.Object3D();
  rig.position.set(0, 900, 0);
  return rig;
};

const fly = (flight: FreeFlight, seconds: number) => {
  for (let t = 0; t < seconds; t += STEP) flight.update(STEP);
};

describe('FreeFlight', () => {
  it('takes the rig off its path and flies straight on with no arrows held', () => {
    const rig = makeRig();
    const path = makePath();
    const flight = new FreeFlight(rig, path, SPEED, FREE_FLIGHT, () => 0);
    expect(path.running).toBe(false);
    fly(flight, 10);
    expect(rig.position.z).toBeCloseTo(-150, 0);
    expect(rig.position.x).toBeCloseTo(0, 3);
    expect(rig.position.y).toBeCloseTo(900, 3);
  });

  it('turns gently left with the left arrow', () => {
    const rig = makeRig();
    const flight = new FreeFlight(rig, makePath(), SPEED, FREE_FLIGHT, () => 0);
    flight.input.turn = 1;
    fly(flight, 6);
    // Flying -Z, a left turn heads towards -X
    expect(rig.position.x).toBeLessThan(-5);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rig.quaternion);
    const turned = Math.atan2(-forward.x, -forward.z);
    expect(turned).toBeGreaterThan(0);
    expect(turned).toBeLessThan(FREE_FLIGHT.turnRate * 6);
  });

  it('sinks on the speed bar but the lift keeps it clear of the ground', () => {
    const rig = makeRig();
    const flight = new FreeFlight(rig, makePath(), SPEED, FREE_FLIGHT, () => 800);
    flight.input.pitch = 1;
    fly(flight, 120);
    expect(rig.position.y).toBeGreaterThan(800 + FREE_FLIGHT.clearance - 5);
    expect(rig.position.y).toBeLessThan(900);
  });

  it('flies back to its path once released and hands back to it', () => {
    const rig = makeRig();
    const path = makePath();
    const flight = new FreeFlight(rig, path, SPEED, FREE_FLIGHT, () => 0);
    flight.input.turn = 1;
    fly(flight, 6);
    flight.input.turn = 0;
    fly(flight, 20);
    expect(rig.position.x).toBeLessThan(-100);

    flight.release();
    let flying = true;
    for (let t = 0; t < 300 && flying; t += STEP) flying = flight.update(STEP);
    expect(flying).toBe(false);
    expect(path.running).toBe(true);
    expect(rig.position.distanceTo(path.waypointPath!.getPoint(path.progress))).toBeLessThan(
      FREE_FLIGHT.handBack
    );
  });
});
