import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { sharedUniforms } from '../../foundation/rendering/sharedUniforms';
import { getTerrainHeight } from './mesh-utils';
import { LANDMARK_SCALE } from './landmarks';

/** Fairy-light colours, lit past white so the bloom makes them glow */
const GLOW = 3;
const BULBS = ['#ff3a3a', '#3aff6a', '#ffd23a', '#4a8aff', '#fff4e0'].map(hex =>
  new THREE.Color(hex).multiplyScalar(GLOW)
);

/**
 * Fairy lights at `spots`, `size` world units across, each twinkling on its own beat on the
 * shared clock. One draw call for all of them, and no work on the CPU per frame.
 */
export function twinkleLights(spots: THREE.Vector3[], size: number): THREE.Points {
  const geometry = new THREE.BufferGeometry().setFromPoints(spots);
  const colours = new Float32Array(spots.length * 3);
  const phases = new Float32Array(spots.length);
  spots.forEach((_, i) => {
    BULBS[i % BULBS.length]!.toArray(colours, i * 3);
    phases[i] = Math.random() * Math.PI * 2;
  });
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geometry.setAttribute('lzPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms['uTime'] = sharedUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;\nattribute float lzPhase;\nvarying float vLzTwinkle;'
      )
      // Never smaller than a couple of pixels, so a town's lights still glow from the ridge
      .replace(
        '#include <fog_vertex>',
        'gl_PointSize = max( gl_PointSize, 2.0 );\n#include <fog_vertex>'
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLzTwinkle = 0.3 + 0.7 * smoothstep( -0.2, 0.6, sin( uTime * ( 1.5 + fract( lzPhase ) * 2.0 ) + lzPhase * 5.0 ) );`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLzTwinkle;')
      .replace(
        '#include <alphatest_fragment>',
        `diffuseColor.rgb *= vLzTwinkle;
        diffuseColor.a *= smoothstep( 0.5, 0.2, length( gl_PointCoord - 0.5 ) );
        #include <alphatest_fragment>`
      );
  };
  material.customProgramCacheKey = () => 'lz-twinkle-lights';
  const points = new THREE.Points(geometry, material);
  points.name = 'fairy-lights';
  return points;
}

/** Lights strung round the eaves of `share` of the houses, about every `spacing` units */
export function roofLights(houses: THREE.Object3D[], share = 0.5, spacing = 2): THREE.Vector3[] {
  const spots: THREE.Vector3[] = [];
  const bounds = new THREE.Box3();
  houses.forEach((house, i) => {
    // Every other house, roughly, so the streets don't look like one string
    if ((i * 0.618) % 1 > share) return;
    bounds.setFromObject(house);
    if (bounds.isEmpty()) return;
    const { min, max } = bounds;
    const y = min.y + (max.y - min.y) * 0.7;
    const corners = [
      new THREE.Vector3(min.x, y, min.z),
      new THREE.Vector3(max.x, y, min.z),
      new THREE.Vector3(max.x, y, max.z),
      new THREE.Vector3(min.x, y, max.z),
    ];
    corners.forEach((corner, c) => {
      const next = corners[(c + 1) % 4]!;
      const steps = Math.max(1, Math.round(corner.distanceTo(next) / spacing));
      for (let s = 0; s < steps; s++) spots.push(corner.clone().lerp(next, s / steps));
    });
  });
  return spots;
}

/** Lights wound `turns` times up a cone (or a cylinder) from `base`, `count` of them */
export function spiralLights(
  base: THREE.Vector3,
  height: number,
  radius: [bottom: number, top: number],
  turns: number,
  count: number
): THREE.Vector3[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const angle = t * turns * Math.PI * 2;
    const r = THREE.MathUtils.lerp(radius[0], radius[1], t);
    return new THREE.Vector3(
      base.x + Math.cos(angle) * r,
      base.y + t * height,
      base.z + Math.sin(angle) * r
    );
  });
}

/** A tree's height and its tiers' radius at the bottom, in metres before TREE_SCALE */
const TREE_HEIGHT = 14;
const TREE_RADIUS = 4.5;
/** Twice the landmarks' scale, so a town's tree stands well over its houses (5-17 units tall) */
const TREE_SCALE = LANDMARK_SCALE * 2;

