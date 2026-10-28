import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';
import { NOISE_GLSL } from './shaderChunks';
import { CoastField } from './CoastField';

export interface OceanLook {
  deepColor: string;
  shallowColor: string;
  // How far out from the beach the water stays shallow, in world units.
  shallowDistance: number;
}

export const DEFAULT_OCEAN_LOOK: OceanLook = {
  deepColor: '#06283f',
  shallowColor: '#1fa5a8',
  shallowDistance: 700,
};

/**
 * The sea: a MeshStandardMaterial whose normal, colour and roughness are rewritten per
 * pixel. Physically based lighting supplies the sky reflection (from scene.environment)
 * and the sun glint; the patch adds wind-driven wave normals, turquoise shallows from
 * the baked coast distance, surf lines rolling onto the beaches, whitecaps and drifting
 * cloud shadows. The plane itself stays a single quad.
 */
export class OceanMaterial extends THREE.MeshStandardMaterial {
  readonly oceanUniforms = {
    uShallow: { value: new THREE.Color(DEFAULT_OCEAN_LOOK.shallowColor) },
    uShallowDistance: { value: DEFAULT_OCEAN_LOOK.shallowDistance },
    uCoast: { value: null as THREE.Texture | null },
    uCoastBounds: { value: new THREE.Vector4(0, 0, 1, 1) },
    uCoastMax: { value: 1 },
    uHasCoast: { value: 0 },
  };

  constructor(look: OceanLook = DEFAULT_OCEAN_LOOK) {
    super({ color: look.deepColor, roughness: 0.12, metalness: 0.0 });
    this.setLook(look);

    this.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.oceanUniforms, {
        uTime: sharedUniforms.uTime,
        uWind: sharedUniforms.uWind,
        uCloudShadow: sharedUniforms.uCloudShadow,
      });

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLzWorld;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvLzWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
        );

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${OCEAN_PARS_GLSL}`)
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', OCEAN_COLOR_GLSL)
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, lzFoam);'
        )
        .replace('#include <normal_fragment_maps>', OCEAN_NORMAL_GLSL)
        .replace(
          '#include <opaque_fragment>',
          'outgoingLight *= lzOceanCloudShadow(vLzWorld.xz);\n#include <opaque_fragment>'
        );
    };
  }

  setLook(look: Partial<OceanLook>): void {
    if (look.deepColor) this.color.set(look.deepColor);
    if (look.shallowColor) this.oceanUniforms.uShallow.value.set(look.shallowColor);
    if (look.shallowDistance !== undefined) {
      this.oceanUniforms.uShallowDistance.value = look.shallowDistance;
    }
  }

  setCoast(field: CoastField): void {
    this.oceanUniforms.uCoast.value = field.texture;
    this.oceanUniforms.uCoastBounds.value.copy(field.bounds);
    this.oceanUniforms.uCoastMax.value = field.maxDistance;
    this.oceanUniforms.uHasCoast.value = 1;
  }

  override customProgramCacheKey(): string {
    return 'lz-ocean';
  }
}

const OCEAN_PARS_GLSL = /* glsl */ `
  varying vec3 vLzWorld;
  uniform vec3 uShallow;
  uniform float uShallowDistance;
  uniform sampler2D uCoast;
  uniform vec4 uCoastBounds;
  uniform float uCoastMax;
  uniform float uHasCoast;
  uniform float uTime;
  uniform vec2 uWind;
  uniform float uCloudShadow;
  ${NOISE_GLSL}

  float lzOceanFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * lzNoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }

  float lzOceanCloudShadow(vec2 worldXZ) {
    vec2 p = (worldXZ - uWind * uTime * 8.0) / 2600.0;
    float c = smoothstep(0.52, 0.72, lzOceanFbm(p));
    return 1.0 - c * uCloudShadow;
  }

  float lzFoam = 0.0;

  // Distance to the nearest beach, in world units (uCoastMax far out at sea).
  float lzCoastDistance(vec2 xz) {
    if (uHasCoast < 0.5) return uCoastMax;
    vec2 uv = (xz - uCoastBounds.xy) / uCoastBounds.zw;
    uv.y = 1.0 - uv.y;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return uCoastMax;
    return texture2D(uCoast, uv).r * uCoastMax;
  }

