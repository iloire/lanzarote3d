import * as THREE from 'three';
import {
  BackdropSway,
  CameraFollow,
  Reframe,
  smoothDamp,
} from '../../src/applications/home/cameraFollow';

const STEP = 1 / 60;
const SETTINGS = {
  smoothTime: 1.2,
  switchTime: 0.75,
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

  it('takes over moving with a lead it observed, without braking or lurching', () => {
    const lead = new THREE.Vector3(500, 900, -700);
    const follow = new CameraFollow(SETTINGS);
    for (let t = 0; t < 6; t += STEP) {
      lead.z -= 15 * STEP;
      follow.observe(STEP, lead);
    }
    follow.reset(lead);
    const move = new THREE.Vector3();
    for (let t = 0; t < 0.5; t += STEP) {
      lead.z -= 15 * STEP;
      follow.update(STEP, lead, 0, move);
      expect(-move.z / STEP).toBeCloseTo(15, 0);
    }
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

describe('BackdropSway', () => {
  const SWAY = { amplitude: 0.4, bias: 0, period: 60, response: 0.3, easeIn: 5 };
  // The backdrop lies due -Z of the target, so facing it puts the camera at +Z.
  const backdrop = new THREE.Vector3(0, 0, -10000);
  const azimuth = (camera: THREE.Vector3, target: THREE.Vector3) =>
    Math.atan2(camera.x - target.x, camera.z - target.z);

  it('eases in from where the camera is', () => {
    const target = new THREE.Vector3();
    const camera = new THREE.Vector3(200, 50, 0); // side on, a quarter turn away
    const sway = new BackdropSway(backdrop, SWAY);
    sway.update(STEP, camera, target);
    expect(azimuth(camera, target)).toBeCloseTo(Math.PI / 2, 1);
  });

  it('starts swinging gently, not with a kick', () => {
    const target = new THREE.Vector3();
    const camera = new THREE.Vector3(200, 50, 0);
    const sway = new BackdropSway(backdrop, SWAY);
    for (let t = 0; t < 0.5; t += STEP) sway.update(STEP, camera, target);
    expect(azimuth(camera, target)).toBeCloseTo(Math.PI / 2, 2);
  });

  it('centres on the camera opposite the backdrop, turned by the bias, and restarts there', () => {
    const target = new THREE.Vector3(0, 900, 0);
    expect(new BackdropSway(backdrop, { ...SWAY, bias: 0.1 }).centre(target)).toBeCloseTo(0.1, 6);
    const sway = new BackdropSway(backdrop, SWAY);
    const camera = new THREE.Vector3(0, 950, 200);
    for (let t = 0; t < 20; t += STEP) sway.update(STEP, camera, target);
    camera.set(0, 950, 200);
    sway.restart();
    sway.update(STEP, camera, target);
    expect(azimuth(camera, target)).toBeCloseTo(0, 3);
  });

  it('keeps the backdrop behind the target, within the sway, at the same range and height', () => {
    const target = new THREE.Vector3(100, 900, 0);
    const camera = new THREE.Vector3(300, 950, 0);
    const range = camera.distanceTo(target);
    const sway = new BackdropSway(backdrop, SWAY);
    for (let t = 0; t < 20; t += STEP) sway.update(STEP, camera, target);
    let widest = 0;
    for (let t = 0; t < 60; t += STEP) {
      sway.update(STEP, camera, target);
      widest = Math.max(widest, Math.abs(azimuth(camera, target)));
    }
    expect(widest).toBeLessThan(SWAY.amplitude + 0.05);
    expect(widest).toBeGreaterThan(SWAY.amplitude / 2);
    expect(camera.distanceTo(target)).toBeCloseTo(range, 6);
    expect(camera.y).toBeCloseTo(950, 6);
  });
});

describe('Reframe', () => {
  const settings = { response: 4 };
  const settle = (
    reframe: Reframe,
    camera: THREE.Vector3,
    target: THREE.Vector3,
    anchor: THREE.Vector3
  ) => {
    let arrived = false;
    for (let t = 0; t < 5 && !arrived; t += STEP)
      arrived = reframe.update(STEP, camera, target, anchor);
    return arrived;
  };

  it('undoes an orbit, pan and zoom, landing on the aim and offset', () => {
    const anchor = new THREE.Vector3(500, 900, -700);
    const target = anchor.clone().add(new THREE.Vector3(120, -40, 60)); // panned away
    const camera = target.clone().add(new THREE.Vector3(-900, 300, -1500)); // orbited, zoomed out
    const aim = new THREE.Vector3(0, 35, 0);
    const offset = new THREE.Vector3(-70, 35, 140);
    const reframe = new Reframe(settings);
    reframe.start(aim, offset);
    expect(settle(reframe, camera, target, anchor)).toBe(true);
    expect(target.distanceTo(anchor.clone().add(aim))).toBeLessThan(0.5);
    expect(camera.clone().sub(target).distanceTo(offset)).toBeLessThan(1);
    expect(reframe.running).toBe(false);
  });

  it('swings round the target rather than cutting through it', () => {
    const anchor = new THREE.Vector3();
    const target = new THREE.Vector3();
    const camera = new THREE.Vector3(0, 10, -160); // the far side
    const reframe = new Reframe(settings);
    reframe.start(new THREE.Vector3(), new THREE.Vector3(0, 10, 160));
    let closest = Infinity;
    for (let t = 0; t < 5; t += STEP) {
      reframe.update(STEP, camera, target, anchor);
      closest = Math.min(closest, camera.distanceTo(target));
    }
    expect(closest).toBeGreaterThan(150);
  });

  it('does nothing until started, or once stopped', () => {
    const anchor = new THREE.Vector3();
    const target = new THREE.Vector3();
    const camera = new THREE.Vector3(0, 0, 2000);
    const reframe = new Reframe(settings);
    reframe.update(STEP, camera, target, anchor);
    expect(camera.z).toBe(2000);
    reframe.start(new THREE.Vector3(), new THREE.Vector3(0, 0, 100));
    reframe.stop();
    reframe.update(STEP, camera, target, anchor);
    expect(camera.z).toBe(2000);
  });
});
