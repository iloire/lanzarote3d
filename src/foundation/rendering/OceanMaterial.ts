import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';
import { NOISE_GLSL, CLOUD_SHADOW_GLSL } from './shaderChunks';
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
          'outgoingLight *= lzCloudShadow(vLzWorld.xz);\n#include <opaque_fragment>'
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
  ${NOISE_GLSL}
  ${CLOUD_SHADOW_GLSL}

  float lzFoam = 0.0;

  // Distance to the nearest beach, in world units (uCoastMax far out at sea).
  float lzCoastDistance(vec2 xz) {
    if (uHasCoast < 0.5) return uCoastMax;
    vec2 uv = (xz - uCoastBounds.xy) / uCoastBounds.zw;
    uv.y = 1.0 - uv.y;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return uCoastMax;
    return texture2D(uCoast, uv).r * uCoastMax;
  }

  // Height of the sea surface: a few long swells along the wind plus choppy noise.
  float lzWaveHeight(vec2 p, vec2 dir, float t) {
    vec2 side = vec2(-dir.y, dir.x);
    float h = 0.0;
    h += sin(dot(p, dir) * 0.018 - t * 0.9) * 1.0;
    h += sin(dot(p, normalize(dir + side * 0.6)) * 0.031 - t * 1.3) * 0.55;
    h += sin(dot(p, normalize(dir - side * 0.45)) * 0.047 - t * 1.7) * 0.35;
    h += (lzFbm(p * 0.012 + dir * t * 0.05) - 0.5) * 2.2;
    return h;
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
  float lzSurfBand = sin(lzCoast * 0.11 + uTime * 1.6 + lzFbm(vLzWorld.xz * 0.01) * 6.0);
  float lzSurf = lzSurfZone * smoothstep(0.75, 0.98, lzSurfBand) * 0.85;
  float lzShoreFoam = (1.0 - smoothstep(0.0, 18.0, lzCoast)) * 0.9;

  // Whitecaps out at sea, more of them as the wind picks up.
  float lzCapNoise = lzFbm(vLzWorld.xz * 0.006 - lzWindDir * uTime * 0.35);
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
    float e = 4.0;
    float h0 = lzWaveHeight(p, lzWindDir, uTime);
    float hx = lzWaveHeight(p + vec2(e, 0.0), lzWindDir, uTime);
    float hz = lzWaveHeight(p + vec2(0.0, e), lzWindDir, uTime);
    vec3 worldNormal = normalize(vec3(-(hx - h0) / e * amp, 1.0, -(hz - h0) / e * amp));
    normal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
  }
`;
