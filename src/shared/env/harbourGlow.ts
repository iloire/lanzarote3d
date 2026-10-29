import * as THREE from 'three';
import { sharedUniforms } from '../../foundation/rendering/sharedUniforms';

/**
 * The lit buildings by the water, as 3d/city-on-hills.py writes them, five numbers each: world
 * x and z of the building, the world height of its top, its half width and a colour (0-2 lit
 * windows, warm to cool; 3-6 the named towers' lights)
 */
export type GlowSpots = number[];

const COLOURS: Record<number, string> = {
  0: '#ffb067',
  1: '#d6e4ff',
  2: '#ffd8a8',
  3: '#f2f6ff',
  4: '#7a6bff',
  5: '#dbe8ff',
  6: '#ffc85a',
};
// How bright one building's streak is at its brightest (linear), and how much of its width it takes
const STRENGTH = 0.55;
const WIDTH = 0.55;

const VERTEX_PARS = /* glsl */ `
  attribute vec4 aGlow;
  attribute vec3 aColour;
  uniform float uWaterY;
  varying vec3 vGlowColour;
  varying vec2 vStreak;
  varying float vLength;
`;

/**
 * Lay the streak on the water from the building towards the camera, as long as the building's
 * mirror image: a point h above the water, seen from H above it and D away, is mirrored D·h/(h+H)
 * out from the building's foot.
 */
const VERTEX = /* glsl */ `
  vec2 toCamera = cameraPosition.xz - aGlow.xy;
  float away = max( length( toCamera ), 1.0 );
  vec2 along = toCamera / away;
  vec2 across = vec2( -along.y, along.x );
  float high = max( cameraPosition.y - uWaterY, 1.0 );
  float tall = max( aGlow.z - uWaterY, 0.0 );
  float reach = min( away * tall / ( tall + high ), away * 0.97 );
  vec2 at = aGlow.xy + along * ( position.y * reach ) + across * ( position.x * aGlow.w * ${WIDTH.toFixed(2)} );
  vec3 transformed = vec3( at.x, uWaterY, at.y );
  vGlowColour = aColour;
  vStreak = position.xy;
  vLength = reach;
`;

const FRAGMENT_PARS = /* glsl */ `
  uniform float uTime;
  varying vec3 vGlowColour;
  varying vec2 vStreak;
  varying float vLength;
  float glowHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  float glowNoise( vec2 p ) {
    vec2 i = floor( p ), f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( glowHash( i ), glowHash( i + vec2( 1, 0 ) ), f.x ), mix( glowHash( i + vec2( 0, 1 ) ), glowHash( i + vec2( 1, 1 ) ), f.x ), f.y );
  }
`;

/** Broken across by the ripples, which drift; brightest in the middle, fading towards its end */
const FRAGMENT = /* glsl */ `
  float core = pow( 1.0 - abs( vStreak.x ), 1.6 );
  float waves = glowNoise( vec2( vStreak.x * 2.5, vStreak.y * vLength / 22.0 - uTime * 0.35 ) );
  float broken = smoothstep( 0.32, 0.75, waves );
  float fade = smoothstep( 0.0, 0.04, vStreak.y ) * ( 1.0 - smoothstep( 0.55, 1.0, vStreak.y ) );
  diffuseColor = vec4( vGlowColour * core * broken * fade * ${STRENGTH.toFixed(2)}, 1.0 );
`;

/**
 * The city's lights mirrored in the harbour: a streak on the water under each lit building near
 * it, laid out in the vertex shader every frame from where the camera is, so the reflections
 * always run towards the viewer, as long as the building's mirror image and broken up by the
 * ripples. One draw call, added on top of the water.
 */
export function harbourGlow(spots: GlowSpots, waterY: number): THREE.Mesh {
  const count = Math.floor(spots.length / 5);
  const quad = new THREE.PlaneGeometry(2, 1, 1, 8).translate(0, 0.5, 0);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute('position', quad.getAttribute('position'));
  geometry.setAttribute('uv', quad.getAttribute('uv'));
  const glow = new Float32Array(count * 4);
  const colours = new Float32Array(count * 3);
  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, z, top, half, tint] = spots.slice(i * 5, i * 5 + 5) as number[];
    glow.set([x!, z!, top!, half!], i * 4);
    colour.set(COLOURS[tint!] ?? COLOURS[0]!);
    colours.set([colour.r, colour.g, colour.b], i * 3);
  }
  geometry.setAttribute('aGlow', new THREE.InstancedBufferAttribute(glow, 4));
  geometry.setAttribute('aColour', new THREE.InstancedBufferAttribute(colours, 3));
  geometry.instanceCount = count;

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.uniforms['uWaterY'] = { value: waterY };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <begin_vertex>', VERTEX);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT}`);
  };
  material.customProgramCacheKey = () => 'harbour-glow';
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'harbour-glow';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}