/** The tiers: where each starts, how tall and how wide at the bottom */
const TIERS = [0, 1, 2].map(i => ({
  base: 2 + i * 3.6,
  height: 5.5 - i * 0.6,
  radius: TREE_RADIUS * (1 - i * 0.28),
}));

/** How far the outermost tier reaches at height `y` */
const tierRadiusAt = (y: number): number =>
  Math.max(
    0,
    ...TIERS.map(({ base, height, radius }) =>
      y >= base && y <= base + height ? radius * (1 - (y - base) / height) : 0
    )
  );

/** A low-poly fir: a brown trunk under three green tiers, red and gold baubles, coloured per vertex */
function treeGeometry(): THREE.BufferGeometry {
  const coloured = (geometry: THREE.BufferGeometry, hex: string) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const c = new THREE.Color(hex);
    const count = g.getAttribute('position').count;
    g.setAttribute(
      'color',
      new THREE.BufferAttribute(
        new Float32Array(Array.from({ length: count }, () => c.toArray()).flat()),
        3
      )
    );
    g.deleteAttribute('uv');
    return g;
  };
  const parts = [
    coloured(new THREE.CylinderGeometry(0.6, 0.8, 2.5, 6).translate(0, 1.25, 0), '#6a4224'),
    ...TIERS.map(({ base, height, radius }, i) =>
      coloured(
        new THREE.ConeGeometry(radius, height, 7).translate(0, base + height / 2, 0),
        i % 2 ? '#1f6e34' : '#18602c'
      )
    ),
    // Baubles hung on the tiers' surface, round the tree and up it
    ...[
      [0.3, 3.5, '#e02a2a'],
      [2.4, 4.6, '#f2c230'],
      [4.4, 3.2, '#f2c230'],
      [1.2, 6.8, '#e02a2a'],
      [3.6, 7.6, '#e02a2a'],
      [5.4, 6.4, '#f2c230'],
      [2.2, 10.4, '#f2c230'],
      [4.8, 11, '#e02a2a'],
    ].map(([angle, y, hex]) => {
      const r = tierRadiusAt(y as number);
      return coloured(
        new THREE.IcosahedronGeometry(0.55, 0).translate(
          Math.cos(angle as number) * r,
          y as number,
          Math.sin(angle as number) * r
        ),
        hex as string
      );
    }),
  ];
  return mergeGeometries(parts)!;
}

/**
 * A Christmas tree in the middle of each town, four times life size, with a gold
 * star on top lit past white so it glows, and fairy lights wound up it. Two instanced meshes and
 * the lights' points.
 */
export function townTrees(centres: THREE.Vector3[], terrain: THREE.Mesh): THREE.Group {
  const group = new THREE.Group();
  group.name = 'christmas-trees';
  const spots = centres
    .map(({ x, z }) => new THREE.Vector3(x, getTerrainHeight(x, z, terrain), z))
    .filter(spot => !isNaN(spot.y));
  const trees = new THREE.InstancedMesh(
    treeGeometry(),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true }),
    spots.length
  );
  const stars = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1.1, 0).scale(1, 1, 0.4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd23a').multiplyScalar(4) }),
    spots.length
  );
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3().setScalar(TREE_SCALE);
  const turn = new THREE.Quaternion();
  const garlands: THREE.Vector3[] = [];
  spots.forEach((spot, i) => {
    turn.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.3);
    trees.setMatrixAt(i, matrix.compose(spot, turn, scale));
    const top = spot.clone().setY(spot.y + (TREE_HEIGHT - 0.6) * TREE_SCALE);
    stars.setMatrixAt(i, matrix.compose(top, turn, scale));
    garlands.push(
      ...spiralLights(
        spot.clone().setY(spot.y + 2.5 * TREE_SCALE),
        10 * TREE_SCALE,
        [TREE_RADIUS * 1.02 * TREE_SCALE, 0.8 * TREE_SCALE],
        4,
        70
      )
    );
  });
  [trees, stars].forEach(mesh => {
    mesh.castShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  });
  stars.castShadow = false;
  group.add(twinkleLights(garlands, 2.4));
  return group;
}

/** Frees every geometry and material under `group` */
export function disposeChristmas(group: THREE.Object3D): void {
  group.traverse(child => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
  group.removeFromParent();
}
