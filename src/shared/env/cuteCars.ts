import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import type { CarLook } from './roadTraffic';

/** Sugared-almond paints that stand out on the dark volcanic ground (sRGB) */
const PAINTS = ['#ff7a6b', '#7fd8be', '#ffd166', '#74b9ff', '#f7a1c4', '#b8e986', '#fffaf0'];

// How light each part is under the body's paint: the glass and the tyres darker
const PAINT = 1;
const GLASS = 0.28;
const TYRE = 0.09;
const LAMP = 1.6;

/** A present's wrapping and ribbon, sRGB; shown in `emit`, so the car's paint doesn't tint it */
const WRAPPING = '#2fa04e';
const RIBBON = '#ffcf3a';
/** How bright the present's own colour shows, and how much of the paint still lights it */
const PRESENT_GLOW = 0.55;
const PRESENT_PAINT = 0.12;

/**
 * A stubby toy car a metre to the unit, its length along +z (forward): a rounded body, a rounded
 * cabin with dark glass set back on it, four fat wheels and two round headlamps, and with
 * `present`, a wrapped present tied to the roof. Vertex colours shade the parts; the instance
 * colour paints the whole.
 */
export function cuteCar(present = false): THREE.BufferGeometry {
  // Each part, where its centre goes (sideways, up, forward), how light it is, and its own colour
  const parts: [THREE.BufferGeometry, number, number, number, number, string?][] = [
    [new RoundedBoxGeometry(1.9, 0.95, 3.6, 3, 0.4), 0, 0.85, 0, PAINT],
    [new RoundedBoxGeometry(1.6, 0.85, 1.9, 3, 0.35), 0, 1.55, -0.3, GLASS],
    [new RoundedBoxGeometry(1.5, 0.18, 1.7, 2, 0.08), 0, 2.0, -0.3, PAINT],
  ];
  [-0.9, 0.9].forEach(x =>
    [-1.15, 1.15].forEach(z =>
      parts.push([
        new THREE.CylinderGeometry(0.48, 0.48, 0.4, 14).rotateZ(Math.PI / 2),
        x,
        0.48,
        z,
        TYRE,
      ])
    )
  );
  [-0.55, 0.55].forEach(x =>
    parts.push([new THREE.SphereGeometry(0.2, 10, 8), x, 0.95, 1.75, LAMP])
  );
  if (present) {
    // A big box on the roof, a ribbon round it both ways and a bow on top
    parts.push(
      [new THREE.BoxGeometry(1.3, 0.9, 1.3), 0, 2.54, -0.3, PRESENT_PAINT, WRAPPING],
      [new THREE.BoxGeometry(1.34, 0.92, 0.22), 0, 2.54, -0.3, PRESENT_PAINT, RIBBON],
      [new THREE.BoxGeometry(0.22, 0.92, 1.34), 0, 2.54, -0.3, PRESENT_PAINT, RIBBON],
      [new THREE.TorusGeometry(0.2, 0.08, 6, 10), -0.18, 3.12, -0.3, PRESENT_PAINT, RIBBON],
      [new THREE.TorusGeometry(0.2, 0.08, 6, 10), 0.18, 3.12, -0.3, PRESENT_PAINT, RIBBON]
    );
  }

  const glow = new THREE.Color();
  const pieces = parts.map(([shape, x, y, z, light, own]) => {
    const piece = (shape.index ? shape.toNonIndexed() : shape).translate(x, y, z);
    if (piece !== shape) shape.dispose();
    const count = piece.attributes['position']!.count;
    piece.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(count * 3).fill(light), 3)
    );
    // RoadTraffic's material reads an `emit` attribute; these cars drive by day, lamps off, but a
    // present shows its own colour there
    const emit = new Float32Array(count * 3);
    if (own) {
      glow.set(own).multiplyScalar(PRESENT_GLOW);
      for (let i = 0; i < count; i++) glow.toArray(emit, i * 3);
    }
    piece.setAttribute('emit', new THREE.BufferAttribute(emit, 3));
    return piece;
  });
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(pieces.flatMap(piece => Array.from(piece.attributes[name]!.array))),
      3
    );
  const geometry = new THREE.BufferGeometry();
  ['position', 'normal', 'color', 'emit'].forEach(name =>
    geometry.setAttribute(name, merged(name))
  );
  pieces.forEach(piece => piece.dispose());
  return geometry;
}

/** Toy cars for the island by day, twice life size so they read from the air */
export const CUTE_CARS: CarLook = {
  geometry: cuteCar,
  bodies: PAINTS,
  size: 2,
  roughness: 0.55,
  metalness: 0,
};

/** At Christmas the same toy cars, each with a present tied to its roof */
export const CHRISTMAS_CARS: CarLook = {
  ...CUTE_CARS,
  geometry: () => cuteCar(true),
};

/** Santa's red, for the one car he drives */
export const SANTA_RED = '#d42a2a';
