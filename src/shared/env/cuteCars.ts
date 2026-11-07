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

/**
 * A stubby toy car a metre to the unit, its length along +z (forward): a rounded body, a rounded
 * cabin with dark glass set back on it, four fat wheels and two round headlamps. Vertex colours
 * shade the parts; the instance colour paints the whole.
 */
export function cuteCar(): THREE.BufferGeometry {
  // Each part, where its centre goes (sideways, up, forward) and how light it is
  const parts: [THREE.BufferGeometry, number, number, number, number][] = [
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

  const pieces = parts.map(([shape, x, y, z, light]) => {
    const piece = (shape.index ? shape.toNonIndexed() : shape).translate(x, y, z);
    if (piece !== shape) shape.dispose();
    const count = piece.attributes['position']!.count;
    piece.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(count * 3).fill(light), 3)
    );
    // RoadTraffic's material reads an `emit` attribute; these cars drive by day, lamps off
    piece.setAttribute('emit', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
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
