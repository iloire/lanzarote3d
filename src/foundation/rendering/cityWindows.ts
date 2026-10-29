import * as THREE from 'three';
import { sharedUniforms } from './sharedUniforms';

/** The street grid a city was voxelised on, as 3d/city-to-glb.py writes it in the node's extras */
export interface CityGrid {
  /** Where the grid starts, metres along the street and avenue directions */
  origin: [number, number];
  /** Voxel size, metres */
  size: number;
  /** Unit vectors (east, north) across town and up the avenues */
  street: [number, number];
  avenue: [number, number];
  unitsPerMetre: number;
  /** World height of the ground and world units per metre up */
  ground: number;
  up: number;
}

/** Storey height, metres */
const FLOOR = 3.5;
/** Walls are this bright at the street, where little sky reaches them, and fully lit this high, metres */
const WALL_FOOT = 0.55;
const WALL_LIT = 30;

/**
 * Draws windows on a city's walls in the shader, so they cost no geometry: one pane per voxel
 * across and per storey up, lined up with the voxels. Walls marked punched (1) get a window in
 * the middle of each cell, glass curtain walls (2) a pane filling it between thin mullions;
 * roofs (0) none. Each pane is a slightly different dark glass, and shinier than the wall, so it
 * catches the sun. Far off, where a cell is under a pixel or so, the grid fades into its average
 * so it doesn't shimmer. Walls darken towards the street, as the sky they see narrows.
 */
