import * as THREE from 'three';

/**
 * Per-triangle data for the low-poly ground, baked once from a non-indexed geometry.
 *
 * Every corner of a triangle gets the same three numbers, so the shader sees one flat
 * value per face: the face's centre height (local y), how flat it is (the y of its unit
 * normal: 1 level, 0 vertical) and a seeded random in [-1, 1] to jitter its tone. The
 * shader turns these into a colour, so the strengths stay tunable from the theme.
 */
export function bakeFaceShading(geometry: THREE.BufferGeometry): THREE.BufferAttribute {
  const position = geometry.getAttribute('position');
  const count = position.count;
  const face = new Float32Array(count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i + 2 < count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    const height = (a.y + b.y + c.y) / 3;
    b.sub(a);
    c.sub(a);
    const normal = b.cross(c);
    const length = normal.length();
    // Winding may vary, so take the size of the vertical component, not its sign.
    const flatness = length > 0 ? Math.abs(normal.y) / length : 1;
    const jitter = hash(i / 3) * 2 - 1;
    for (let k = 0; k < 3; k++) {
      face[(i + k) * 3] = height;
      face[(i + k) * 3 + 1] = flatness;
      face[(i + k) * 3 + 2] = jitter;
    }
  }
  return new THREE.BufferAttribute(face, 3);
}

// Integer hash to [0, 1): neighbouring faces get unrelated values, the same every load.
const hash = (n: number): number => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
