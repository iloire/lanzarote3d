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
 * The styles a city on the water asks for (3d/city-to-glb.py): arched windows with green
 * shutters on mottled plaster (7), tiled roofs (8) and the Doge's Palace (9), its two storeys of
 * white arcades under pink and white lozenges. They come after the styles
 * other cities use (0-2, and Hong Kong's named towers 3-6).
 */
const VENETIAN_GLSL = /* glsl */ `
  float venetianHash( vec2 p ) {
    return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
  }
  float cityNoise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( venetianHash( i ), venetianHash( i + vec2( 1.0, 0.0 ) ), f.x ),
      mix( venetianHash( i + vec2( 0.0, 1.0 ) ), venetianHash( i + vec2( 1.0, 1.0 ) ), f.x ),
      f.y
    );
  }
  // Metres along the wall and up from the ground
  vec2 cityWall() {
    vec3 wallNormal = normalize( cross( dFdx( vCityWorld ), dFdy( vCityWorld ) ) );
    vec2 metres = vec2( vCityWorld.x, -vCityWorld.z ) / uCityGrid.y;
    float acrossTown = dot( metres, uCityStreet ) - uCityOrigin.x;
    float upAvenue = dot( metres, uCityAvenue ) - uCityOrigin.y;
    bool facesAvenue = abs( dot( vec2( wallNormal.x, -wallNormal.z ), uCityAvenue ) ) > 0.5;
    return vec2( facesAvenue ? acrossTown : upAvenue, ( vCityWorld.y - uCityGrid.z ) / uCityGrid.w );
  }
  // Signed distance to an arched opening centred in its bay: half its width, sill and springing
  float cityArch( vec2 p, float halfWidth, float sill, float spring ) {
    vec2 q = vec2( abs( p.x ) - halfWidth, max( sill - p.y, p.y - spring ) );
    float box = length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 );
    return min( box, length( p - vec2( 0.0, spring ) ) - halfWidth );
  }
  // Inside a shape given its signed distance, over about a pixel
  float cityFill( float d ) {
    float w = fwidth( d );
    return 1.0 - smoothstep( -w, w, d );
  }
`;

const VENETIAN_FRAGMENT = /* glsl */ `
  else if ( vCityWindows > 6.5 && vCityWindows < 7.5 ) {
    // Plaster faded unevenly, arched windows a voxel apart and a storey up, some shuttered
    vec2 wall = cityWall();
    diffuseColor.rgb *= 0.86 + 0.22 * cityNoise( wall * vec2( 0.35, 0.5 ) ) + 0.08 * cityNoise( wall * 2.1 );
    vec2 cell = vec2( wall.x / uCityGrid.x, wall.y / ${FLOOR.toFixed(1)} );
    vec2 p = vec2( ( fract( cell.x ) - 0.5 ) * uCityGrid.x, fract( cell.y ) * ${FLOOR.toFixed(1)} );
    float seed = venetianHash( floor( cell ) );
    float upper = step( 1.0, cell.y );
    float pane = cityFill( cityArch( p, 0.42, 0.95, 2.2 ) );
    float sill = cityFill( max( abs( p.x ) - 0.55, abs( p.y - 0.88 ) - 0.07 ) );
    float shutter = upper * step( seed, 0.55 ) *
      cityFill( max( abs( abs( p.x ) - 0.65 ) - 0.2, abs( p.y - 1.75 ) - 0.85 ) );
    vec2 w = fwidth( cell );
    float near = 1.0 - smoothstep( 0.35, 0.8, max( w.x, w.y ) );
    vec3 glass = mix( vec3( 0.03, 0.035, 0.04 ), vec3( 0.11, 0.12, 0.13 ), seed );
    vec3 green = mix( vec3( 0.07, 0.17, 0.09 ), vec3( 0.16, 0.24, 0.14 ), venetianHash( floor( cell ) + 7.0 ) );
    vec3 detailed = mix( diffuseColor.rgb, vec3( 0.86, 0.84, 0.78 ), sill * 0.8 );
    detailed = mix( detailed, glass, pane );
    detailed = mix( detailed, green, shutter );
    cityPane = pane * near;
    diffuseColor.rgb = mix( mix( diffuseColor.rgb, glass, 0.16 ), detailed, near );
    diffuseColor.rgb *= mix( ${WALL_FOOT.toFixed(2)}, 1.0, smoothstep( 0.0, ${WALL_LIT.toFixed(1)}, wall.y ) );
  } else if ( vCityWindows > 7.5 && vCityWindows < 8.5 ) {
    // Terracotta tiles: courses down the slope, channels across it, weathered in patches
    vec3 roofNormal = normalize( cross( dFdx( vCityWorld ), dFdy( vCityWorld ) ) );
    vec2 m = vCityWorld.xz / uCityGrid.y;
    vec2 down = normalize( roofNormal.xz + vec2( 1e-4 ) );
    vec2 t = vec2( dot( m, vec2( -down.y, down.x ) ) / 0.3, dot( m, down ) / 0.42 );
    vec2 w = fwidth( t );
    float near = 1.0 - smoothstep( 0.3, 0.7, max( w.x, w.y ) );
    float channel = 0.82 + 0.18 * sin( fract( t.x ) * 3.14159 );
    float course = 0.8 + 0.2 * smoothstep( 0.0, 0.18, fract( t.y ) );
    float patches = cityNoise( m * 0.45 );
    vec3 tile = diffuseColor.rgb * ( 0.8 + 0.4 * cityNoise( m * 1.7 ) );
    tile = mix( tile, tile * vec3( 0.78, 0.8, 0.78 ), smoothstep( 0.55, 0.85, patches ) );
    diffuseColor.rgb = mix( tile * 0.9, tile * channel * course, near );
  } else if ( vCityWindows > 8.5 ) {
    // The Doge's Palace: a white arcade, a white loggia of narrower arches with roundels, and
    // above, pink and white lozenges pierced by a few tall pointed windows
    vec2 wall = cityWall();
    vec3 stone = vec3( 0.74, 0.69, 0.6 );
    vec3 shadow = vec3( 0.06, 0.05, 0.05 );
    vec2 arcade = vec2( ( fract( wall.x / 4.1 ) - 0.5 ) * 4.1, wall.y );
    float open = cityFill( cityArch( arcade, 1.45, -1.0, 5.0 ) ) * step( wall.y, 7.0 );
    float loggiaBand = step( 7.6, wall.y ) * step( wall.y, 13.0 );
    vec2 loggia = vec2( ( fract( wall.x / 2.05 ) - 0.5 ) * 2.05, wall.y );
    open = max( open, cityFill( cityArch( loggia, 0.62, 8.2, 11.3 ) ) * loggiaBand );
    vec2 roundel = vec2( abs( fract( wall.x / 2.05 + 0.5 ) - 0.5 ) * 2.05, wall.y - 12.3 );
    open = max( open, cityFill( length( roundel ) - 0.38 ) * loggiaBand );
    vec2 l = wall / 1.1;
    float lozenge = mod( floor( l.x + l.y ) + floor( l.x - l.y ), 2.0 );
    vec3 pink = mix( vec3( 0.66, 0.3, 0.27 ), vec3( 0.82, 0.7, 0.6 ), lozenge );
    vec2 tall = vec2( ( fract( wall.x / 9.4 ) - 0.5 ) * 9.4, wall.y );
    float window = cityFill( cityArch( tall, 1.05, 14.6, 18.6 ) );
    float frame = cityFill( cityArch( tall, 1.35, 14.3, 18.6 ) );
    vec3 upper = mix( mix( pink, stone, frame ), shadow * 2.0, window );
    vec3 colour = wall.y < 13.4 || wall.y > 24.0 ? stone : upper;
    colour = mix( colour, shadow, open );
    vec2 w = fwidth( wall );
    float near = 1.0 - smoothstep( 0.4, 1.2, max( w.x, w.y ) );
    vec3 far = wall.y < 13.4 ? mix( stone, shadow, 0.45 ) : vec3( 0.72, 0.47, 0.42 );
    diffuseColor.rgb = mix( far, colour, near );
    cityPane = window * near;
  }
`;

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
        ${VENETIAN_GLSL}
        ${night ? NIGHT_PARS : ''}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if ( vCityWindows > 0.5 && vCityWindows < 6.5 ) {
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
        }
        ${VENETIAN_FRAGMENT}`
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
