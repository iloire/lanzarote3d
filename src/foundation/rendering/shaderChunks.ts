import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';

/** Value noise and fbm, cheap enough to run per pixel on the whole sea. */
export const NOISE_GLSL = /* glsl */ `
  float lzHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float lzNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(lzHash(i), lzHash(i + vec2(1.0, 0.0)), u.x),
      mix(lzHash(i + vec2(0.0, 1.0)), lzHash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float lzFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * lzNoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;

/**
 * Soft cloud shadows drifting downwind over the ground. Returns a light multiplier
 * in [1 - uCloudShadow, 1].
 */
export const CLOUD_SHADOW_GLSL = /* glsl */ `
  uniform float uTime;
  uniform vec2 uWind;
  uniform float uCloudShadow;
  float lzCloudShadow(vec2 worldXZ) {
    vec2 p = (worldXZ - uWind * uTime * 8.0) / 2600.0;
    float c = smoothstep(0.52, 0.72, lzFbm(p));
    return 1.0 - c * uCloudShadow;
  }
`;

/**
 * Patch a built-in lit material so its pixels darken under drifting cloud shadows.
 * Works on any material whose fragment shader ends with <opaque_fragment>.
 */
export function addCloudShadows(material: THREE.Material): void {
  const previous = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.uniforms['uWind'] = sharedUniforms.uWind;
    shader.uniforms['uCloudShadow'] = sharedUniforms.uCloudShadow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLzWorld;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvLzWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
    if (!shader.fragmentShader.includes('lzCloudShadow')) {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\nvarying vec3 vLzWorld;\n${NOISE_GLSL}\n${CLOUD_SHADOW_GLSL}`
        )
        .replace(
          '#include <opaque_fragment>',
          'outgoingLight *= lzCloudShadow(vLzWorld.xz);\n#include <opaque_fragment>'
        );
    }
  };
  material.customProgramCacheKey = () => `${previousKey()}|lz-cloud-shadow`;
  material.needsUpdate = true;
}
