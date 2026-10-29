import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';
import { addCloudShadows } from './shaderChunks';

/**
 * The bay's texture (3d/mont-saint-michel-to-glb.py) and where it lies: R how far the ground
 * lies below the terrain mesh (narrow channels and creeks, up to `carveMax` metres), G what the
 * ground is (0 sand, 0.5 salt meadow, 1 farmland), B a tone within it, A how much it paints.
 * Row 0 is the north edge.
 */
export interface BayField {
  texture: THREE.Texture;
  /** World x of the west edge, world z of the north edge, and the size east and south */
  bounds: THREE.Vector4;
  /** World units a metre up */
  unitsUp: number;
  carveMax: number;
  /** Low and high water, metres: the sand above high water never gets wet */
  low: number;
  high: number;
}

// How quickly, in phase (2π a tide), sand the ebb has left dries from glistening to damp, and
// how damp the flats stay all through low water
const DRYING = 1.6;
const DAMP = 0.4;

/** Value noise of its own, so it doesn't clash with the cloud-shadow chunk's */
const BAY_NOISE_GLSL = /* glsl */ `
  float bayHash( vec2 p ) {
    p = fract( p * vec2( 233.34, 851.73 ) );
    p += dot( p, p + 23.45 );
    return fract( p.x * p.y );
  }
  float bayNoise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( bayHash( i ), bayHash( i + vec2( 1.0, 0.0 ) ), u.x ),
      mix( bayHash( i + vec2( 0.0, 1.0 ) ), bayHash( i + vec2( 1.0, 1.0 ) ), u.x ),
      u.y
    );
  }
  float bayFbm( vec2 p ) {
    float v = 0.0;
    float a = 0.5;
    for ( int i = 0; i < 4; i++ ) {
      v += a * bayNoise( p );
      p = p * 2.07 + vec2( 11.3, 5.9 );
      a *= 0.5;
    }
    return v;
  }
  vec3 bayLinear( vec3 srgb ) {
    return pow( srgb, vec3( 2.2 ) );
  }
`;

/** Shared by the ground and the water: the field, and the tide as both see it */
const FIELD_GLSL = /* glsl */ `
  uniform sampler2D uBay;
  uniform vec4 uBayBounds;
  uniform vec4 uBayScale;
  uniform vec4 uTide;
  uniform vec3 uBayHaze;
  varying vec3 vBayWorld;
  ${BAY_NOISE_GLSL}
  vec4 bayField( vec2 xz ) {
    vec2 uv = vec2( ( xz.x - uBayBounds.x ) / uBayBounds.z, 1.0 - ( xz.y - uBayBounds.y ) / uBayBounds.w );
    return texture2D( uBay, uv );
  }
  // The low sky a flat wet surface mirrors at a glancing angle: the haze's own colour (the env
  // map's sky has no haze, so on its own the flats mirror a darker sky than the one above them)
  vec3 baySkyGlint( vec3 viewNormal, vec3 viewPosition ) {
    float cosine = clamp( dot( normalize( viewNormal ), normalize( -viewPosition ) ), 0.0, 1.0 );
    float fresnel = 0.02 + 0.98 * pow( 1.0 - cosine, 5.0 );
    return uBayHaze * fresnel;
  }
  // How long ago, as phase, the ebb left ground this high (metres); 0 under water, 2π above
  // high water. Mirrors Tide.dryFor.
  float bayDryFor( float metres ) {
    float mid = uTide.z;
    float amp = uTide.w;
    if ( metres >= mid + amp ) return 6.2832;
    if ( metres <= mid - amp ) return 0.0;
    float wet = acos( clamp( ( mid - metres ) / amp, -1.0, 1.0 ) );
    float phase = uTide.y;
    if ( phase >= wet && phase <= 6.2832 - wet ) return 0.0;
    return phase > 3.1416 ? phase - ( 6.2832 - wet ) : phase + wet;
  }
`;

/**
 * The bay's ground and its tide: a copy of the terrain painted from the bay's texture (sand,
 * salt meadow and fields), whose sand glistens where the ebb has just left it and darkens to wet
 * mud in the channels, which fill with water the mesh is too coarse to hold; and the water itself,
 * a sheet over the terrain at the tide's level, clear and silty at its edge, greyer and greener
 * deeper, with a line of foam riding the flood across the flats.
 */
