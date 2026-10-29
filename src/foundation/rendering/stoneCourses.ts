import * as THREE from 'three';

/**
 * Draws the blocks of dressed stone in the shader, so they cost no geometry: 3d/giza-to-glb.py
 * gives every vertex _STONE, metres along the face, the course (a joint where its whole number
 * changes) and how strongly the joints show (the pyramids' core steps fully, the smooth casing
 * faintly, carved rock and roofs not at all). Each course's blocks are their own length, their
 * joints offset from the course below, each block a slightly different shade and darker at its
 * worn edges; across a face, the stone varies in broad patches. Far off, where a block is under a
 * pixel or so, the pattern fades to its average so it doesn't shimmer.
 */
export function addStoneCourses(mesh: THREE.Mesh): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 _stone;
        varying vec3 vStone;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vStone = _stone;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vStone;
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
        }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if ( vStone.z > 0.0 ) {
          float course = floor( vStone.y );
          // Blocks 1.2 to 2.2 m long, each course's joints shifted along
          float blockLength = mix( 1.2, 2.2, stoneHash( vec2( course, 3.1 ) ) );
          float x = vStone.x / blockLength + stoneHash( vec2( course, 7.7 ) );
          float block = floor( x );
          vec2 f = vec2( fract( x ), fract( vStone.y ) );
          vec2 w = fwidth( vec2( x, vStone.y ) );
          vec2 edge = min( f, 1.0 - f );
          float joint = max(
            1.0 - smoothstep( 0.0, max( w.x, 0.025 ), edge.x ),
            1.0 - smoothstep( 0.0, max( w.y, 0.04 ), edge.y )
          );
          // Worn edges: each block darker towards its sides
          float worn = smoothstep( 0.0, 0.18, edge.x );
          float tint = mix( 0.86, 1.1, stoneHash( vec2( course, block ) ) );
          float patch = mix( 0.9, 1.06, stoneNoise( vec2( vStone.x / 14.0, course / 9.0 ) ) );
          float near = 1.0 - smoothstep( 0.25, 0.6, max( w.x, w.y ) );
          float detail = tint * mix( 0.9, 1.0, worn ) * ( 1.0 - 0.6 * joint );
          diffuseColor.rgb *= mix( 1.0, mix( 1.0, detail, near ) * patch, vStone.z );
        }`
      );
  };
  material.customProgramCacheKey = () => 'stone-courses';
  material.needsUpdate = true;
}
