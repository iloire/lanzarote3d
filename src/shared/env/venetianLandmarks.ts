import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeoAnchor, geoToWorld } from '../geo';

/**
 * Venice's landmarks, hand-built where the voxel city can't carry them: the Campanile di San
 * Marco with its green spire and gold angel, the Basilica's five domes, Santa Maria della
 * Salute, San Giorgio Maggiore's dome and campanile, the Rialto and Accademia bridges and the
 * Piazzetta's two columns. Each is built a metre to the unit, standing on the quays (y = 0, the
 * water 1.2 m below), its front along +z; `heading` turns the front to that compass bearing.
 */
export type VenetianKind =
  | 'campanile'
  | 'basilica-dome'
  | 'salute'
  | 'san-giorgio-dome'
  | 'san-giorgio-campanile'
  | 'rialto'
  | 'accademia'
  | 'piazzetta-columns';

export interface VenetianLandmark {
  name: string;
  kind: VenetianKind;
  at: [number, number];
  /** Compass bearing of its front */
  heading?: number;
  /** Times its usual size (the Basilica's domes differ) */
  size?: number;
}

// Istrian stone, its shade, brick, lead, copper gone green, gold and the dark of an opening (sRGB)
const STONE = '#e9e3d6';
const STONE_SHADE = '#cfc7b6';
const BRICK = '#a9563f';
const BRICK_DARK = '#8b4535';
const LEAD = '#9b9c98';
const LEAD_LIGHT = '#c8c6c0';
const PATINA = '#4a8a70';
const GOLD = '#e0b04a';
const DARK = '#2b2622';
const TERRACOTTA = '#ad4d2e';
const WOOD = '#6e4b30';
const WOOD_DARK = '#4a3222';
const STEEL = '#3b4045';
const GRANITE = '#8f8b86';
const BRONZE = '#4f5a4c';
/** The quays stand this high over the water, metres */
const QUAY = 1.2;

/** Collects coloured parts, a metre to the unit, and merges them into one mesh per finish */
class Parts {
  private readonly matte: THREE.BufferGeometry[] = [];
  private readonly gold: THREE.BufferGeometry[] = [];

  add(geometry: THREE.BufferGeometry, colour: string): this {
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    part.deleteAttribute('uv');
    part.deleteAttribute('normal');
    const c = new THREE.Color(colour);
    const count = part.attributes['position']!.count;
    part.setAttribute(
      'color',
      new THREE.BufferAttribute(
        new Float32Array(Array.from({ length: count }, () => [c.r, c.g, c.b]).flat()),
        3
      )
    );
    (colour === GOLD ? this.gold : this.matte).push(part);
    return this;
  }

  box(w: number, h: number, d: number, x: number, y: number, z: number, colour: string, turn = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d).rotateY(turn).translate(x, y, z), colour);
  }

  /** A cylinder standing on y, `sides` round, a flat face to +z */
  cylinder(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    colour: string,
    sides = 16,
    top = r
  ) {
    return this.add(
      new THREE.CylinderGeometry(top, r, h, sides)
        .rotateY(Math.PI / sides)
        .translate(x, y + h / 2, z),
      colour
    );
  }

  /** A square pyramid standing on y, its faces to the sides */
  pyramid(half: number, h: number, x: number, y: number, z: number, colour: string) {
    return this.add(
      new THREE.CylinderGeometry(0, half * Math.SQRT2, h, 4)
        .rotateY(Math.PI / 4)
        .translate(x, y + h / 2, z),
      colour
    );
  }

  /** A dome turned from [radius, height] points, standing on y */
  dome(profile: [number, number][], x: number, y: number, z: number, colour: string, sides = 20) {
    return this.add(
      new THREE.LatheGeometry(
        profile.map(([r, h]) => new THREE.Vector2(r, h)),
        sides
      ).translate(x, y, z),
      colour
    );
  }

  /** A side profile in (z, y), extruded `width` across x, centred on x */
  profile(points: [number, number][], width: number, x: number, colour: string) {
    const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
    return this.add(
      new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 1 })
        .rotateY(-Math.PI / 2)
        .translate(x + width / 2, 0, 0),
      colour
    );
  }

  /** A front profile in (x, y), extruded `depth` along z from `z` */
  front(points: [number, number][], depth: number, z: number, colour: string) {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return this.add(
      new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 }).translate(
        0,
        0,
        z
      ),
      colour
    );
  }

  build(name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    const finishes: [THREE.BufferGeometry[], THREE.MeshStandardMaterialParameters][] = [
      [this.matte, { roughness: 0.85 }],
      [this.gold, { roughness: 0.3, metalness: 0.9, emissive: '#5a3b08', emissiveIntensity: 0.6 }],
    ];
    for (const [parts, finish] of finishes) {
      if (!parts.length) continue;
      const merged = mergeGeometries(parts)!;
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(
        merged,
        new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, ...finish })
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }
}

