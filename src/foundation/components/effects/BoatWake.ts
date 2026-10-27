import * as THREE from 'three';
import { resourceManager } from '../../systems/ResourceManager';

/** Half-angle of a ship's wake, the Kelvin angle */
const KELVIN = THREE.MathUtils.degToRad(19.5);
/** The wake's arms run this many boat lengths astern, the wash behind the stern half as far */
const ARM_LENGTHS = 3;
const WASH_LENGTHS = 1.2;
/** Just above the sea, so it doesn't flicker with the water */
const HEIGHT = 0.15;
/** Foam at the stern, fading to nothing at the end */
const FOAM_ALPHA = 0.6;

/**
 * A wake behind a boat whose bow points along −z, in the boat's own units: two foam arms opening
 * at the Kelvin angle from the corners of the stern, and a wash of churned water straight behind.
 * Vertex colours carry the alpha, so it fades out astern.
 */
export function wakeGeometry(bounds: THREE.Box3): THREE.BufferGeometry {
  const stern = bounds.max.z;
  const beam = (bounds.max.x - bounds.min.x) / 2;
  const length = bounds.max.z - bounds.min.z;
  const positions: number[] = [];
  const colors: number[] = [];

  // A strip from a (at the stern) to b (astern), widening from wa to wb, fading out towards b
  const strip = (ax: number, az: number, bx: number, bz: number, wa: number, wb: number) => {
    const quad = [
      [ax - wa, az, FOAM_ALPHA],
      [ax + wa, az, FOAM_ALPHA],
      [bx + wb, bz, 0],
      [bx - wb, bz, 0],
    ] as const;
    [0, 1, 2, 0, 2, 3].forEach(i => {
      const [x, z, alpha] = quad[i]!;
      positions.push(x, HEIGHT, z);
      colors.push(1, 1, 1, alpha);
    });
  };

  const armLength = length * ARM_LENGTHS;
  const spread = armLength * Math.tan(KELVIN);
  [-1, 1].forEach(side =>
    strip(side * beam, stern, side * (beam + spread), stern + armLength, beam * 0.12, beam * 0.35)
  );
  strip(0, stern, 0, stern + length * WASH_LENGTHS, beam * 0.5, beam);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  return geometry;
}

/**
 * Adds a wake to a boat that has just been loaded (before it is scaled, turned or placed), as a
 * child, so it follows the boat wherever its movement takes it.
 */
export function addBoatWake(boat: THREE.Object3D): THREE.Mesh {
  const material = resourceManager.getOrCreateMaterial(
    'boat_wake',
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
  );
  // Measured with the boat's own quarter turn applied, where the bow points along −z; undoing that
  // turn on the wake keeps it there once it is a child, rather than turning it a second time
  boat.updateMatrixWorld(true);
  const wake = new THREE.Mesh(wakeGeometry(new THREE.Box3().setFromObject(boat)), material);
  wake.applyMatrix4(boat.matrixWorld.clone().invert());
  wake.name = 'BoatWake';
  wake.renderOrder = 1;
  boat.add(wake);
  return wake;
}
