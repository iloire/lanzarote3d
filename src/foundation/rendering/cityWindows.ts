import * as THREE from 'three';

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

/**
 * Draws windows on a city's walls in the shader, so they cost no geometry: one pane per voxel
 * across and per storey up, lined up with the voxels. Walls marked punched (1) get a window in
 * the middle of each cell, glass curtain walls (2) a pane filling it between thin mullions;
 * roofs (0) none. Each pane is a slightly different dark glass, and shinier than the wall, so it
 * catches the sun. Far off, where a cell is under a pixel or so, the grid fades into its average
 * so it doesn't shimmer.
 */
export function addCityWindows(mesh: THREE.Mesh, grid: CityGrid): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.onBeforeCompile = shader => {
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
        float cityPane = 0.0;`
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
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, 0.2, cityPane );`
      );
  };
  material.customProgramCacheKey = () => 'city-windows';
  material.needsUpdate = true;
}