/** Points along a curve from z0 to z1 */
const along = (
  z0: number,
  z1: number,
  steps: number,
  y: (z: number) => number
): [number, number][] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const z = z0 + ((z1 - z0) * i) / steps;
    return [z, y(z)];
  });

/** Something standing on each side of a square, `inset` from its centre: x, z and its turn */
const aroundSquare = (inset: number, offsets: number[]) =>
  [0, 1, 2, 3].flatMap(side =>
    offsets.map(t => {
      const a = (side * Math.PI) / 2;
      return {
        x: Math.sin(a) * inset + Math.cos(a) * t,
        z: Math.cos(a) * inset - Math.sin(a) * t,
        turn: a,
      };
    })
  );

/** St Mark's bell tower, 98.6 m: brick shaft with pilasters, white belfry, attic, green spire, gold angel */
function campanile(parts: Parts): void {
  parts.box(13, 1.2, 13, 0, 0.6, 0, STONE);
  parts.box(11.4, 48.8, 11.4, 0, 25.6, 0, BRICK_DARK);
  aroundSquare(5.75, [-5.1, -2.55, 0, 2.55, 5.1]).forEach(({ x, z, turn }) =>
    parts.box(1.0, 48.8, 0.6, x, 25.6, z, BRICK, turn)
  );
  parts.box(12.6, 0.8, 12.6, 0, 50.4, 0, STONE);
  parts.box(9.2, 8, 9.2, 0, 54.8, 0, DARK);
  parts.box(2.2, 3.4, 2.2, 0, 53.6, 0, '#8a6a32');
  for (const x of [-5.4, 5.4]) {
    for (const z of [-5.4, 5.4]) parts.box(1.8, 8, 1.8, x, 54.8, z, STONE);
  }
  aroundSquare(5.9, [-2.7, 0, 2.7]).forEach(({ x, z, turn }) =>
    parts.box(0.6, 8, 0.6, x, 54.8, z, STONE, turn)
  );
  parts.box(12.8, 1.6, 12.8, 0, 59.6, 0, STONE);
  parts.box(11.2, 8.4, 11.2, 0, 64.6, 0, '#dccdb2');
  aroundSquare(5.65, [0]).forEach(({ x, z, turn }) =>
    parts.box(6, 5, 0.3, x, 64.6, z, '#c3b294', turn)
  );
  parts.box(11.8, 0.8, 11.8, 0, 69.2, 0, STONE);
  parts.pyramid(5.4, 24.4, 0, 69.6, 0, PATINA);
  parts.box(1.2, 1.4, 1.2, 0, 94.4, 0, GOLD);
  // The angel Gabriel, turning with the wind
  parts.box(0.7, 2.0, 0.5, 0, 96.1, 0, GOLD);
  parts.box(2.6, 1.0, 0.15, 0, 96.5, -0.25, GOLD);
  parts.box(0.45, 0.45, 0.45, 0, 97.4, 0, GOLD);
  parts.box(0.12, 1.3, 0.12, 0.3, 97.9, 0.2, GOLD);
}

/** One of the Basilica's onion domes of lead on its drum, with a lantern and a gold cross */
function basilicaDome(parts: Parts, x: number, z: number, size: number): void {
  const base = 28;
  parts.cylinder(6.6 * size, 3.4, x, base, z, LEAD_LIGHT, 16);
  parts.dome(
    [
      [0, 0],
      [7.2, 0],
      [7.7, 2.6],
      [7.3, 5.6],
      [5.9, 8.6],
      [3.6, 10.7],
      [1.3, 11.7],
      [0, 11.9],
    ].map(([r, h]) => [r! * size, h! * size]),
    x,
    base + 3.4,
    z,
    LEAD
  );
  const top = base + 3.4 + 11.9 * size;
  parts.cylinder(1.1, 2.2, x, top - 0.3, z, LEAD_LIGHT, 8);
  parts.dome(
    [
      [0, 0],
      [1.4, 0],
      [1.2, 1.2],
      [0.4, 2.0],
      [0, 2.2],
    ],
    x,
    top + 1.9,
    z,
    GOLD,
    8
  );
  parts.box(0.25, 2.2, 0.25, x, top + 5.1, z, GOLD);
  parts.box(1.2, 0.25, 0.25, x, top + 5.6, z, GOLD);
}

