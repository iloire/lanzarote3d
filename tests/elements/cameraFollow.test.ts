import * as THREE from 'three';
import { BackdropSway, CameraFollow, smoothDamp, ZoomIn } from '../../src/applications/home/cameraFollow';

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
  const SWAY = { amplitude: 0.4, bias: 0, period: 60, response: 0.3 };
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

describe('ZoomIn', () => {
  const settings = { distance: 230, response: 2 };

  it('brings a zoomed-out camera back to the distance, keeping its angle', () => {
    const target = new THREE.Vector3(500, 900, -700);
    const camera = target.clone().add(new THREE.Vector3(-1000, 500, 2000));
    const direction = camera.clone().sub(target).normalize();
    const zoom = new ZoomIn(settings);
    zoom.start();
    for (let t = 0; t < 5; t += STEP) zoom.update(STEP, camera, target);
    expect(camera.distanceTo(target)).toBeCloseTo(230, 0);
    expect(camera.clone().sub(target).normalize().dot(direction)).toBeCloseTo(1, 6);
  });

  it('leaves a camera that is already closer alone', () => {
    const target = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.Vector3(0, 50, 80);
    const zoom = new ZoomIn(settings);
    zoom.start();
    zoom.update(STEP, camera, target);
    expect(camera.toArray()).toEqual([0, 50, 80]);
  });

  it('does nothing until started, or once stopped', () => {
    const target = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.Vector3(0, 0, 2000);
    const zoom = new ZoomIn(settings);
    zoom.update(STEP, camera, target);
    expect(camera.z).toBe(2000);
    zoom.start();
    zoom.stop();
    zoom.update(STEP, camera, target);
    expect(camera.z).toBe(2000);
  });
});
