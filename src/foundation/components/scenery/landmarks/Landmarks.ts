import * as THREE from 'three';
import { MeshBuilder, lowPolyMaterial } from '../../base/lowPolyMesh';
import {
  block,
  cone,
  cylinder,
  flatRoof,
  gableRoof,
  lid,
  opening,
  panel,
  volume,
  walls,
} from '../buildings/lowPolyBuilding';
import { sharedUniforms } from '../../../rendering/sharedUniforms';

/**
 * The landmarks a pilot on the Risco de Famara knows: the radar on Peñas del Chache, the masts
 * along the top, the Ermita de las Nieves and the windsocks at takeoff. Each is one
 * vertex-coloured mesh on the shared low-poly material, in metres, standing on y = 0 and facing
 * +z; the windsock's sock is a second mesh so it can turn with the wind.
 */

const WHITE = new THREE.Color('#F2EFE6');
const LIME = new THREE.Color('#E4DFD2');
const CONCRETE = new THREE.Color('#A9A49A');
const STONE = new THREE.Color('#5E544B');
const TILE = new THREE.Color('#B5583A');
const WOOD = new THREE.Color('#5A3A24');
const SHADOW = new THREE.Color('#2B2622');
const BRONZE = new THREE.Color('#8A6A35');
const STEEL = new THREE.Color('#B8BCC0');
const SIGNAL_RED = new THREE.Color('#C8372D');
const SOCK_ORANGE = new THREE.Color('#F26A1B');

/** Metres every footing reaches below y = 0, so nothing floats where the ground slopes away */
const FOOTING = 4;

const asMesh = (mesh: MeshBuilder, name: string): THREE.Mesh => {
  const object = new THREE.Mesh(mesh.build(), lowPolyMaterial());
  object.name = name;
  return object;
};

/** A shallow dish facing `dir`: a seven-sided cone, its apex set back behind the rim */
const dish = (mesh: MeshBuilder, rim: THREE.Vector3, dir: THREE.Vector3, radius: number) => {
  const u = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
  const v = dir.clone().cross(u);
  const apex = rim.clone().addScaledVector(dir, -radius * 0.45);
  const edge = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return rim
      .clone()
      .addScaledVector(u, Math.cos(a) * radius)
      .addScaledVector(v, Math.sin(a) * radius);
  });
  edge.forEach((p, i) => mesh.tri(apex, p, edge[(i + 1) % 7]!, STEEL));
};

/**
 * A lattice mast: three legs tapering to the top, zig-zag bracing between them, in red and white
 * bands for aviation. `height` metres, on a concrete pad.
 */
const lattice = (mesh: MeshBuilder, x: number, z: number, height: number, base: number) => {
  const bands = 6;
  const leg = (i: number, y: number) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const r = THREE.MathUtils.lerp(base, base * 0.3, y / height);
    return new THREE.Vector3(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
  };
  for (let b = 0; b < bands; b++) {
    const [y0, y1] = [(b / bands) * height, ((b + 1) / bands) * height];
    const c = b % 2 === 0 ? SIGNAL_RED : WHITE;
    for (let i = 0; i < 3; i++) {
      mesh.rod(leg(i, y0), leg(i, y1), 0.18, c, 3);
      mesh.rod(leg(i, y0), leg((i + 1) % 3, y1), 0.08, c, 3);
    }
  }
  // A light on top and a pair of dishes two-thirds up, looking out over the cliff
  cylinder(mesh, x, z, 0.4, height, height + 1.2, SIGNAL_RED, 4);
  [0, 2.2].forEach(a => {
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    dish(mesh, new THREE.Vector3(x, height * 0.68, z).addScaledVector(dir, base * 0.6), dir, 1.3);
  });
  block(mesh, volume(x, z, base * 2.6, base * 2.6, -FOOTING, 0.4), CONCRETE);
};

/** A telecom mast on the ridge, `height` metres */
export const createMast = (height = 45): THREE.Mesh => {
  const mesh = new MeshBuilder();
  lattice(mesh, 0, 0, height, 2.4);
  block(mesh, volume(5, 0, 3, 2.4, -FOOTING, 2.6), LIME);
  return asMesh(mesh, 'Mast');
};

/**
 * An icosphere's facets above `floor`, squashed to `squash` of its height: a radome, or a
 * Manrique cupola. Alternate facets a shade apart, so the panels show even in flat light.
 */
