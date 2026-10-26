import * as THREE from 'three';
import { sharedUniforms } from '../../rendering/sharedUniforms';

export interface GullFlock {
  center: THREE.Vector3; // Thermal core at the flock's mean height
  count?: number;
}

export interface GullsOptions {
  wingspan?: number; // World units; real gulls are ~1.3 m, drawn larger to read from afar
  minRadius?: number;
  maxRadius?: number;
}

const DEFAULTS: Required<GullsOptions> = { wingspan: 6, minRadius: 40, maxRadius: 160 };

/**
 * Gulls circling in thermals, as they do over Famara on a good day. Every gull of every
 * flock is one instance of one InstancedMesh, so the whole sky is a single draw call.
 * Orbit, climb, banking and the wingbeat (bursts of flapping between long glides) are
 * worked out in the vertex shader from per-instance parameters: nothing runs on the CPU
 * per frame.
 */
export class Gulls {
  readonly mesh: THREE.InstancedMesh;

  constructor(flocks: GullFlock[], options: GullsOptions = {}) {
    const o = { ...DEFAULTS, ...options };
    const geometry = createGullGeometry(o.wingspan);
    const total = flocks.reduce((n, f) => n + (f.count ?? 10), 0);

    const orbit = new Float32Array(total * 4);
    const material = createGullMaterial();
    this.mesh = new THREE.InstancedMesh(geometry, material, total);
    this.mesh.name = 'gulls';
    this.mesh.frustumCulled = false;

    const matrix = new THREE.Matrix4();
    let i = 0;
    for (const flock of flocks) {
      const count = flock.count ?? 10;
      // Each thermal turns one way, as the birds sharing it do.
      const direction = Math.random() < 0.5 ? -1 : 1;
      for (let k = 0; k < count; k++, i++) {
        const radius = THREE.MathUtils.lerp(o.minRadius, o.maxRadius, Math.random());
        // Roughly constant airspeed (~11 m/s) means wider circles take longer.
        const angularSpeed = (direction * 11) / radius;
        orbit.set([radius, angularSpeed, Math.random() * Math.PI * 2, Math.random()], i * 4);
        matrix.makeTranslation(
          flock.center.x + (Math.random() - 0.5) * 60,
          flock.center.y + (Math.random() - 0.5) * 120,
          flock.center.z + (Math.random() - 0.5) * 60
        );
        this.mesh.setMatrixAt(i, matrix);
      }
    }
    geometry.setAttribute('aOrbit', new THREE.InstancedBufferAttribute(orbit, 4));
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/**
 * A gull facing +z: a slim body and gull-winged arms, each wing split at the wrist so the
 * outer half can lag the inner half in the wingbeat. aWing is 0 at the body, 1 at the tip.
 */
function createGullGeometry(span: number): THREE.BufferGeometry {
  const s = span / 2;
  const positions: number[] = [];
  const wing: number[] = [];
  const colors: number[] = [];
  const white = [0.95, 0.95, 0.93];
  const grey = [0.62, 0.66, 0.7];
  const black = [0.08, 0.08, 0.09];

  const tri = (a: number[], b: number[], c: number[], w: number[], col: number[][]) => {
    positions.push(...a, ...b, ...c);
    wing.push(...w);
    col.forEach(cc => colors.push(...cc));
  };

  // Body: a flattened diamond from beak to tail.
  const nose = [0, 0, s * 0.42];
  const tail = [0, 0.02 * s, -s * 0.38];
  const left = [-s * 0.07, 0, 0];
  const right = [s * 0.07, 0, 0];
  const top = [0, s * 0.06, 0.05 * s];
  tri(nose, left, top, [0, 0, 0], [white, white, white]);
  tri(nose, top, right, [0, 0, 0], [white, white, white]);
  tri(top, left, tail, [0, 0, 0], [white, white, white]);
  tri(top, tail, right, [0, 0, 0], [white, white, white]);
  tri(nose, right, left, [0, 0, 0], [white, white, white]);
  tri(left, right, tail, [0, 0, 0], [white, white, white]);

  for (const side of [-1, 1]) {
    const rootFront = [side * s * 0.06, 0, s * 0.12];
    const rootBack = [side * s * 0.06, 0, -s * 0.12];
    const wristFront = [side * s * 0.5, s * 0.06, s * 0.1];
    const wristBack = [side * s * 0.5, s * 0.06, -s * 0.14];
    const tip = [side * s, -s * 0.02, -s * 0.2];
    const order = (a: number[], b: number[], c: number[]) => (side > 0 ? [a, b, c] : [a, c, b]);
    const [a1, b1, c1] = order(rootFront, wristFront, rootBack);
    tri(a1!, b1!, c1!, [0, 0.5, 0], [grey, grey, grey]);
    const [a2, b2, c2] = order(rootBack, wristFront, wristBack);
    tri(a2!, b2!, c2!, [0, 0.5, 0.5], [grey, grey, grey]);
    const [a3, b3, c3] = order(wristFront, tip, wristBack);
    tri(a3!, b3!, c3!, [0.5, 1, 0.5], [grey, black, grey]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const GULL_VERTEX_PARS = /* glsl */ `
  uniform float uTime;
  attribute vec4 aOrbit; // radius, angular speed (sign = turn direction), phase, random
  attribute float aWing;

  float lzAngle() { return uTime * aOrbit.y + aOrbit.z; }

  // Bank into the turn, then face along the circle.
  mat3 lzGullRotation() {
    float a = lzAngle();
    float turn = sign(aOrbit.y);
    float bank = 0.45 * turn;
    mat3 roll = mat3(cos(bank), sin(bank), 0.0, -sin(bank), cos(bank), 0.0, 0.0, 0.0, 1.0);
    vec2 v = vec2(-sin(a), cos(a)) * turn;
    float yaw = atan(v.x, v.y);
    mat3 heading = mat3(cos(yaw), 0.0, -sin(yaw), 0.0, 1.0, 0.0, sin(yaw), 0.0, cos(yaw));
    return heading * roll;
  }

  // Wing lift: bursts of flapping, long glides in between.
  float lzFlap() {
    float burst = smoothstep(0.55, 0.85, sin(uTime * 0.35 + aOrbit.w * 40.0));
    float beat = sin(uTime * (8.0 + aOrbit.w * 3.0) + aOrbit.z * 5.0 - aWing * 1.2);
    return burst * beat;
  }
`;

function createGullMaterial(): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GULL_VERTEX_PARS}`)
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nobjectNormal = lzGullRotation() * objectNormal;'
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);
        float span = abs(position.x);
        // Gliding wings hold a shallow gull "M"; the beat swings them through it.
        transformed.y += span * (0.06 + 0.45 * lzFlap()) * aWing;
        transformed = lzGullRotation() * transformed;
        float a = lzAngle();
        transformed += vec3(cos(a), 0.0, sin(a)) * aOrbit.x;
        // Climb slowly round the thermal and sink back, out of step with the others.
        transformed.y += sin(uTime * 0.05 + aOrbit.w * 6.28) * 60.0;`
      );
  };
  material.customProgramCacheKey = () => 'lz-gulls';
  return material;
}
