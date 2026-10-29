import * as THREE from 'three';

/**
 * The surfaces of a built monument, per vertex in _KIND (3d/mont-saint-michel-to-glb.py), drawn
 * in the shader so they cost no geometry
 */
export enum StoneKind {
  ROCK = 0,
  MASONRY = 1,
  SLATE = 2,
  GOLD = 3,
  LEAVES = 4,
  /** House walls, with a window a bay and a storey */
  HOUSE = 5,
  /** Church walls, with tall lancets */
  CHURCH = 6,
  PLAIN = 7,
}

/**
 * Granite and slate for the Mount, from world position and the face's own normal: courses of
 * dressed stone on the walls (darker joints, each block its shade), rows of slates on the roofs,
 * windows on the houses (a few lit warm, it being evening) and tall lancets on the abbey, the
 * statue gilded and shining. `unitsPerMetre` sizes it all; far off, where a course is under a
 * pixel or so, each pattern fades to its average so nothing shimmers.
 */
export function addMountStone(mesh: THREE.Mesh, unitsPerMetre: number): void {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms['uStoneScale'] = { value: unitsPerMetre };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float _kind;
        varying float vStoneKind;
        varying vec3 vStoneWorld;`
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vStoneKind = _kind;
        vStoneWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vStoneKind;
        varying vec3 vStoneWorld;
        uniform float uStoneScale;
        float stoneRough = 0.88;
        float stoneMetal = 0.0;
        vec3 stoneGlow = vec3( 0.0 );
        float stoneHash( vec2 p ) {
          return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
        }
        float stoneNoise( vec2 p ) {
          vec2 i = floor( p );
          vec2 f = fract( p );
          f = f * f * ( 3.0 - 2.0 * f );
          return mix(
            mix( stoneHash( i ), stoneHash( i + vec2( 1.0, 0.0 ) ), f.x ),
            mix( stoneHash( i + vec2( 0.0, 1.0 ) ), stoneHash( i + vec2( 1.0, 1.0 ) ), f.x ),
            f.y
          );
        }
        // Coverage of a box from lo to hi within a cell's fract, anti-aliased over a pixel
        float stoneBox( vec2 f, vec2 w, vec2 lo, vec2 hi ) {
          vec2 inside = smoothstep( lo - w, lo + w, f ) * ( 1.0 - smoothstep( hi - w, hi + w, f ) );
          return inside.x * inside.y;
        }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          int kind = int( vStoneKind + 0.5 );
          vec3 faceNormal = normalize( cross( dFdx( vStoneWorld ), dFdy( vStoneWorld ) ) );
          vec3 m = vStoneWorld / uStoneScale;   // metres
          // Along a wall: across the face, horizontally
          vec2 across = normalize( vec2( -faceNormal.z, faceNormal.x ) + vec2( 1e-5 ) );
          float along = dot( m.xz, across );
          bool wall = abs( faceNormal.y ) < 0.4;
          if ( kind == 0 ) {
            // Granite: speckled, lichen in patches, streaked where water runs
            float speck = stoneNoise( m.xz * 1.7 + m.y * 0.9 ) * 0.6 + stoneNoise( m.xz * 0.21 + m.y * 0.13 ) * 0.4;
            diffuseColor.rgb *= 0.82 + 0.36 * speck;
            stoneRough = 0.95;
          } else if ( kind == 1 || kind == 5 || kind == 6 ) {
            if ( wall ) {
              // Courses of dressed granite, each block its own length and shade
              float course = m.y / 0.62;
              float row = floor( course );
              float len = mix( 0.9, 1.6, stoneHash( vec2( row, 3.1 ) ) );
              float x = along / len + stoneHash( vec2( row, 7.7 ) );
              vec2 f = vec2( fract( x ), fract( course ) );
              vec2 w = fwidth( vec2( x, course ) );
              vec2 edge = min( f, 1.0 - f );
              float joint = max( 1.0 - smoothstep( 0.0, max( w.x, 0.04 ), edge.x ), 1.0 - smoothstep( 0.0, max( w.y, 0.06 ), edge.y ) );
              float tint = mix( 0.88, 1.08, stoneHash( vec2( row, floor( x ) ) ) );
              float near = 1.0 - smoothstep( 0.3, 0.7, max( w.x, w.y ) );
              diffuseColor.rgb *= mix( 1.0, tint * ( 1.0 - 0.35 * joint ), near );
            }
            if ( wall && kind == 5 ) {
              // A window a bay and a storey, shutters and lit rooms here and there
              vec2 cell = vec2( along / 3.1, ( m.y - 0.6 ) / 3.2 );
              vec2 f = fract( cell );
              vec2 w = fwidth( cell );
              float pane = stoneBox( f, w, vec2( 0.34, 0.32 ), vec2( 0.66, 0.78 ) );
              float pick = stoneHash( floor( cell ) + vec2( 3.0, 1.0 ) );
              float far = smoothstep( 0.3, 0.8, max( w.x, w.y ) );
              pane = mix( pane * step( 0.18, pick ), 0.12, far );
              float lit = step( 0.86, pick );
              vec3 glass = mix( vec3( 0.03, 0.035, 0.045 ), vec3( 1.0, 0.62, 0.28 ), lit );
              diffuseColor.rgb = mix( diffuseColor.rgb, glass, pane );
              stoneGlow += vec3( 1.0, 0.55, 0.22 ) * 0.9 * lit * pane * ( 1.0 - far );
              stoneRough = mix( stoneRough, 0.25, pane );
            }
            if ( wall && kind == 6 ) {
              // Tall lancets in pairs of tiers
              vec2 cell = vec2( along / 4.6, m.y / 9.0 );
              vec2 f = fract( cell );
              vec2 w = fwidth( cell );
              float lancet = stoneBox( f, w, vec2( 0.4, 0.22 ), vec2( 0.6, 0.86 ) );
              // A pointed top: narrower towards the cell's head
              float head = smoothstep( 0.72, 0.86, f.y );
              lancet *= 1.0 - smoothstep( 0.1 - head * 0.1, 0.1 - head * 0.1 + w.x, abs( f.x - 0.5 ) - 0.0 );
              float far = smoothstep( 0.3, 0.8, max( w.x, w.y ) );
              lancet = mix( lancet, 0.06, far );
              diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.03, 0.035, 0.05 ), lancet );
            }
          } else if ( kind == 2 ) {
            // Slates in rows, each a little different
            float rows = m.y / 0.32;
            float x = along / 0.45 + stoneHash( vec2( floor( rows ), 1.3 ) );
            vec2 w = fwidth( vec2( x, rows ) );
            float line = 1.0 - smoothstep( 0.0, max( w.y, 0.08 ), min( fract( rows ), 1.0 - fract( rows ) ) );
            float near = 1.0 - smoothstep( 0.3, 0.7, max( w.x, w.y ) );
            float tint = mix( 0.85, 1.1, stoneHash( floor( vec2( x, rows ) ) ) );
            diffuseColor.rgb *= mix( 1.0, tint * ( 1.0 - 0.3 * line ), near );
            stoneRough = 0.55;
          } else if ( kind == 3 ) {
            stoneRough = 0.28;
            stoneMetal = 1.0;
            stoneGlow += diffuseColor.rgb * 0.35;
          } else if ( kind == 4 ) {
            diffuseColor.rgb *= 0.8 + 0.4 * stoneNoise( m.xz * 0.7 + m.y );
            stoneRough = 1.0;
          }
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = stoneRough;'
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = stoneMetal;'
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += stoneGlow;'
      );
  };
  material.customProgramCacheKey = () => 'mount-stone';
  mesh.material = material;
}