const dome = (
  mesh: MeshBuilder,
  centre: THREE.Vector3,
  radius: number,
  squash: number,
  floor: number
) => {
  const sphere = new THREE.IcosahedronGeometry(radius, 1);
  const p = sphere.getAttribute('position');
  for (let i = 0; i < p.count; i += 3) {
    const [a, b, c] = [0, 1, 2].map(k => {
      const v = new THREE.Vector3().fromBufferAttribute(p, i + k);
      return v.setY(v.y * squash).add(centre);
    }) as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
    if ((a.y + b.y + c.y) / 3 < floor) continue;
    mesh.tri(a, b, c, (i / 3) % 2 === 0 ? WHITE : LIME);
  }
  sphere.dispose();
};

/**
 * The air-surveillance station on Peñas del Chache, the top of the Risco: a faceted white radome
 * on a drum, the operations block beside it and a mast of its own.
 */
export const createRadarStation = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const radius = 8;
  const drumTop = 9;

  // Tower drum, a band of shadow under the dome
  cylinder(mesh, 0, 0, radius * 0.75, -FOOTING, drumTop, LIME, 8);
  cylinder(mesh, 0, 0, radius * 0.8, drumTop - 0.6, drumTop + 0.4, CONCRETE, 8);

  // Radome: a geodesic ball, its lower quarter hidden in the drum
  dome(mesh, new THREE.Vector3(0, drumTop + radius * 0.55, 0), radius, 1, drumTop);

  // Operations block, flat-roofed with a row of dark windows
  const ops = volume(17, 2, 16, 9, -FOOTING, 4.5);
  walls(mesh, ops, LIME);
  flatRoof(mesh, ops, CONCRETE, 0.5);
  [-5, 0, 5].forEach(u =>
    opening(mesh, ops, '+z', u, 1.4, 2.2, 1.6, { pane: SHADOW, frame: WHITE, frameWidth: 0.2 })
  );
  opening(mesh, ops, '-x', 0, 0, 1.6, 2.6, { pane: SHADOW });

  lattice(mesh, -16, -6, 30, 2);
  return asMesh(mesh, 'Radar station');
};

/**
 * The Ermita de las Nieves on the Risco above Famara: a whitewashed nave under a tiled gable,
 * dark volcanic stone at the corners and round the door, a bell gable over the front, a
 * flat-roofed sacristy at the side and a low wall closing the forecourt.
 */
export const createErmita = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const nave = volume(0, 0, 7, 14, -FOOTING, 5.5);
  walls(mesh, nave, WHITE);
  gableRoof(mesh, nave, 'z', 2.2, 0.35, TILE, WHITE);

  // Stone quoins up each corner, a plinth and the door surround
  [nave.x0, nave.x1].forEach(x =>
    [nave.z0, nave.z1].forEach(z => block(mesh, volume(x, z, 0.7, 0.7, -FOOTING, 5.6), STONE))
  );
  (['+x', '-x', '+z', '-z'] as const).forEach(face => {
    const width = face === '+z' || face === '-z' ? 7 : 14;
    panel(mesh, nave, face, 0, -FOOTING, width, FOOTING + 0.5, STONE);
  });
  opening(mesh, nave, '+z', 0, 0, 1.8, 3.2, { pane: WOOD, frame: STONE, frameWidth: 0.4 });
  opening(mesh, nave, '+z', 0, 4.6, 0.8, 0.8, { pane: SHADOW, frame: STONE, frameWidth: 0.2 });
  [-3, 3].forEach(u => opening(mesh, nave, '+x', u, 2.6, 0.7, 1.3, { pane: SHADOW }));

  // Bell gable (espadaña) rising from the front gable, open for its bell
  const bell = volume(0, nave.z1 - 0.3, 2.4, 0.6, 6.5, 10);
  block(mesh, bell, WHITE);
  lid(mesh, bell, 10.05, STONE, 0.15);
  cone(mesh, 0, bell.z0 + 0.3, 0.5, 10.05, 0.8, STONE, 4);
  opening(mesh, bell, '+z', 0, 7.6, 1, 1.5, { pane: SHADOW });
  opening(mesh, bell, '-z', 0, 7.6, 1, 1.5, { pane: SHADOW });
  block(mesh, volume(0, nave.z1 - 0.3, 0.6, 0.8, 7.9, 8.8), BRONZE);

  // Sacristy against the side, and the forecourt wall
  const sacristy = volume(5.5, -3.5, 4, 5, -FOOTING, 3.8);
  walls(mesh, sacristy, WHITE);
  flatRoof(mesh, sacristy, LIME, 0.4);
  opening(mesh, sacristy, '+z', 0, 0, 1.2, 2.4, { pane: WOOD });
  const z = nave.z1 + 6;
  block(mesh, volume(-4.5, z, 5, 0.6, -FOOTING, 1.2), WHITE);
  block(mesh, volume(4.5, z, 5, 0.6, -FOOTING, 1.2), WHITE);
  [-7, 7].forEach(x => block(mesh, volume(x, nave.z1 + 3, 0.6, 6, -FOOTING, 1.2), WHITE));

  return asMesh(mesh, 'Ermita de las Nieves');
};

