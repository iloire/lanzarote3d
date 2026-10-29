import * as THREE from 'three';
import type Sky from '../components/environment/Sky';
import { OceanMaterial } from './OceanMaterial';

/** How a place looks at night: the sky, the moon and the light it gives (see src/locations/README.md) */
export interface NightLook {
  /** Sky straight up and at the horizon (sRGB); the fog takes the horizon's */
  zenith?: string;
  horizon?: string;
  /** The city's glow low on the sky (sRGB) and how strong it is */
  skyGlow?: string;
  skyGlowStrength?: number;
  /** Where the moon is: degrees east of north, and above the horizon */
  moon?: number[];
  /** Moonlight's strength, and the flat ambient light's */
  moonlight?: number;
  ambient?: number;
  /** How many stars, 0–1 */
  stars?: number;
  /** The sea, deep and near the shore (sRGB) */
  sea?: string;
  shallowSea?: string;
}

const DEFAULTS: Required<NightLook> & { moon: [number, number] } = {
  zenith: '#02040b',
  horizon: '#0d1626',
  skyGlow: '#3a2a3a',
  skyGlowStrength: 0.6,
  moon: [135, 32],
  moonlight: 0.25,
  ambient: 0.18,
  stars: 0.6,
  sea: '#01040a',
  shallowSea: '#04121a',
};
const MOONLIGHT = '#9db4e0';
const AMBIENT = '#40507a';
const DOME_RADIUS = 150000;
// Apparent size of the moon, radians (the real one is 0.0045; bigger reads better on screen)
const MOON_SIZE = 0.016;

const DOME_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize( position );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const DOME_FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uMoonDir;
  uniform float uStars;
  varying vec3 vDir;

  float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  float noise( vec2 p ) {
    vec2 i = floor( p ), f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( hash( i ), hash( i + vec2( 1, 0 ) ), f.x ), mix( hash( i + vec2( 0, 1 ) ), hash( i + vec2( 1, 1 ) ), f.x ), f.y );
  }

  void main() {
    vec3 d = normalize( vDir );
    float up = d.y;
    vec3 colour = mix( uHorizon, uZenith, pow( smoothstep( -0.02, 0.55, up ), 0.6 ) );
    // The city's light on the haze, low over the horizon
    colour += uGlow * exp( -max( up, 0.0 ) * 9.0 );

    // Stars: one at most in each cell of a grid over the sky, fewer and fainter low down
    vec2 sphere = vec2( atan( d.z, d.x ), asin( clamp( up, -1.0, 1.0 ) ) ) * 520.0;
    vec2 cell = floor( sphere );
    float chance = hash( cell );
    vec2 at = cell + 0.2 + 0.6 * vec2( hash( cell + 3.1 ), hash( cell + 7.7 ) );
    float star = smoothstep( 0.5, 0.0, length( sphere - at ) );
    float bright = pow( hash( cell + 1.3 ), 5.0 ) * 0.9 + 0.2;
    float twinkle = 0.75 + 0.25 * sin( hash( cell + 9.1 ) * 40.0 );
    colour += vec3( 0.85, 0.9, 1.0 ) * star * bright * twinkle * step( 1.0 - 0.05 * uStars, chance ) * smoothstep( 0.06, 0.35, up );

    // The moon: a mottled disc and a soft halo round it
    float apart = acos( clamp( dot( d, uMoonDir ), -1.0, 1.0 ) );
    vec3 side = normalize( cross( uMoonDir, vec3( 0.0, 1.0, 0.0 ) ) );
    vec3 top = cross( side, uMoonDir );
    vec2 face = vec2( dot( d, side ), dot( d, top ) ) / ${MOON_SIZE.toFixed(4)};
    float mare = noise( face * 2.2 + 4.0 ) * 0.6 + noise( face * 5.0 ) * 0.4;
    float disc = 1.0 - smoothstep( ${(MOON_SIZE * 0.92).toFixed(5)}, ${MOON_SIZE.toFixed(5)}, apart );
    colour = mix( colour, vec3( 3.2, 3.1, 2.8 ) * ( 0.72 + 0.35 * mare ), disc );
    colour += vec3( 0.55, 0.62, 0.8 ) * ( exp( -apart * 18.0 ) * 0.28 + exp( -apart * 90.0 ) * 0.5 ) * ( 1.0 - disc );
    gl_FragColor = vec4( colour, 1.0 );
  }
`;

const srgb = (hex: string) => new THREE.Color(hex);

/** Unit vector towards degrees east of north and above the horizon (x east, z south) */
export const skyDirection = (azimuth: number, altitude: number): THREE.Vector3 => {
  const az = THREE.MathUtils.degToRad(azimuth);
  const alt = THREE.MathUtils.degToRad(altitude);
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt),
    Math.sin(alt),
    -Math.cos(az) * Math.cos(alt)
  );
};

function createDome(look: Required<NightLook>, moon: THREE.Vector3): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: srgb(look.zenith) },
      uHorizon: { value: srgb(look.horizon) },
      uGlow: { value: srgb(look.skyGlow).multiplyScalar(look.skyGlowStrength) },
      uMoonDir: { value: moon.clone() },
      uStars: { value: look.stars },
    },
    vertexShader: DOME_VERTEX,
    fragmentShader: DOME_FRAGMENT,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DOME_RADIUS, 48, 24), material);
  dome.name = 'night-sky';
  // Drawn first, behind everything, wherever the camera is
  dome.renderOrder = -1000;
  dome.frustumCulled = false;
  dome.onBeforeRender = (_renderer, _scene, camera) => dome.position.copy(camera.position);
  return dome;
}

/**
 * Turns a terrain scene to night after its theme has been applied: the day sky is hidden behind
 * a dome of deep blue with stars and the moon, the sun becomes moonlight from the moon's
 * direction (its shadows too), the flat light dims and turns blue, the sky's reflections (the
 * environment map) come from the night dome, and the sea goes dark. The fog's colour is the
 * theme's (`look.fogColor`), so the far city fades into the horizon's blue. Returns the dome.
 */
export function applyNight(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  sky: Sky | undefined,
  water: THREE.Mesh | undefined,
  night: NightLook
): THREE.Mesh {
  const look = { ...DEFAULTS, ...night };
  const moon = skyDirection(look.moon[0] ?? 135, look.moon[1] ?? 32);
  const dome = createDome(look, moon);
  scene.add(dome);

  if (sky) {
    sky.sky.visible = false;
    sky.sunPosition.copy(moon);
    sky.directionalLight.color.set(MOONLIGHT);
    sky.directionalLight.intensity = look.moonlight;
    sky.directionalLight.shadow.intensity = 0.4;
    sky.ambientLight.color.set(AMBIENT);
    sky.ambientLight.intensity = look.ambient;
  }

  // The night dome lights the reflections: the sea mirrors the moon
  const envScene = new THREE.Scene();
  const envDome = createDome(look, moon);
  envDome.onBeforeRender = () => {};
  envDome.geometry.scale(0.001, 0.001, 0.001);
  envScene.add(envDome);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0, 0.1, 1000).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();
  envDome.geometry.dispose();

  if (water?.material instanceof OceanMaterial) {
    water.material.setLook({ deepColor: look.sea, shallowColor: look.shallowSea });
  }
  return dome;
}
