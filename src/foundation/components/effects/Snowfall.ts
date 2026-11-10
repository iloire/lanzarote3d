import * as THREE from 'three';
import { sharedUniforms } from '../../rendering/sharedUniforms';

/** How many flakes, in a cube how wide (metres) round the camera: a light fall, not a blizzard */
const FLAKES = 10000;
const SIZE = 500;
/** A flake's size, in metres, and how fast it falls and sways */
const FLAKE = 1.4;
const FALL = 1.6;
const SWAY = 1.5;
/** How much of the wind carries them sideways */
const WIND_SHARE = 0.6;
/** Flakes this close to the camera (metres) fade out, so none blots the view */
const NEAR = 12;

/** A soft round flake, drawn once on a canvas */
function flakeTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d')!;
  const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Light snow falling round the camera wherever it goes. The flakes fill a cube that wraps round
 * the camera in the vertex shader, so it costs the same anywhere on the map: one draw call and
 * no work on the CPU per frame. They fall, sway and drift with the shared wind, on the shared
 * clock, and fade near the camera and towards the cube's edges so none pops in or out.
 */
export class Snowfall {
  readonly points: THREE.Points;

  constructor() {
    const positions = new Float32Array(FLAKES * 3);
    const phases = new Float32Array(FLAKES);
    for (let i = 0; i < FLAKES; i++) {
      positions.set([Math.random() * SIZE, Math.random() * SIZE, Math.random() * SIZE], i * 3);
      phases[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('lzPhase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.PointsMaterial({
      size: FLAKE,
      map: flakeTexture(),
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    material.onBeforeCompile = shader => {
      shader.uniforms['uTime'] = sharedUniforms.uTime;
      shader.uniforms['uWind'] = sharedUniforms.uWind;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uTime;
          uniform vec2 uWind;
          attribute float lzPhase;
          varying float vLzFade;`
        )
        .replace(
          '#include <begin_vertex>',
          `vec3 lzDrift = vec3( uWind.x, 0.0, uWind.y ) * ${WIND_SHARE.toFixed(2)} * uTime;
          lzDrift.y -= ${FALL.toFixed(2)} * uTime;
          lzDrift.xz += ${SWAY.toFixed(2)} * vec2( sin( uTime * 0.7 + lzPhase ), cos( uTime * 0.5 + lzPhase * 1.3 ) );
          // Wrapped into the cube centred on the camera
          vec3 lzHalf = vec3( ${(SIZE / 2).toFixed(1)} );
          vec3 transformed = mod( position + lzDrift - cameraPosition + lzHalf, ${SIZE.toFixed(1)} )
            + cameraPosition - lzHalf;
          float lzDistance = length( transformed - cameraPosition );
          vLzFade = smoothstep( ${NEAR.toFixed(1)}, ${(NEAR * 2).toFixed(1)}, lzDistance )
            * ( 1.0 - smoothstep( ${(SIZE * 0.35).toFixed(1)}, ${(SIZE * 0.5).toFixed(1)}, lzDistance ) );`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vLzFade;')
        .replace(
          '#include <alphatest_fragment>',
          'diffuseColor.a *= vLzFade;\n#include <alphatest_fragment>'
        );
    };
    material.customProgramCacheKey = () => 'lz-snowfall';

    this.points = new THREE.Points(geometry, material);
    this.points.name = 'snowfall';
    // The shader moves every flake to the camera, so the cube is always in view
    this.points.frustumCulled = false;
  }

  dispose(): void {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    const material = this.points.material as THREE.PointsMaterial;
    material.map?.dispose();
    material.dispose();
  }
}
