import * as THREE from 'three';
import { Berth, BoatConfig, BoatGroupConfig } from './boat-group-types';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';

/**
 * Calculate positions for boats based on formation type
 */
export function calculateBoatPositions(
  boatCount: number,
  groupConfig: BoatGroupConfig
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const { center, formation, spacing, groupRadius = 100 } = groupConfig;

  switch (formation) {
    case 'circle':
      for (let i = 0; i < boatCount; i++) {
        const angle = (i / boatCount) * Math.PI * 2;
        const radius = groupRadius || 100;
        const x = center.x + Math.cos(angle) * radius;
        const z = center.z + Math.sin(angle) * radius;
        positions.push(new THREE.Vector3(x, center.y, z));
      }
      break;

    case 'random':
      for (let i = 0; i < boatCount; i++) {
        const maxRadius = groupRadius || 100;
        let position: THREE.Vector3;
        let attempts = 0;

        // Try to find a position that doesn't overlap with existing boats
        do {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * maxRadius;
          position = new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y,
            center.z + Math.sin(angle) * radius
          );
          attempts++;
        } while (
          attempts < 10 &&
          positions.some(existingPos => existingPos.distanceTo(position) < spacing)
        );

        positions.push(position);
      }
      break;
  }

  return positions;
}

/**
 * Berths along a pontoon or quay from `from` to `to`: as many as fit at `spacing`, centred on the
 * segment and `offset` to its side (positive is to the right looking from `from` to `to`), each
 * bow pointing from `from` towards `to`.
 */
export function mooredBerths(
  from: THREE.Vector3,
  to: THREE.Vector3,
  spacing: number,
  offset: number
): Berth[] {
  const along = to.clone().sub(from).setY(0);
  const length = along.length();
  along.normalize();
  const right = new THREE.Vector3(-along.z, 0, along.x);
  const heading = Math.atan2(-along.x, -along.z);
  const count = Math.floor(length / spacing);
  const margin = (length - count * spacing) / 2;

  return Array.from({ length: count }, (_, i) => ({
    position: from
      .clone()
      .addScaledVector(along, margin + (i + 0.5) * spacing)
      .addScaledVector(right, offset),
    heading,
  }));
}

/**
 * Generate boat configurations for mixed recreational boating
 */
export function generateMixedRecreationalBoats(count: number = 8): BoatConfig[] {
  const boats: BoatConfig[] = [];
  const boatTypes: Array<'SmallSailBoat' | 'FishingBoat' | 'Yacht' | 'SpeedBoat'> = [
    'SmallSailBoat',
    'FishingBoat',
    'Yacht',
    'SpeedBoat',
  ];

  for (let i = 0; i < count; i++) {
    const type = boatTypes[i % boatTypes.length];
    const enableMovement = Math.random() < 0.6; // 60% chance of movement

    boats.push({
      type,
      enableMovement,
      pattern: enableMovement
        ? Math.random() < 0.5
          ? MovementPattern.RANDOM_DRIFT
          : MovementPattern.CIRCULAR
        : undefined,
      speed: enableMovement ? 0.1 + Math.random() * 0.1 : undefined,
      radius: enableMovement ? 80 + Math.random() * 120 : undefined,
      scale: 2.4 + Math.random() * 0.6,
    });
  }

  return boats;
}