`;

const OCEAN_COLOR_GLSL = /* glsl */ `
  float lzWindSpeed = length(uWind);
  vec2 lzWindDir = lzWindSpeed > 0.01 ? uWind / lzWindSpeed : vec2(1.0, 0.0);
  float lzCoast = lzCoastDistance(vLzWorld.xz);
  float lzDepth = smoothstep(0.0, uShallowDistance, lzCoast);
  vec3 lzWater = mix(uShallow, diffuse, lzDepth);

  // Surf: bands that roll in towards the beach and break in the last few tens of metres.
  float lzSurfZone = 1.0 - smoothstep(15.0, 140.0, lzCoast);
  float lzSurfBand = sin(lzCoast * 0.11 + uTime * 1.6 + lzOceanFbm(vLzWorld.xz * 0.01) * 6.0);
  float lzSurf = lzSurfZone * smoothstep(0.75, 0.98, lzSurfBand) * 0.85;
  float lzShoreFoam = (1.0 - smoothstep(0.0, 18.0, lzCoast)) * 0.9;

  // Whitecaps out at sea, more of them as the wind picks up.
  float lzCapNoise = lzOceanFbm(vLzWorld.xz * 0.006 - lzWindDir * uTime * 0.35);
  float lzCapThreshold = mix(0.95, 0.72, smoothstep(3.0, 12.0, lzWindSpeed));
  float lzCaps = smoothstep(lzCapThreshold, lzCapThreshold + 0.05, lzCapNoise) * lzDepth;

  lzFoam = clamp(max(max(lzSurf, lzShoreFoam), lzCaps * 0.8) * uHasCoast + lzCaps * (1.0 - uHasCoast), 0.0, 1.0);
  vec4 diffuseColor = vec4(mix(lzWater, vec3(0.92, 0.95, 0.96), lzFoam), opacity);
`;

const OCEAN_NORMAL_GLSL = /* glsl */ `
  {
    // Fade wave detail with distance so far water doesn't shimmer, and calm it near the beach.
    float camDist = length(vLzWorld - cameraPosition);
    float amp = 8.0 * (1.0 / (1.0 + camDist / 6000.0)) * mix(0.35, 1.0, lzDepth);
    amp *= mix(0.6, 1.4, smoothstep(2.0, 12.0, lzWindSpeed));
    vec2 p = vLzWorld.xz;
    vec2 side = vec2(-lzWindDir.y, lzWindDir.x);
    vec2 dir2 = normalize(lzWindDir + side * 0.6);
    vec2 dir3 = normalize(lzWindDir - side * 0.45);
    float dhdx = cos(dot(p, lzWindDir) * 0.018 - uTime * 0.9) * lzWindDir.x * 0.018;
    float dhdz = cos(dot(p, lzWindDir) * 0.018 - uTime * 0.9) * lzWindDir.y * 0.018;
    float phase2 = dot(p, dir2) * 0.031 - uTime * 1.3;
    dhdx += cos(phase2) * dir2.x * 0.031 * 0.55;
    dhdz += cos(phase2) * dir2.y * 0.031 * 0.55;
    float phase3 = dot(p, dir3) * 0.047 - uTime * 1.7;
    dhdx += cos(phase3) * dir3.x * 0.047 * 0.35;
    dhdz += cos(phase3) * dir3.y * 0.047 * 0.35;

    // Keep fine chop while using one three-octave noise field instead of three
    // four-octave height samples for the finite-difference normal.
    float e = 4.0;
    vec2 noisePoint = p * 0.012 + lzWindDir * uTime * 0.05;
    float noise0 = lzOceanFbm(noisePoint);
    dhdx += (lzOceanFbm(noisePoint + vec2(e * 0.012, 0.0)) - noise0) * 2.2 / e;
    dhdz += (lzOceanFbm(noisePoint + vec2(0.0, e * 0.012)) - noise0) * 2.2 / e;

    vec3 worldNormal = normalize(vec3(-dhdx * amp, 1.0, -dhdz * amp));
    normal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
  }
`;