/** Longhena's Salute: the white octagon ringed with scrolls, its great dome, the presbytery's dome and two campanili */
function salute(parts: Parts): void {
  const z = 0;
  parts.box(26, 1.2, 10, 0, -0.6, z + 26, STONE);
  parts.cylinder(21, 22, 0, 0, z, STONE, 8);
  parts.cylinder(22, 1.4, 0, 22, z, STONE_SHADE, 8);
  // The facade: a triumphal arch towards the Grand Canal
  parts.box(17, 26, 4, 0, 13, z + 21, STONE);
  parts.box(6, 12, 0.4, 0, 6, z + 23.1, DARK);
  parts.add(
    new THREE.CylinderGeometry(3, 3, 0.4, 12).rotateX(Math.PI / 2).translate(0, 12, z + 23.1),
    DARK
  );
  parts.front(
    [
      [-9.5, 26],
      [9.5, 26],
      [0, 30.5],
    ],
    4,
    z + 19,
    STONE
  );
  // The scrolls: sixteen buttresses curling against the drum
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const [sx, sz] = [Math.sin(a), Math.cos(a)];
    parts.box(1.6, 6, 5, sx * 17.5, 26.2, z + sz * 17.5, STONE_SHADE, a);
    parts.add(
      new THREE.CylinderGeometry(2.2, 2.2, 1.7, 10)
        .rotateZ(Math.PI / 2)
        .rotateY(a + Math.PI / 2)
        .translate(sx * 19.8, 24.6, z + sz * 19.8),
      STONE
    );
  }
  parts.cylinder(14, 6.6, 0, 23.4, z, STONE, 16);
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2;
    parts.box(1.6, 3.4, 0.5, Math.sin(a) * 14, 26.6, z + Math.cos(a) * 14, DARK, a);
  }
  parts.dome(
    [
      [0, 0],
      [14.4, 0],
      [14.2, 2.8],
      [13.3, 6],
      [11.5, 9],
      [8.8, 11.6],
      [5.4, 13.6],
      [2.7, 14.6],
      [0, 14.9],
    ],
    0,
    30,
    z,
    LEAD_LIGHT,
    24
  );
  parts.cylinder(3, 4.8, 0, 44.4, z, STONE, 8);
  parts.dome(
    [
      [0, 0],
      [3.3, 0],
      [2.9, 1.6],
      [1.4, 2.8],
      [0, 3.1],
    ],
    0,
    49.2,
    z,
    LEAD_LIGHT,
    12
  );
  parts.cylinder(0.6, 1.2, 0, 52.2, z, STONE, 8);
  parts.box(0.9, 3.2, 0.9, 0, 55, z, STONE);
  // The presbytery behind, its smaller dome and the two bell towers
  const back = z - 31;
  parts.box(22, 18, 18, 0, 9, back, STONE);
  parts.cylinder(8.6, 5, 0, 18, back, STONE, 16);
  parts.dome(
    [
      [0, 0],
      [9, 0],
      [8.6, 3],
      [6.6, 6.5],
      [3.4, 8.8],
      [0, 9.4],
    ],
    0,
    23,
    back,
    LEAD_LIGHT,
    16
  );
  parts.cylinder(1.6, 3, 0, 32.2, back, STONE, 8);
  for (const side of [-1, 1]) {
    parts.box(3.8, 30, 3.8, side * 12.5, 15, back - 6, STONE);
    parts.box(3.2, 3.6, 3.2, side * 12.5, 31.8, back - 6, DARK);
    parts.box(4.2, 0.6, 4.2, side * 12.5, 33.9, back - 6, STONE);
    parts.dome(
      [
        [0, 0],
        [2.3, 0],
        [1.9, 1.8],
        [0.8, 3],
        [0, 3.3],
      ],
      side * 12.5,
      34.2,
      back - 6,
      LEAD_LIGHT,
      8
    );
  }
}