const LAVA = new THREE.Color('#3E3631');
const LAVA_LIGHT = new THREE.Color('#544941');
const EARTH = new THREE.Color('#6B5A4A');
const SEA_GLASS = new THREE.Color('#3B5566');

/**
 * Manrique's Mirador del Río at the north end of the Risco, built into the cliff top so it nearly
 * disappears: a D-shaped body walled in dry volcanic stone, a long curved band of glass in its
 * front looking out over El Río to La Graciosa, the roof laid with earth and broken by two white
 * cupolas, and a low stone parapet round the terrace in front.
 */
export const createMirador = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const radius = 16;
  const height = 5;
  const sweep = THREE.MathUtils.degToRad(75);
  const segments = 12;
  const at = (a: number, r: number, y: number) =>
    new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
  const angles = Array.from(
    { length: segments + 1 },
    (_, i) => -sweep + (2 * sweep * i) / segments
  );

  angles.slice(0, -1).forEach((a, i) => {
    const b = angles[i + 1]!;
    const stone = i % 2 === 0 ? LAVA : LAVA_LIGHT;
    mesh.quad(
      at(a, radius, -FOOTING),
      at(b, radius, -FOOTING),
      at(b, radius, height),
      at(a, radius, height),
      stone
    );
    // The glass band runs across the middle of the front, under a stone lintel
    if (i >= 2 && i < segments - 2) {
      const r = radius + 0.15;
      mesh.quad(at(a, r, 1.4), at(b, r, 1.4), at(b, r, 3.9), at(a, r, 3.9), SEA_GLASS);
    }
    // Earth roof fanned from the middle of the back wall
    const back = new THREE.Vector3(0, height, Math.cos(sweep) * radius);
    mesh.tri(back, at(b, radius, height), at(a, radius, height), EARTH);
    // Terrace parapet, a few metres out
    const t = radius + 5;
    mesh.quad(at(a, t, -FOOTING), at(b, t, -FOOTING), at(b, t, 1.1), at(a, t, 1.1), LAVA_LIGHT);
  });
  // Back wall along the chord, mostly buried in the hill
  const [left, right] = [at(-sweep, radius, 0), at(sweep, radius, 0)];
  mesh.quad(
    left.clone().setY(-FOOTING),
    right.clone().setY(-FOOTING),
    right.clone().setY(height),
    left.clone().setY(height),
    LAVA
  );

  dome(mesh, new THREE.Vector3(-4, height - 0.5, radius * 0.58), 4, 0.7, height);
  dome(mesh, new THREE.Vector3(4.5, height - 0.5, radius * 0.5), 3.2, 0.7, height);
  return asMesh(mesh, 'Mirador del Río');
};

const FORT_STONE = new THREE.Color('#8A7258');
const FORT_STONE_DARK = new THREE.Color('#725E48');
const FORT_TRIM = new THREE.Color('#CFC5AE');

/** A row of merlons along one side of a parapet from (x0, z0) to (x1, z1) */
const merlons = (
  mesh: MeshBuilder,
  [x0, z0]: [number, number],
  [x1, z1]: [number, number],
  y: number,
  c: THREE.Color
) => {
  const length = Math.hypot(x1 - x0, z1 - z0);
  const count = Math.max(2, Math.round(length / 2.4));
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    block(mesh, volume(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 1.1, 1.1, y, y + 1.1), c);
  }
};