export class TidalBay {
  readonly ground: THREE.Mesh;
  readonly water: THREE.Mesh;
  private readonly uniforms: {
    uBay: { value: THREE.Texture };
    uBayBounds: { value: THREE.Vector4 };
    // World units a metre up, the carve at full scale (metres), and unused
    uBayScale: { value: THREE.Vector4 };
    // Level (world units), phase, mid-tide and amplitude (metres)
    uTide: { value: THREE.Vector4 };
    // The haze on the horizon, which wet sand and water mirror
    uBayHaze: { value: THREE.Color };
  };

  constructor(terrain: THREE.Mesh, field: BayField) {
    this.uniforms = {
      uBay: { value: field.texture },
      uBayBounds: { value: field.bounds },
      uBayScale: { value: new THREE.Vector4(field.unitsUp, field.carveMax, 0, 0) },
      uBayHaze: { value: new THREE.Color(0.9, 0.7, 0.5) },
      uTide: {
        value: new THREE.Vector4(0, 0, (field.high + field.low) / 2, (field.high - field.low) / 2),
      },
    };
    terrain.updateMatrixWorld(true);

    this.ground = new THREE.Mesh(terrain.geometry, this.groundMaterial());
    this.ground.name = 'bay-ground';
    this.ground.matrixAutoUpdate = false;
    this.ground.matrix.copy(terrain.matrixWorld);
    this.ground.receiveShadow = true;
    this.ground.raycast = () => {};

    const geometry = terrain.geometry.clone();
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const ground = new Float32Array(position.count);
    for (let i = 0; i < position.count; i++) ground[i] = position.getY(i);
    geometry.setAttribute('ground', new THREE.BufferAttribute(ground, 1));
    this.water = new THREE.Mesh(geometry, this.waterMaterial());
    this.water.name = 'tide';
    this.water.matrixAutoUpdate = false;
    this.water.matrix.copy(terrain.matrixWorld);
    this.water.frustumCulled = false;
    this.water.receiveShadow = true;
    this.water.raycast = () => {};
    // Drawn first among the see-through things, so clouds and spray over it blend on top
    this.water.renderOrder = -1;
  }

  /** The tide's level (metres) and phase (see Tide) */
  setTide(metres: number, phase: number): void {
    const tide = this.uniforms.uTide.value;
    tide.x = metres * this.uniforms.uBayScale.value.x;
    tide.y = phase;
  }

  /** The colour of the haze on the horizon (the fog's), which the wet flats mirror */
  setHaze(colour: THREE.Color): void {
    this.uniforms.uBayHaze.value.copy(colour);
  }

  dispose(): void {
    (this.ground.material as THREE.Material).dispose();
    (this.water.material as THREE.Material).dispose();
    this.water.geometry.dispose();
  }

  private groundMaterial(): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBayWorld;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvBayWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;'
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\n${FIELD_GLSL}\nfloat bayRough = 0.9;\nfloat bayFlat = 0.0;`
        )
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', GROUND_COLOR_GLSL)
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = bayRough;'
        )
        .replace(
          '#include <normal_fragment_maps>',
          // Water and wet sand lie flat whatever the mesh's slope, so they mirror the sky
          '#include <normal_fragment_maps>\nnormal = normalize( mix( normal, ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz, bayFlat ) );'
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += baySkyGlint( normal, -vViewPosition ) * bayFlat * 0.8;'
        );
    };
    material.customProgramCacheKey = () => 'tidal-bay-ground';
    addCloudShadows(material);
    return material;
  }

  private waterMaterial(): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.08,
      metalness: 0,
      transparent: true,
    });
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms, {
        uTime: sharedUniforms.uTime,
        uWind: sharedUniforms.uWind,
      });
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float ground;\nvarying float vBayGround;\nvarying vec3 vBayWorld;\nuniform vec4 uTide;'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvBayGround = ground;\ntransformed.y = uTide.x;'
        )
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvBayWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;'
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\n${FIELD_GLSL}\nvarying float vBayGround;\nuniform float uTime;\nuniform vec2 uWind;\nfloat bayDepth = 0.0;\nfloat bayFoam = 0.0;`
        )
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', WATER_COLOR_GLSL)
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = mix( 0.06, 0.8, bayFoam );'
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += baySkyGlint( normal, -vViewPosition ) * ( 1.0 - bayFoam ) * 0.45;'
        )
        .replace('#include <normal_fragment_maps>', WATER_NORMAL_GLSL);
    };
    material.customProgramCacheKey = () => 'tidal-bay-water';
    return material;
  }
}

