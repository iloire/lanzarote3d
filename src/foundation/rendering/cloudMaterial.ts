import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';
import { CloudTheme } from '../types/Theme';

/** The clouds' look when the theme leaves it out */
export const DEFAULT_CLOUDS: Required<CloudTheme> = {
  light: '#ffffff',
  shade: '#b4c0d4',
  base: '#8b98b0',
  rim: '#fff3dc',
  brightness: 1.35,
};

/** Warmest the sun turns the clouds, reached with the sun on the horizon */
const SUNSET_TINT = new THREE.Color(1, 0.68, 0.5);

const uniforms = {
  uTime: sharedUniforms.uTime,
  uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
  uSunTint: { value: new THREE.Color(1, 1, 1) },
  uLight: { value: new THREE.Color() },
  uShade: { value: new THREE.Color() },
  uBase: { value: new THREE.Color() },
  uRim: { value: new THREE.Color() },
};

/**
 * One material for every cloud. It is unlit by the scene's lights and shades the faceted
 * lobes itself: white where a face turns to the sun, blue-grey where it turns away, the
 * flat underside darker still, and a silver edge when the camera looks towards the sun.
 * The lobes breathe and the cloud bobs in the vertex shader, so clouds cost no CPU per frame.
 */
export const cloudMaterial = new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms },
  fog: true,
  vertexShader: /* glsl */ `
    uniform float uTime;
    // xyz: centre of the lobe the vertex belongs to, w: its phase
    attribute vec4 aLobe;
    // x: phase of the whole cloud, y: height above the cloud base, 0-1
    attribute vec2 aCloud;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vHeight;
    #include <common>
    #include <fog_pars_vertex>
    void main() {
      float t = uTime + aCloud.x;
      vec3 p = aLobe.xyz + (position - aLobe.xyz) * (1.0 + 0.05 * sin(t * 0.7 + aLobe.w));
      p.y = max(p.y, 0.0) + sin(t * 0.1) * 40.0;
      vec4 worldPosition = modelMatrix * vec4(p, 1.0);
      vWorldPosition = worldPosition.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vHeight = aCloud.y;
      vec4 mvPosition = viewMatrix * worldPosition;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uSunDirection;
    uniform vec3 uSunTint;
    uniform vec3 uLight;
    uniform vec3 uShade;
    uniform vec3 uBase;
    uniform vec3 uRim;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vHeight;
    #include <common>
    #include <fog_pars_fragment>
    void main() {
      vec3 n = normalize(vNormal);
      vec3 v = normalize(cameraPosition - vWorldPosition);
      float lit = smoothstep(-0.35, 0.9, dot(n, uSunDirection));
      vec3 color = mix(uShade, uLight * uSunTint, lit);
      float under = max(1.0 - smoothstep(0.0, 0.35, vHeight), smoothstep(-0.2, -0.9, n.y));
      color = mix(color, uBase, under * 0.85);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0)
        * (0.25 + 0.75 * max(dot(-v, uSunDirection), 0.0));
      color += uRim * uSunTint * rim;
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `,
});
/** Colours the clouds from the theme; the brightness scales the colours, not the fog */
export function setCloudColors(theme: CloudTheme = DEFAULT_CLOUDS): void {
  const c = { ...DEFAULT_CLOUDS, ...theme };
  uniforms.uLight.value.set(c.light).multiplyScalar(c.brightness);
  uniforms.uShade.value.set(c.shade).multiplyScalar(c.brightness);
  uniforms.uBase.value.set(c.base).multiplyScalar(c.brightness);
  uniforms.uRim.value.set(c.rim).multiplyScalar(c.brightness);
}

/** Lights the clouds from the sun, warming them as it nears the horizon */
export function setCloudSun(direction: THREE.Vector3): void {
  uniforms.uSunDirection.value.copy(direction).normalize();
  const low = 1 - THREE.MathUtils.smoothstep(uniforms.uSunDirection.value.y, 0.05, 0.4);
  uniforms.uSunTint.value.setRGB(1, 1, 1).lerp(SUNSET_TINT, low);
}

setCloudColors();