/** San Giorgio's dome over its voxel church (26 m) */
function sanGiorgioDome(parts: Parts): void {
  parts.cylinder(8.4, 6, 0, 24, 0, STONE, 16);
  parts.dome(
    [
      [0, 0],
      [8.8, 0],
      [8.5, 3],
      [7, 6.4],
      [4.4, 8.6],
      [0, 9.5],
    ],
    0,
    30,
    0,
    LEAD_LIGHT,
    20
  );
  parts.cylinder(1.9, 3.4, 0, 39.2, 0, STONE, 8);
  parts.box(0.6, 2.4, 0.6, 0, 43.6, 0, STONE);
}

/** San Giorgio's campanile, 71 m: brick shaft, white belfry, a green spire and an angel */
function sanGiorgioCampanile(parts: Parts): void {
  parts.box(7.4, 1.2, 7.4, 0, 0.6, 0, STONE);
  parts.box(6.4, 40, 6.4, 0, 21.2, 0, BRICK_DARK);
  aroundSquare(3.3, [-2.6, 0, 2.6]).forEach(({ x, z, turn }) =>
    parts.box(0.8, 40, 0.4, x, 21.2, z, BRICK, turn)
  );
  parts.box(7.2, 0.8, 7.2, 0, 41.6, 0, STONE);
  parts.box(5.2, 7, 5.2, 0, 45.5, 0, DARK);
  for (const x of [-3.1, 3.1]) {
    for (const z of [-3.1, 3.1]) parts.box(1.1, 7, 1.1, x, 45.5, z, STONE);
  }
  aroundSquare(3.3, [0]).forEach(({ x, z, turn }) =>
    parts.box(0.5, 7, 0.5, x, 45.5, z, STONE, turn)
  );
  parts.box(7.2, 1.4, 7.2, 0, 49.7, 0, STONE);
  parts.box(5.8, 1.4, 5.8, 0, 51.1, 0, STONE_SHADE);
  parts.pyramid(3.0, 16.6, 0, 51.8, 0, PATINA);
  parts.box(0.6, 1.8, 0.5, 0, 69.3, 0, GOLD);
  parts.box(1.8, 0.7, 0.12, 0, 69.6, -0.2, GOLD);
}

/** The Rialto: one stone arch across the Grand Canal, two rows of shops and the portico at its crown */
function rialto(parts: Parts): void {
  const half = 24;
  const crown = 6.6;
  const deck = (z: number) => crown * (1 - (z / half) ** 2);
  const water = -QUAY - 0.2;
  const span = 14.4;
  const intrados = (z: number) =>
    water + (5.4 - water) * Math.sqrt(Math.max(0, 1 - (z / span) ** 2));
  parts.profile(
    [
      ...along(-half, half, 24, deck),
      [half, water],
      ...along(span, -span, 24, intrados),
      [-half, water],
    ],
    22.9,
    0,
    STONE
  );
  // Balustrades along both outer walks
  for (const x of [-11.2, 11.2]) {
    parts.profile(
      [...along(-half, half, 24, z => deck(z) + 1.0), ...along(half, -half, 24, deck)],
      0.5,
      x,
      STONE_SHADE
    );
  }
  // Two rows of shops stepping up each side of the central walk, under terracotta roofs
  for (const x of [-6.2, 6.2]) {
    for (const side of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const z = side * (3.6 + k * 2.5 + 1.25);
        const base = deck(z);
        parts.box(5.2, 4.2, 2.5, x, base + 2.1, z, STONE_SHADE);
        parts.box(0.3, 2.6, 1.6, x - Math.sign(x) * 2.62, base + 1.5, z, DARK);
        parts.box(5.6, 0.4, 2.6, x, base + 4.4, z, TERRACOTTA);
      }
    }
  }
  // The portico at the crown, its arches open up and down the bridge, a pediment to each side
  parts.box(19.2, 5.6, 7, 0, crown + 2.8, 0, STONE);
  for (const z of [-3.55, 3.55]) parts.box(5.4, 4.2, 0.2, 0, crown + 2.1, z, DARK);
  parts.front(
    [
      [-9.8, crown + 5.6],
      [9.8, crown + 5.6],
      [0, crown + 8.8],
    ],
    7.4,
    -3.7,
    TERRACOTTA
  );
}