const GROUND_COLOR_GLSL = /* glsl */ `
  vec4 bay = bayField( vBayWorld.xz );
  // Dithered out where the bay hands over to the terrain's own look on the hills
  if ( bay.a < 0.5 + 0.4 * ( bayNoise( vBayWorld.xz * 0.02 ) - 0.5 ) ) discard;
  float up = uBayScale.x;
  float groundY = vBayWorld.y - bay.r * uBayScale.y * up;
  float metres = groundY / up;
  float under = uTide.x - groundY;            // water over the true ground, world units
  float meshUnder = uTide.x - vBayWorld.y;    // ... over the mesh, which the tide sheet covers
  float kind = bay.g;
  float tone = bay.b;
  vec2 xz = vBayWorld.xz;
  float far = smoothstep( 1500.0, 9000.0, length( vBayWorld - cameraPosition ) );

  // Sand: grey-beige tangue, shell banks lighter, mud darker, ribbed by the current
  float grain = bayFbm( xz * 0.004 ) * 0.5 + bayNoise( xz * 0.05 ) * 0.5;
  vec3 sand = mix( vec3( 0.58, 0.53, 0.44 ), vec3( 0.84, 0.78, 0.66 ), clamp( tone * 0.85 + grain * 0.3, 0.0, 1.0 ) );
  float ripple = sin( dot( xz, vec2( 0.55, 0.83 ) ) * 0.9 + bayFbm( xz * 0.01 ) * 9.0 );
  float rippleFade = 1.0 - smoothstep( 0.4, 1.5, fwidth( dot( xz, vec2( 0.55, 0.83 ) ) * 0.9 ) );
  sand *= 1.0 + ripple * 0.05 * rippleFade;

  // Salt meadows: grey-green sea grass, straw in patches, the creeks bare mud
  vec3 meadow = mix( vec3( 0.45, 0.52, 0.34 ), vec3( 0.68, 0.66, 0.46 ), clamp( tone + ( grain - 0.5 ) * 0.4, 0.0, 1.0 ) );
  meadow = mix( meadow, vec3( 0.40, 0.37, 0.31 ), smoothstep( 0.08, 0.16, bay.r ) );

  // Polder fields: each strip its crop, hedges between
  vec3 farm;
  if ( tone < 0.05 ) farm = vec3( 0.20, 0.27, 0.13 );
  else if ( tone < 0.30 ) farm = vec3( 0.40, 0.50, 0.23 );
  else if ( tone < 0.55 ) farm = vec3( 0.52, 0.58, 0.28 );
  else if ( tone < 0.78 ) farm = vec3( 0.68, 0.60, 0.36 );
  else farm = vec3( 0.46, 0.37, 0.27 );
  farm *= 0.9 + 0.2 * grain;

  vec3 colour = kind < 0.5 ? mix( sand, meadow, kind * 2.0 ) : mix( meadow, farm, ( kind - 0.5 ) * 2.0 );
  float lowland = 1.0 - smoothstep( 0.6, 0.85, kind );

  // Wet where the ebb has just left, drying dull over the next part of the tide
  float dryFor = bayDryFor( metres );
  float wet = under > 0.0 ? 1.0 : max( exp( -dryFor / ${DRYING.toFixed(2)} ), ${DAMP.toFixed(2)} * step( dryFor, 6.2 ) );
  // Puddles left in the hollows stay wet longer
  wet = max( wet, smoothstep( 0.62, 0.8, bayFbm( xz * 0.012 + 3.0 ) ) * step( metres, uTide.z + uTide.w ) * 0.8 );
  wet *= lowland;
  colour = mix( colour, colour * vec3( 0.7, 0.72, 0.75 ), wet );
  float sheen = wet * ( 1.0 - smoothstep( 0.3, 0.5, kind ) );
  bayRough = mix( 0.92, 0.07, sheen );
  bayFlat = sheen * 0.85;

  // Channels the mesh is too coarse to hold: water in them while the sheet is still below
  if ( under > 0.0 && meshUnder < 0.0 ) {
    float edge = smoothstep( 0.0, 0.25 * up, under );
    // As the tide sheet does: silty water over the sand, the sand showing through at the edge
    colour = mix( colour, vec3( 0.42, 0.47, 0.44 ), edge * 0.6 );
    bayRough = mix( bayRough, 0.04, edge );
    bayFlat = max( bayFlat, edge );
  }
  colour = mix( colour, colour * 0.95 + vec3( 0.02 ), far );
  vec4 diffuseColor = vec4( bayLinear( colour ), opacity );
`;

