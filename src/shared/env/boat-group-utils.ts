import * as THREE from 'three';
import { BoatConfig, BoatGroupConfig } from './boat-group-types';
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