/** The Accademia: a wooden arch on steel, its deck climbing in a long curve, wooden railings */
function accademia(parts: Parts): void {
  const half = 27;
  const crown = 7.8;
  const deck = (z: number) => crown * (1 - (z / half) ** 2);
  const water = -QUAY - 0.2;
  const arch = (z: number) => water + (crown - 1.4 - water) * (1 - (z / 21) ** 2);
  parts.profile(
    [...along(-half, half, 30, deck), ...along(half, -half, 30, z => deck(z) - 0.6)],
    8.4,
    0,
    WOOD
  );
  for (const x of [-3.7, 3.7]) {
    parts.profile(
      [...along(-21, 21, 30, z => arch(z) + 0.9), ...along(21, -21, 30, arch)],
      0.5,
      x,
      STEEL
    );
    for (let z = -18; z <= 18; z += 2) {
      const from = arch(z) + 0.9;
      const to = deck(z) - 0.6;
      if (to - from > 0.2) parts.box(0.22, to - from, 0.22, x, (from + to) / 2, z, WOOD_DARK);
    }
  }
  for (const x of [-4.1, 4.1]) {
    parts.profile(
      [
        ...along(-half, half, 30, z => deck(z) + 1.1),
        ...along(half, -half, 30, z => deck(z) + 0.95),
      ],
      0.16,
      x,
      WOOD_DARK
    );
    for (let z = -half + 1; z < half; z += 1.5)
      parts.box(0.1, 1.0, 0.1, x, deck(z) + 0.5, z, WOOD_DARK);
  }
  for (const side of [-1, 1]) parts.box(9.6, 2.4, 4, 0, water + 1.2, side * 23, STONE);
}

/** The columns of San Marco (+x) and San Todaro on the Piazzetta, 21 m apart along x */
function piazzettaColumns(parts: Parts): void {
  for (const side of [-1, 1]) {
    const x = side * 10.5;
    parts.box(3.4, 0.6, 3.4, x, 0.3, 0, STONE);
    parts.box(2.8, 0.6, 2.8, x, 0.9, 0, STONE);
    parts.box(2.2, 1.6, 2.2, x, 2, 0, STONE);
    parts.cylinder(0.85, 11.6, x, 2.8, 0, GRANITE, 12);
    parts.box(2.2, 1.6, 2.2, x, 15.2, 0, STONE);
    parts.box(2.6, 0.6, 2.6, x, 16.3, 0, STONE);
  }
  // The winged lion of St Mark, and St Theodore on his crocodile
  parts.box(1.4, 1.6, 3.4, 10.5, 17.6, 0, BRONZE);
  parts.box(1.2, 1.2, 1.2, 10.5, 18.4, 1.8, BRONZE);
  parts.box(3.6, 1.0, 0.2, 10.5, 19.0, -0.3, BRONZE);
  parts.box(2.2, 0.7, 0.9, -10.5, 16.95, 0, STONE_SHADE);
  parts.box(0.8, 3.0, 0.7, -10.5, 18.8, 0, STONE);
  parts.box(0.45, 0.45, 0.45, -10.5, 20.5, 0, STONE);
}

const BUILD: Record<VenetianKind, (parts: Parts, size: number) => void> = {
  campanile,
  'basilica-dome': (parts, size) => basilicaDome(parts, 0, 0, size),
  salute,
  'san-giorgio-dome': sanGiorgioDome,
  'san-giorgio-campanile': sanGiorgioCampanile,
  rialto,
  accademia,
  'piazzetta-columns': piazzettaColumns,
};

/**
 * The landmarks placed from their lat/lon with `anchor`, standing on the quays at world height
 * `ground`, scaled to `unitsPerMetre`
 */
export function venetianLandmarks(
  list: VenetianLandmark[],
  anchor: GeoAnchor,
  ground: number,
  unitsPerMetre: number
): THREE.Object3D[] {
  return list.map(({ name, kind, at, heading = 0, size = 1 }) => {
    const parts = new Parts();
    BUILD[kind](parts, size);
    const object = parts.build(name);
    const { x, z } = geoToWorld(at[0], at[1], anchor);
    object.position.set(x, ground, z);
    // Compass heading of the front (+z): north is -z, clockwise seen from above
    object.rotation.y = THREE.MathUtils.degToRad(180 - heading);
    object.scale.setScalar(unitsPerMetre);
    return object;
  });
}