const WATER_COLOR_GLSL = /* glsl */ `
  vec4 bay = bayField( vBayWorld.xz );
  float up = uBayScale.x;
  float groundY = vBayGround - bay.r * uBayScale.y * up;
  bayDepth = ( uTide.x - groundY ) / up;      // metres of water
  if ( bayDepth <= 0.0 ) discard;
  vec2 xz = vBayWorld.xz;
  float wander = bayFbm( xz * 0.006 + uTime * 0.02 );
  // Silty and see-through at the edge, grey-green, then slate further out
  vec3 shallow = vec3( 0.60, 0.56, 0.46 );
  vec3 mid = vec3( 0.36, 0.42, 0.40 );
  vec3 deep = vec3( 0.18, 0.26, 0.29 );
  vec3 colour = mix( shallow, mid, smoothstep( 0.0, 1.2, bayDepth ) );
  colour = mix( colour, deep, smoothstep( 1.5, 9.0, bayDepth + wander * 2.0 ) );
  float alpha = mix( 0.15, 0.9, smoothstep( 0.0, 0.7, bayDepth ) );
  // The flood's leading edge: a line of foam, broken, riding in over the sand
  float rising = step( uTide.y, 3.1416 ) * ( 1.0 - smoothstep( 2.6, 3.1, uTide.y ) );
  float band = 1.0 - smoothstep( 0.0, 0.22 + wander * 0.25, bayDepth );
  float broken = smoothstep( 0.35, 0.75, bayNoise( xz * 0.03 + vec2( uTime * 0.4, 0.0 ) ) );
  bayFoam = band * broken * rising;
  // Behind it, streaks of foam left on the incoming water
  bayFoam = max( bayFoam, rising * smoothstep( 0.72, 0.9, bayFbm( xz * 0.02 - uTime * 0.05 ) ) * ( 1.0 - smoothstep( 0.2, 1.5, bayDepth ) ) * 0.6 );
  colour = mix( colour, vec3( 0.93, 0.92, 0.88 ), bayFoam );
  alpha = max( alpha, bayFoam );
  vec4 diffuseColor = vec4( bayLinear( colour ), alpha * opacity );
`;

const WATER_NORMAL_GLSL = /* glsl */ `
  {
    // Small wind ripples, calmer in the shallows and fading with distance so it doesn't shimmer
    float camDist = length( vBayWorld - cameraPosition );
    float amp = 0.9 * smoothstep( 0.0, 1.5, bayDepth ) / ( 1.0 + camDist / 5000.0 );
    vec2 p = vBayWorld.xz;
    float speed = length( uWind );
    vec2 dir = speed > 0.01 ? uWind / speed : vec2( 1.0, 0.0 );
    vec2 side = vec2( -dir.y, dir.x );
    float dhdx = 0.0;
    float dhdz = 0.0;
    // Two crossing trains of short waves, their crests broken up by noise so they don't band
    float breakUp = bayFbm( p * 0.004 ) * 12.0;
    float ph = dot( p, dir ) * 0.05 - uTime * 1.4 + breakUp;
    dhdx += cos( ph ) * dir.x * 0.05 * 0.35;
    dhdz += cos( ph ) * dir.y * 0.05 * 0.35;
    vec2 d2 = normalize( dir + side * 0.7 );
    float ph2 = dot( p, d2 ) * 0.11 - uTime * 2.1 - breakUp;
    dhdx += cos( ph2 ) * d2.x * 0.11 * 0.2;
    dhdz += cos( ph2 ) * d2.y * 0.11 * 0.2;
    float e = 3.0;
    float n0 = bayFbm( p * 0.03 + dir * uTime * 0.08 );
    dhdx += ( bayFbm( p * 0.03 + vec2( e * 0.03, 0.0 ) + dir * uTime * 0.08 ) - n0 ) * 2.2 / e;
    dhdz += ( bayFbm( p * 0.03 + vec2( 0.0, e * 0.03 ) + dir * uTime * 0.08 ) - n0 ) * 2.2 / e;
    vec3 worldNormal = normalize( vec3( -dhdx * amp, 1.0, -dhdz * amp ) );
    normal = normalize( ( viewMatrix * vec4( worldNormal, 0.0 ) ).xyz );
  }
`;