/** A sentry box (garita) on a corner: a little round turret with a cone cap */
const garita = (mesh: MeshBuilder, x: number, z: number, y: number) => {
  cylinder(mesh, x, z, 1.3, y - 1.5, y + 2.2, FORT_TRIM, 6);
  cone(mesh, x, z, 1.6, y + 2.2, 1.6, FORT_STONE_DARK, 6);
};

/**
 * The Castillo de Santa Bárbara on the rim of Guanapay above Teguise, the island's old watch
 * over its capital, now the pirate museum: a squat keep of ochre volcanic stone on a battered
 * base, a taller tower at one end, crenellated parapets, a round sentry box on each corner,
 * pale dressed stone at the edges and a dark gateway reached by a short bridge.
 */
export const createCastillo = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const keep = volume(0, 0, 26, 14, 2, 9);

  // Battered base: a sloping skirt from the rock up to the walls
  const skirt = volume(0, 0, 30, 18, -FOOTING, -FOOTING);
  const corners = (v: typeof keep, y: number) => [
    new THREE.Vector3(v.x0, y, v.z0),
    new THREE.Vector3(v.x1, y, v.z0),
    new THREE.Vector3(v.x1, y, v.z1),
    new THREE.Vector3(v.x0, y, v.z1),
  ];
  const [low, high] = [corners(skirt, -FOOTING), corners(keep, 2)];
  low.forEach((p, i) =>
    mesh.quad(p, low[(i + 1) % 4]!, high[(i + 1) % 4]!, high[i]!, FORT_STONE_DARK)
  );

  walls(mesh, keep, FORT_STONE);
  lid(mesh, keep, 8, FORT_STONE_DARK);
  panel(mesh, keep, '+z', 0, 2, 26, 0.6, FORT_TRIM);
  panel(mesh, keep, '-z', 0, 2, 26, 0.6, FORT_TRIM);
  merlons(mesh, [keep.x0, keep.z1], [keep.x1, keep.z1], 9, FORT_STONE);
  merlons(mesh, [keep.x0, keep.z0], [keep.x1, keep.z0], 9, FORT_STONE);
  merlons(mesh, [keep.x0, keep.z0], [keep.x0, keep.z1], 9, FORT_STONE);

  // The tower at the east end, a storey higher, with its own parapet
  const tower = volume(9, 0, 9, 11, 8, 14);
  walls(mesh, tower, FORT_STONE);
  lid(mesh, tower, 13.2, FORT_STONE_DARK);
  [
    [tower.x0, tower.z0],
    [tower.x1, tower.z0],
    [tower.x1, tower.z1],
    [tower.x0, tower.z1],
  ].forEach(([x, z], i, all) =>
    merlons(mesh, [x!, z!], all[(i + 1) % 4] as [number, number], 14, FORT_STONE)
  );
  opening(mesh, tower, '+z', 0, 10, 1, 1.6, { pane: SHADOW, frame: FORT_TRIM, frameWidth: 0.25 });

  // Corner sentry boxes, arrow slits and the gateway with its bridge
  [keep.x0, keep.x1].forEach(x => [keep.z0, keep.z1].forEach(z => garita(mesh, x, z, 9)));
  [-8, -3].forEach(u => opening(mesh, keep, '+z', u, 5, 0.5, 1.6, { pane: SHADOW }));
  opening(mesh, keep, '+z', 2, 2, 2.6, 3.6, { pane: SHADOW, frame: FORT_TRIM, frameWidth: 0.5 });
  block(mesh, volume(2, keep.z1 + 3, 3, 6, 1.4, 2), WOOD);

  // A flag on the tower
  mesh.rod(new THREE.Vector3(11, 14, 2), new THREE.Vector3(11, 19, 2), 0.08, STEEL, 4);
  mesh.quad(
    new THREE.Vector3(11, 19, 2),
    new THREE.Vector3(13.4, 18.7, 2),
    new THREE.Vector3(13.4, 17.3, 2),
    new THREE.Vector3(11, 17.6, 2),
    SIGNAL_RED
  );
  return asMesh(mesh, 'Castillo de Santa Bárbara');
};

const SOCK_LENGTH = 5;

/**
 * A takeoff windsock: a pole and a five-band orange and white sock that swings round to blow
 * downwind with the shared wind uniform and flutters a little, so it always agrees with the sea.
 */
