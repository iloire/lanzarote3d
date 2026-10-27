import * as THREE from 'three';
import { CameraFollow, smoothDamp } from '../../src/applications/home/cameraFollow';

const STEP = 1 / 60;
const SETTINGS = {
  smoothTime: 1.2,
  lookAhead: 2,
  velocityResponse: 2,
  rollShare: 0.25,
  rollResponse: 1.5,
};

describe('smoothDamp', () => {
  it('settles on a still target without overshooting', () => {
    const current = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(100, -50, 20);
    const velocity = new THREE.Vector3();
    let maxX = 0;
    for (let t = 0; t < 10; t += STEP) {
      smoothDamp(current, target, velocity, 1.2, STEP);
      maxX = Math.max(maxX, current.x);
    }
    expect(maxX).toBeLessThanOrEqual(100);
    expect(current.distanceTo(target)).toBeLessThan(0.01);
  });

  it('stays stable with a step far longer than the smoothing time', () => {
    const current = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(100, 0, 0);
    const velocity = new THREE.Vector3();
    smoothDamp(current, target, velocity, 0.1, 5);
    expect(current.x).toBeGreaterThan(0);
    expect(current.x).toBeLessThanOrEqual(100);
  });
});

describe('CameraFollow', () => {
  /** Flies the lead along -Z at `speed` for `seconds`, summing the camera moves */
  function fly(follow: CameraFollow, lead: THREE.Vector3, seconds: number, speed: number) {
    const move = new THREE.Vector3();
    const total = new THREE.Vector3();
    for (let t = 0; t < seconds; t += STEP) {
      lead.z -= speed * STEP;
      follow.update(STEP, lead, 0, move);
      total.add(move);
    }
    return total;
  }

  it('does not jump when it takes over', () => {
    const lead = new THREE.Vector3(500, 900, -700);
    const follow = new CameraFollow(SETTINGS);
    follow.reset(lead);
    const move = new THREE.Vector3();
    lead.z -= 15 * STEP;
    follow.update(STEP, lead, 0, move);
    expect(move.length()).toBeLessThan(15 * STEP);
  });

  it('settles (lookAhead - smoothTime) × speed ahead of a steady lead', () => {
    const lead = new THREE.Vector3();
    const follow = new CameraFollow(SETTINGS);
    follow.reset(lead);
    fly(follow, lead, 20, 15);
    const ahead = lead.z - follow.anchor.z;
    expect(ahead).toBeCloseTo((SETTINGS.lookAhead - SETTINGS.smoothTime) * 15, 0);
  });

  it('carries the camera as far as the anchor moves', () => {
    const lead = new THREE.Vector3();
    const follow = new CameraFollow(SETTINGS);
    follow.reset(lead);
    const total = fly(follow, lead, 5, 15);
    expect(total.z).toBeCloseTo(follow.anchor.z, 6);
  });

  it('rolls with a share of the bank, easing in', () => {
    const lead = new THREE.Vector3();
    const follow = new CameraFollow(SETTINGS);
    follow.reset(lead);
    const move = new THREE.Vector3();
    const bank = 0.4;
    follow.update(STEP, lead, bank, move);
    expect(follow.roll).toBeGreaterThan(0);
    expect(follow.roll).toBeLessThan(bank * SETTINGS.rollShare);
    for (let t = 0; t < 10; t += STEP) follow.update(STEP, lead, bank, move);
    expect(follow.roll).toBeCloseTo(bank * SETTINGS.rollShare, 3);
  });
});
