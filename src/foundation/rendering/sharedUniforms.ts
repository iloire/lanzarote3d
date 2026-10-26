import * as THREE from 'three';

/**
 * Uniforms shared by every shader that animates or follows the weather: the ocean,
 * cloud shadows on the terrain and the gulls. The same objects are handed to each
 * material, so the render pipeline ticks one clock and all of them move together.
 */
export const sharedUniforms = {
  uTime: { value: 0 },
  // Wind on the ground plane (x = east, y = south), in metres per second.
  uWind: { value: new THREE.Vector2(5, 0) },
  // 0 = no cloud shadows, 1 = full strength.
  uCloudShadow: { value: 0.35 },
};

/**
 * Point the shared wind uniform at a meteorological direction ("wind from" degrees).
 */
export function setSharedWind(fromDegreesNorth: number, speedMetresPerSecond: number): void {
  const towards = THREE.MathUtils.degToRad(fromDegreesNorth + 180);
  // North is -z in the island model, east is +x.
  sharedUniforms.uWind.value.set(
    Math.sin(towards) * speedMetresPerSecond,
    -Math.cos(towards) * speedMetresPerSecond
  );
}
