import * as THREE from 'three';
import { BoatConfig, BoatGroupConfig, BOAT_GROUP_PRESETS } from './boat-group-types';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';

/**
 * Calculate positions for boats based on formation type
 */
export function calculateBoatPositions(
  boatCount: number,
  groupConfig: BoatGroupConfig
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const {
    center,
    formation,
    spacing,
    groupRadius = 100,
    rowCount = 3,
    colCount = 3,
    lineDirection,
  } = groupConfig;

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

    case 'line':
      const direction = lineDirection || new THREE.Vector3(1, 0, 0);
      direction.normalize();
      for (let i = 0; i < boatCount; i++) {
        const offset = (i - (boatCount - 1) / 2) * spacing;
        const position = center.clone().add(direction.clone().multiplyScalar(offset));
        positions.push(position);
      }
      break;

    case 'grid':
      const actualRowCount = rowCount || Math.ceil(Math.sqrt(boatCount));
      const actualColCount = colCount || Math.ceil(boatCount / actualRowCount);

      for (let i = 0; i < boatCount; i++) {
        const row = Math.floor(i / actualColCount);
        const col = i % actualColCount;
        const x = center.x + (col - (actualColCount - 1) / 2) * spacing;
        const z = center.z + (row - (actualRowCount - 1) / 2) * spacing;
        positions.push(new THREE.Vector3(x, center.y, z));
      }
      break;

    case 'harbor':
      // Harbor formation: curved docks with boats
      const docksCount = Math.min(3, Math.ceil(boatCount / 4));
      let boatIndex = 0;

      for (let dock = 0; dock < docksCount && boatIndex < boatCount; dock++) {
        const dockAngle = (dock / docksCount) * Math.PI * 0.8 - Math.PI * 0.4; // Spread across 144 degrees
        const dockRadius = (groupRadius || 100) * 0.7;
        const dockCenter = new THREE.Vector3(
          center.x + Math.cos(dockAngle) * dockRadius,
          center.y,
          center.z + Math.sin(dockAngle) * dockRadius
        );

        // Place boats along each dock
        const boatsPerDock = Math.min(4, boatCount - boatIndex);
        for (let b = 0; b < boatsPerDock; b++) {
          const dockDirection = new THREE.Vector3(-Math.sin(dockAngle), 0, Math.cos(dockAngle));
          const boatPosition = dockCenter
            .clone()
            .add(dockDirection.clone().multiplyScalar((b - boatsPerDock / 2) * spacing * 0.8));
          positions.push(boatPosition);
          boatIndex++;
        }
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

    default:
      console.warn(`Unknown formation type: ${formation}`);
      // Fallback to simple line formation
      for (let i = 0; i < boatCount; i++) {
        const x = center.x + (i - (boatCount - 1) / 2) * spacing;
        positions.push(new THREE.Vector3(x, center.y, center.z));
      }
  }

  return positions;
}

/**
 * Generate boat configurations for a marina/harbor
 */
export function generateMarinaBoats(size: 'small' | 'medium' | 'large' = 'medium'): BoatConfig[] {
  const config = BOAT_GROUP_PRESETS.marina[size];

  const boats: BoatConfig[] = [
    // Stationary boats (like moored boats)
    { type: 'Yacht', enableMovement: false, scale: 2.2 },
    { type: 'SmallSailBoat', enableMovement: false, scale: 2.8 },
    { type: 'FishingBoat', enableMovement: false, scale: 2.5 },
    // Some moving boats (like boats entering/leaving harbor)
    {
      type: 'SmallSailBoat',
      enableMovement: true,
      pattern: MovementPattern.RANDOM_DRIFT,
      speed: 0.05,
      radius: 60,
      scale: 3.0,
    },
    {
      type: 'SpeedBoat',
      enableMovement: true,
      pattern: MovementPattern.LINEAR,
      speed: 0.2,
      radius: 100,
      scale: 2.8,
    },
  ];

  // Add more boats for larger marinas
  while (boats.length < config.count) {
    boats.push(
      { type: 'SmallSailBoat', enableMovement: false, scale: 2.8 },
      { type: 'FishingBoat', enableMovement: false, scale: 2.5 }
    );
  }

  return boats.slice(0, config.count);
}

/**
 * Generate boat configurations for a patrol fleet
 */
export function generatePatrolFleet(
  size: 'single' | 'formation' | 'fleet' = 'formation'
): BoatConfig[] {
  const config = BOAT_GROUP_PRESETS.patrol[size];
  const boats: BoatConfig[] = [];

  for (let i = 0; i < config.count; i++) {
    boats.push({
      type: 'PatrolBoat',
      enableMovement: true,
      pattern: MovementPattern.CIRCULAR,
      speed: 0.4 + Math.random() * 0.3, // Varied speeds for realism
      radius: 150 + Math.random() * 100,
      scale: 2.3 + Math.random() * 0.4,
      colors: {
        hullColor: '#0066CC',
        accentColor: '#FFFFFF',
        flagColor: '#FF0000',
      },
    });
  }

  return boats;
}

/**
 * Generate boat configurations for a racing fleet
 */
export function generateRacingFleet(size: 'small' | 'medium' | 'large' = 'medium'): BoatConfig[] {
  const config = BOAT_GROUP_PRESETS.racing[size];
  const boats: BoatConfig[] = [];

  const boatTypes: Array<'SpeedBoat' | 'SmallSailBoat'> = ['SpeedBoat', 'SmallSailBoat'];

  for (let i = 0; i < config.count; i++) {
    const type = boatTypes[i % boatTypes.length];
    boats.push({
      type,
      enableMovement: true,
      pattern: MovementPattern.LINEAR,
      speed: 0.8 + Math.random() * 0.6, // Fast racing speeds
      radius: 200 + Math.random() * 100,
      scale: type === 'SpeedBoat' ? 2.6 : 2.9,
      colors:
        type === 'SpeedBoat'
          ? {
              hullColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random racing colors
            }
          : undefined,
    });
  }

  return boats;
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
