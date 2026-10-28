import * as THREE from 'three';
import { GuirreVisitor, steer } from '../../src/foundation/components/wildlife/GuirreVisitor';

const limits = { gain: 0.3, response: 1, maxSpeed: 20, maxAccel: 5 };

describe('steer', () => {
  it('flies to a moving point and settles alongside it', () => {
    const pos = new THREE.Vector3();
    const vel = new THREE.Vector3(10, 0, 0);
    const accel = new THREE.Vector3();
    const target = new THREE.Vector3(0, 0, 500);
    const targetVel = new THREE.Vector3(15, 0, 0);
    for (let t = 0; t < 120; t += 1 / 30) {
      target.addScaledVector(targetVel, 1 / 30);
      steer(pos, vel, target, targetVel, 1 / 30, limits, accel);
    }
    expect(pos.distanceTo(target)).toBeLessThan(2);
    expect(vel.distanceTo(targetVel)).toBeLessThan(0.5);
  });

  it('never flies faster than its top speed', () => {
    const pos = new THREE.Vector3();
    const vel = new THREE.Vector3();
    const accel = new THREE.Vector3();
    const far = new THREE.Vector3(5000, 0, 0);
    for (let t = 0; t < 30; t += 1 / 30) {
      steer(pos, vel, far, new THREE.Vector3(), 1 / 30, limits, accel);
      expect(vel.length()).toBeLessThanOrEqual(limits.maxSpeed + 1e-9);
    }
  });
});

describe('GuirreVisitor', () => {
  it('never strays far from the pilot', () => {
    const pilot = new THREE.Object3D();
    const visitor = new GuirreVisitor(pilot);
    const dt = 1 / 30;
    for (let t = dt; t < 300; t += dt) {
      pilot.position.set(t * 15, 0, 0);
      visitor.update(dt);
      expect(visitor.position.distanceTo(pilot.position)).toBeLessThan(400);
    }
  });

  it('comes over to the pilot, glides close alongside, then goes back to circling', () => {
    // A pilot flying a 400 m circle at 15 m/s
    const pilot = new THREE.Object3D();
    const centre = new THREE.Vector3(1000, 0, 0);
    const fly = (t: number) => {
      const a = (t * 15) / 400;
      pilot.position.set(centre.x + Math.cos(a) * 400, 0, Math.sin(a) * 400);
    };
    fly(0);
    const visitor = new GuirreVisitor(pilot, {
      circling: [20, 20],
      alongside: [20, 20],
    });

    const dt = 1 / 30;
    const phases = new Set<string>();
    let closest = Infinity;
    for (let t = dt; t < 200; t += dt) {
      fly(t);
      visitor.update(dt);
      phases.add(visitor.currentPhase);
      if (visitor.currentPhase === 'alongside') {
        closest = Math.min(closest, visitor.position.distanceTo(pilot.position));
      }
      if (phases.has('alongside') && visitor.currentPhase === 'circling') break;
    }
    expect([...phases]).toEqual(['circling', 'joining', 'alongside']);
    expect(visitor.currentPhase).toBe('circling');
    // An empty Object3D has no size, so it holds off the 10 m minimum span: 7 m out, 2.5 m up
    expect(closest).toBeLessThan(15);
  });

  it('comes in a different way on each visit', () => {
    const pilot = new THREE.Object3D();
    const visitor = new GuirreVisitor(pilot, { circling: [5, 5], alongside: [5, 5] });
    const dt = 1 / 30;
    const visits: string[] = [];
    let was = visitor.currentPhase;
    for (let t = dt; t < 600 && visits.length < 6; t += dt) {
      pilot.position.set(t * 15, 0, 0);
      visitor.update(dt);
      if (visitor.currentPhase === 'joining' && was === 'circling')
        visits.push(visitor.currentPattern);
      was = visitor.currentPhase;
    }
    expect(visits).toHaveLength(6);
    visits.slice(1).forEach((pattern, i) => expect(pattern).not.toBe(visits[i]));
  });

  it('keeps its distance when it is not a visitor', () => {
    const pilot = new THREE.Object3D();
    const mate = new GuirreVisitor(pilot, { visits: false });
    const dt = 1 / 30;
    for (let t = dt; t < 300; t += dt) {
      pilot.position.set(t * 15, 0, 0);
      mate.update(dt);
      expect(mate.currentPhase).toBe('circling');
    }
    expect(mate.position.distanceTo(pilot.position)).toBeGreaterThan(100);
  });
});