export function addCityWindows(mesh: THREE.Mesh, grid: CityGrid, night = false): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.onBeforeCompile = shader => {
    if (night) shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.uniforms['uCityOrigin'] = { value: new THREE.Vector2(...grid.origin) };
    shader.uniforms['uCityStreet'] = { value: new THREE.Vector2(...grid.street) };
    shader.uniforms['uCityAvenue'] = { value: new THREE.Vector2(...grid.avenue) };
    shader.uniforms['uCityGrid'] = {
      value: new THREE.Vector4(grid.size, grid.unitsPerMetre, grid.ground, grid.up),
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float _windows;
        varying float vCityWindows;
        varying vec3 vCityWorld;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vCityWindows = _windows;
        vCityWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vCityWindows;
        varying vec3 vCityWorld;
        uniform vec2 uCityOrigin;
        uniform vec2 uCityStreet;
        uniform vec2 uCityAvenue;
        uniform vec4 uCityGrid;
        float cityPane = 0.0;
        ${night ? NIGHT_PARS : ''}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if ( vCityWindows > 0.5 ) {
          // The wall's normal from the faces' own slope, its position in metres east and north
          vec3 wallNormal = normalize( cross( dFdx( vCityWorld ), dFdy( vCityWorld ) ) );
          vec2 metres = vec2( vCityWorld.x, -vCityWorld.z ) / uCityGrid.y;
          float acrossTown = dot( metres, uCityStreet ) - uCityOrigin.x;
          float upAvenue = dot( metres, uCityAvenue ) - uCityOrigin.y;
          // A wall facing up or down an avenue runs across town, and the other way round
          bool facesAvenue = abs( dot( vec2( wallNormal.x, -wallNormal.z ), uCityAvenue ) ) > 0.5;
          float along = facesAvenue ? acrossTown : upAvenue;
          vec2 cell = vec2( along / uCityGrid.x, ( vCityWorld.y - uCityGrid.z ) / uCityGrid.w / ${FLOOR.toFixed(1)} );
          bool curtain = vCityWindows > 1.5;
          vec2 lo = curtain ? vec2( 0.07, 0.1 ) : vec2( 0.28, 0.3 );
          vec2 hi = curtain ? vec2( 0.93, 0.92 ) : vec2( 0.72, 0.82 );
          vec2 f = fract( cell );
          vec2 w = fwidth( cell );
          vec2 inside = smoothstep( lo - w, lo + w, f ) * ( 1.0 - smoothstep( hi - w, hi + w, f ) );
          float area = ( hi.x - lo.x ) * ( hi.y - lo.y );
          cityPane = mix( inside.x * inside.y, area, smoothstep( 0.35, 0.8, max( w.x, w.y ) ) );
          float shade = fract( sin( dot( floor( cell ), vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
          vec3 glass = mix( vec3( 0.035, 0.05, 0.075 ), vec3( 0.14, 0.18, 0.24 ), shade );
          diffuseColor.rgb = mix( diffuseColor.rgb, glass, cityPane );
          float above = ( vCityWorld.y - uCityGrid.z ) / uCityGrid.w;
          diffuseColor.rgb *= mix( ${WALL_FOOT.toFixed(2)}, 1.0, smoothstep( 0.0, ${WALL_LIT.toFixed(1)}, above ) );
          ${night ? NIGHT_GLOW : ''}
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, 0.2, cityPane );`
      );
    if (night) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n        totalEmissiveRadiance += cityGlow;'
      );
    }
  };
  material.customProgramCacheKey = () => (night ? 'city-windows-night' : 'city-windows');
  material.needsUpdate = true;
}

/** Linear brightness of a lit window at night */
const NIGHT_LAMP = 1.0;

const NIGHT_PARS = /* glsl */ `
  uniform float uTime;
  vec3 cityGlow = vec3( 0.0 );
  float cityHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  vec3 cityHue( float h ) { return clamp( abs( mod( h * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0 ) - 1.0, 0.0, 1.0 ); }
`;

/**
 * At night (addCityWindows' `night`), windows light up: homes window by window in flats of three,
 * warm or cool, offices a floor at a time in runs, and some dark. Far off the panes fade into
 * their average glow, like the panes themselves. Named towers (the window styles 3-6 that
 * 3d/city-on-hills.py gives them) get their own: white diamonds on the Bank of China, a light show
 * on the ICC, white strips and a lit crown on the IFC, colour bands on Central Plaza.
 */
const NIGHT_GLOW = /* glsl */ `
  {
    // Walls are dark at night; the light is the windows'
    diffuseColor.rgb *= 0.45;
    vec2 pane = floor( cell );
    // Which way the wall faces, rounded: the slope's normal wobbles a little from pixel to pixel
    vec2 facingSign = floor( wallNormal.xz * 1.5 + 0.5 );
    float facing = facingSign.x * 3.0 + facingSign.y * 7.0;
    pane = mod( pane, 997.0 );
    float unit = curtain
      ? cityHash( vec2( pane.y, floor( pane.x / 7.0 ) ) + facing )
      : cityHash( vec2( floor( pane.x / 3.0 ), pane.y ) + facing );
    float litShare = curtain ? 0.45 : 0.55;
    float lit = step( unit, litShare ) * step( 0.15, cityHash( pane + facing ) );
    // Some whole towers are mostly dark, some blaze: by the wall's stretch of a hundred metres
    float block = cityHash( floor( vec2( along, 0.0 ) / 100.0 ) + facing );
    lit *= step( 0.12, block ) * mix( 0.7, 1.15, block );
    float tone = cityHash( pane + 17.0 + facing );
    vec3 warm = vec3( 1.0, 0.68, 0.38 );
    vec3 cool = vec3( 0.75, 0.86, 1.0 );
    vec3 lamp = curtain ? mix( cool, vec3( 1.0, 0.95, 0.85 ), step( 0.6, tone ) ) : mix( warm, cool, step( 0.72, tone ) );
    float strength = ( 0.45 + 0.9 * cityHash( pane + 5.0 ) ) * ${NIGHT_LAMP.toFixed(2)};
    vec3 near = lamp * lit * strength * inside.x * inside.y;
    vec3 far = ( curtain ? cool : mix( warm, cool, 0.28 ) ) * litShare * 0.5 * ${NIGHT_LAMP.toFixed(2)} * area;
    cityGlow = mix( near, far, smoothstep( 0.6, 1.3, max( w.x, w.y ) ) );

    float style = floor( vCityWindows + 0.5 );
    float metresUp = above;
    if ( style == 3.0 ) {
      // Bank of China: the trusses' diamonds outlined in white
      vec2 m = vec2( along, metresUp ) / 26.0;
      float fw = max( fwidth( m.x + m.y ), 0.002 );
      float a = 1.0 - smoothstep( 0.02, 0.02 + fw * 1.5, abs( fract( m.x + m.y ) - 0.5 ) * 0.5 );
      float b = 1.0 - smoothstep( 0.02, 0.02 + fw * 1.5, abs( fract( m.x - m.y ) - 0.5 ) * 0.5 );
      cityGlow = cityGlow * 0.3 + vec3( 1.3, 1.35, 1.5 ) * max( a, b );
    } else if ( style == 4.0 ) {
      // ICC: the facade a screen, colour sweeping up it
      float h = fract( metresUp / 260.0 - uTime * 0.04 + along / 900.0 );
      float wave = 0.55 + 0.45 * sin( metresUp / 18.0 - uTime * 1.3 );
      cityGlow = cityHue( h ) * wave * 1.1 * mix( inside.x * inside.y, area, smoothstep( 0.35, 0.8, max( w.x, w.y ) ) ) + cityGlow * 0.2;
    } else if ( style == 5.0 ) {
      // IFC: white strips up its edges every few metres, its crown lit
      float strip = 1.0 - smoothstep( 0.04, 0.04 + fwidth( along / 8.0 ) * 1.5, abs( fract( along / 8.0 ) - 0.5 ) );
      float crown = smoothstep( 362.0, 366.0, metresUp ) * ( 0.55 + 0.45 * step( 0.5, fract( metresUp / 7.0 ) ) );
      cityGlow += vec3( 0.9, 1.0, 1.2 ) * strip * 0.5 + vec3( 0.4, 0.45, 0.55 ) * crown;
    } else if ( style == 6.0 ) {
      // Central Plaza: gold windows under colour bands every few floors, changing slowly
      float band = 1.0 - smoothstep( 0.1, 0.1 + fwidth( metresUp / 14.0 ) * 1.5, abs( fract( metresUp / 14.0 ) - 0.5 ) );
      cityGlow = cityGlow * vec3( 1.2, 0.95, 0.55 ) + cityHue( fract( floor( uTime / 6.0 ) * 0.17 + metresUp / 700.0 ) ) * band * 1.8;
    }
  }
`;
