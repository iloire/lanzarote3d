import * as THREE from 'three';

/** A soft-edged patch of ground colour, in world units: full strength in its middle, gone at `radius` */
export interface GroundRegion {
  x: number;
  z: number;
  radius: number;
  color: string;
  strength: number;
}

// The fraction of the radius that keeps full strength before the edge starts to fade.
const CORE = 0.35;

/**
 * Per-triangle ground colour from the regions the face's centre falls in, baked once from a
 * non-indexed geometry. Every corner of a face gets the same four numbers: the regions'
 * colours averaged by their weights (linear rgb) and how much of the base colour they
 * replace (0 none, 1 all). `toWorld` takes the geometry's positions to world space.
 */
export function bakeRegionTint(
  geometry: THREE.BufferGeometry,
  regions: GroundRegion[],
  toWorld: THREE.Matrix4
): THREE.BufferAttribute {
  const position = geometry.getAttribute('position');
  const count = position.count;
  const tint = new Float32Array(count * 4);
  const colors = regions.map(region => new THREE.Color(region.color));
  const centre = new THREE.Vector3();
  const corner = new THREE.Vector3();
  for (let i = 0; i + 2 < count; i += 3) {
    centre.set(0, 0, 0);
    for (let k = 0; k < 3; k++) centre.add(corner.fromBufferAttribute(position, i + k));
    centre.divideScalar(3).applyMatrix4(toWorld);
    let r = 0;
    let g = 0;
    let b = 0;
    let total = 0;
    regions.forEach((region, n) => {
      const distance = Math.hypot(centre.x - region.x, centre.z - region.z) / region.radius;
      if (distance >= 1) return;
      const fade = THREE.MathUtils.smoothstep(distance, CORE, 1);
      const weight = region.strength * (1 - fade);
      r += colors[n].r * weight;
      g += colors[n].g * weight;
      b += colors[n].b * weight;
      total += weight;
    });
    const cover = Math.min(1, total);
    const scale = total > 0 ? 1 / total : 0;
    for (let k = 0; k < 3; k++) {
      tint.set([r * scale, g * scale, b * scale, cover], (i + k) * 4);
    }
  }
  return new THREE.BufferAttribute(tint, 4);
}