export const createWindsock = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'Windsock';
  const height = 6;

  const pole = new MeshBuilder();
  pole.rod(new THREE.Vector3(0, -FOOTING, 0), new THREE.Vector3(0, height, 0), 0.09, STEEL, 5);
  pole.box(-0.4, 0.4, -FOOTING, 0, 0.4, 0, CONCRETE);
  group.add(asMesh(pole, 'Windsock pole'));

  // Tapered bands along +x from the hoop, alternately orange and white
  const sock = new MeshBuilder();
  const bands = 5;
  const sides = 8;
  const rings = Array.from({ length: bands + 1 }, (_, i) => {
    const t = i / bands;
    const r = THREE.MathUtils.lerp(0.55, 0.28, t);
    return Array.from({ length: sides }, (_, k) => {
      const a = (k / sides) * Math.PI * 2;
      return new THREE.Vector3(t * SOCK_LENGTH, Math.cos(a) * r, Math.sin(a) * r);
    });
  });
  sock.loft(rings, s => (s % 2 === 0 ? SOCK_ORANGE : WHITE), [SOCK_ORANGE, SOCK_ORANGE]);
  const sockMesh = asMesh(sock, 'Windsock sock');
  sockMesh.position.set(0, height - 0.5, 0);
  group.add(sockMesh);

  const phase = Math.random() * 10;
  sockMesh.onBeforeRender = () => {
    const wind = sharedUniforms.uWind.value;
    const t = sharedUniforms.uTime.value + phase;
    // The sock blows towards the wind's heading (x east, y south on the ground plane)
    const heading = Math.atan2(-wind.y, wind.x);
    const strength = THREE.MathUtils.clamp(wind.length() / 8, 0, 1);
    sockMesh.rotation.set(
      Math.sin(t * 7) * 0.05,
      heading + Math.sin(t * 2.3) * 0.12 * (1.2 - strength),
      -THREE.MathUtils.lerp(0.55, 0.05, strength) + Math.sin(t * 5.1) * 0.04
    );
  };
  return group;
};

const SOAPSTONE = new THREE.Color('#E4E2D9');
const SOAPSTONE_SHADE = new THREE.Color('#C9C6BB');

/**
 * Cristo Redentor on Corcovado: the 30 m soapstone figure on its 8 m pedestal, arms spread 28 m.
 * The robe tapers from the hem to the shoulders, the sleeves hang below the arms, and the head
 * tilts down a little towards the city. Faces +z.
 */
export const createCristoRedentor = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const solid = (v: ReturnType<typeof volume>, c: THREE.Color) => {
    block(mesh, v, c);
    lid(mesh, v, v.y1, c, 0);
  };

  // Pedestal with the chapel inside, on a wider plinth of steps
  solid(volume(0, 0, 12, 12, -FOOTING, 1.2), CONCRETE);
  solid(volume(0, 0, 8.5, 8.5, 1.2, 8), SOAPSTONE_SHADE);

  // The robe, stepping in from the hem to the chest
  const robe: [number, number, number, number][] = [
    [6, 4.4, 8, 13],
    [5.4, 4, 13, 18],
    [4.9, 3.7, 18, 23],
    [4.6, 3.5, 23, 27],
  ];
  robe.forEach(([w, d, y0, y1]) => solid(volume(0, 0, w, d, y0, y1), SOAPSTONE));

  // Shoulders and outstretched arms, the sleeves hanging beneath them to the elbows
  solid(volume(0, 0, 6.4, 3.4, 27, 29.6), SOAPSTONE);
  solid(volume(0, 0, 28, 2, 27.6, 29.4), SOAPSTONE);
  [-1, 1].forEach(side => {
    solid(volume(side * 6.5, 0, 6, 2.6, 24.5, 27.6), SOAPSTONE_SHADE);
    solid(volume(side * 13.6, 0, 0.8, 1.2, 26.8, 29.4), SOAPSTONE);
  });

  // Neck and head, leaning a little forward
  solid(volume(0, 0.2, 1.2, 1.2, 29.6, 30.4), SOAPSTONE);
  solid(volume(0, 0.4, 2.2, 2.4, 30.4, 33.6), SOAPSTONE);

  return asMesh(mesh, 'Cristo Redentor');
};
