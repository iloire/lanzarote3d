import * as THREE from 'three';
import { sharedUniforms } from '../../foundation/rendering/sharedUniforms';

/**
 * Neon signs as 3d/city-on-hills.py writes them, eight numbers a sign: world x, y, z of its
 * centre, its heading (radians, the way its face points, from +x towards +z), width and height
 * (world units), a colour index and 1 if it sticks out over the street
 */
export type SignSpots = number[];

/** Pink, cyan, red, amber, green and violet neon (linear, bright enough to bloom) */
const NEON = ['#ff2d8a', '#19e6ff', '#ff2a1a', '#ffb21a', '#39ff6a', '#b24dff'];
const GLOW = 4.5;

const SIGN_PARS = /* glsl */ `
  uniform float uTime;
  varying vec2 vSignUv;
  varying vec2 vSignSize;
  varying float vSignSeed;
  float signHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
`;

/**
 * A sign's face: a neon tube round its edge, and glyphs down it (or along it, if it's wide) on a
 * dark board, each glyph a few strokes on a three-by-three grid. A few blink.
 */
const SIGN_COLOUR = /* glsl */ `
  vec2 metres = vSignUv * vSignSize;
  float edge = min( min( metres.x, vSignSize.x - metres.x ), min( metres.y, vSignSize.y - metres.y ) );
  float aa = fwidth( edge ) + 0.001;
  float tube = 1.0 - smoothstep( 0.12, 0.12 + aa * 1.5, abs( edge - 0.22 ) );
  bool tall = vSignSize.y > vSignSize.x;
  float glyphSize = ( tall ? vSignSize.x : vSignSize.y ) * 0.62;
  vec2 inner = metres - ( tall ? vec2( ( vSignSize.x - glyphSize ) * 0.5, 0.0 ) : vec2( 0.0, ( vSignSize.y - glyphSize ) * 0.5 ) );
  vec2 g = inner / glyphSize;
  vec2 slot = floor( g );
  vec2 inGlyph = fract( g ) * 1.25 - 0.125;
  bool onBoard = ( tall ? ( g.x >= 0.0 && g.x < 1.0 && metres.y > 0.45 && metres.y < vSignSize.y - 0.45 )
                        : ( g.y >= 0.0 && g.y < 1.0 && metres.x > 0.45 && metres.x < vSignSize.x - 0.45 ) );
  vec2 stroke = floor( clamp( inGlyph, 0.0, 0.999 ) * 3.0 );
  float on = step( 0.45, signHash( slot * 3.1 + stroke + vSignSeed * 13.0 ) );
  vec2 inStroke = fract( clamp( inGlyph, 0.0, 0.999 ) * 3.0 );
  float strokeShape = step( 0.18, inStroke.x ) * step( inStroke.x, 0.82 ) + step( 0.18, inStroke.y ) * step( inStroke.y, 0.82 );
  float glyph = onBoard && inGlyph.x > 0.0 && inGlyph.x < 1.0 && inGlyph.y > 0.0 && inGlyph.y < 1.0 ? on * min( strokeShape, 1.0 ) : 0.0;
  float blink = signHash( vec2( vSignSeed, 4.2 ) ) < 0.08 ? step( 0.5, fract( uTime * 0.7 + vSignSeed ) ) : 1.0;
  float light = max( tube, glyph * 0.9 ) * blink;
  diffuseColor.rgb = diffuseColor.rgb * mix( 0.05, ${GLOW.toFixed(1)}, light );
`;

/**
 * The neon signs on a city's walls, one instanced mesh of planes: their faces drawn in the
 * shader (tube, board and glyphs) in metres, coloured per instance and bright enough to bloom.
 */
export function neonSigns(spots: SignSpots, unitsPerMetre: number): THREE.InstancedMesh {
  const count = Math.floor(spots.length / 8);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vSignUv;
        varying vec2 vSignSize;
        varying float vSignSeed;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vSignUv = uv;
        vSignSize = vec2( length( instanceMatrix[0].xyz ), length( instanceMatrix[1].xyz ) ) / ${unitsPerMetre.toFixed(3)};
        vSignSeed = float( gl_InstanceID ) * 0.618;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${SIGN_PARS}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${SIGN_COLOUR}`);
  };
  material.customProgramCacheKey = () => 'neon-signs';
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, count);
  mesh.name = 'neon-signs';
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const turn = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, y, z, heading, width, height, tint] = spots.slice(i * 8, i * 8 + 7) as number[];
    position.set(x!, y!, z!);
    // A plane faces +z; turn it to face along the heading
    turn.setFromAxisAngle(up, Math.PI / 2 - heading!);
    scale.set(width!, height!, 1);
    mesh.setMatrixAt(i, matrix.compose(position, turn, scale));
    mesh.setColorAt(i, colour.set(NEON[tint! % NEON.length]!));
  }
  // They spread over the whole city, so the mesh is never culled as a whole
  mesh.frustumCulled = false;
  return mesh;
}
