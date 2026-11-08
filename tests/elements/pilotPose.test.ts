import * as THREE from 'three';
import { PilotPose } from '../../src/applications/home/pilotPose';

const STEP = 1 / 60;

/** A pilot hinged like Ivan's rig: X to his left, Y up, Z forward, a hand atop each forearm */
function setup() {
  const pilot = new THREE.Object3D();
  const pivot = (name: string, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const node = new THREE.Object3D();
    node.name = name;
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  };
  const head = pivot('head', pilot, 0, 5.1, -0.8);
  const hands = (['left', 'right'] as const).map(name => {
    const side = name === 'left' ? 1 : -1;
    const arm = pivot(`arm-${name}`, pilot, side * 0.9, 4.8, -1.25);
    const forearm = pivot(`forearm-${name}`, arm, side * 1.95, 0, 0);
    return pivot(`hand-${name}`, forearm, 0, 2.3, 0);
  });
  const pose = PilotPose.from(pilot)!;
  const fly = (bank: number, seconds = 3, twist = 0) => {
    for (let t = 0; t < seconds; t += STEP) pose.update(STEP, bank, 0, twist);
    pilot.updateMatrixWorld(true);
  };
  const heightOf = (hand: THREE.Object3D) => hand.getWorldPosition(new THREE.Vector3()).y;
  const across = (hand: THREE.Object3D) => hand.getWorldPosition(new THREE.Vector3()).x;
  const facing = () => new THREE.Vector3(0, 0, 1).applyQuaternion(head.quaternion);
  return { pilot, pose, fly, left: hands[0]!, right: hands[1]!, heightOf, across, facing };
}

describe('PilotPose', () => {
  beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0.99));
  afterEach(() => jest.restoreAllMocks());

  it('leaves a pilot without parts alone', () => {
    expect(PilotPose.from(new THREE.Object3D())).toBeUndefined();
  });

  it('holds both brakes alike in straight flight', () => {
    const { fly, left, right, heightOf } = setup();
    fly(0);
    expect(heightOf(left)).toBeCloseTo(heightOf(right), 5);
  });

  it('pulls the inside brake into a left turn and looks left', () => {
    const { fly, left, right, heightOf, facing } = setup();
    fly(0);
    const rest = heightOf(left);
    fly(THREE.MathUtils.degToRad(35));
    expect(heightOf(left)).toBeLessThan(rest - 0.5);
    expect(heightOf(left)).toBeLessThan(heightOf(right) - 0.5);
    expect(facing().x).toBeGreaterThan(0.4);
  });

  it('pulls the right brake into a right turn and looks right', () => {
    const { fly, left, right, heightOf, facing } = setup();
    fly(THREE.MathUtils.degToRad(-35));
    expect(heightOf(right)).toBeLessThan(heightOf(left) - 0.5);
    expect(facing().x).toBeLessThan(-0.4);
  });

  it('crosses the arms above the head when twisted half round', () => {
    const { fly, left, right, heightOf, across } = setup();
    fly(0);
    expect(across(left)).toBeGreaterThan(across(right));
    fly(0, 0.1, Math.PI);
    // The left hand reaches over to the right and the right to the left, above the helmet (7.9)
    expect(across(left)).toBeLessThan(across(right));
    expect(heightOf(left)).toBeGreaterThan(7.9);
    expect(heightOf(right)).toBeGreaterThan(7.9);
  });
});
