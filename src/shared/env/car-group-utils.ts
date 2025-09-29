import * as THREE from 'three';
import {
  CarConfig,
  CarGroupConfig,
  CAR_GROUP_PRESETS,
  CAR_COLOR_PALETTES,
} from './car-group-types';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';
import { TerrainDrivingMode } from '../../foundation/systems/behaviors/TerrainFollowingBehavior';

/**
 * Calculate positions for cars based on formation type and terrain
 */
export function calculateCarPositions(
  carCount: number,
  groupConfig: CarGroupConfig
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
    terrain,
  } = groupConfig;

  switch (formation) {
    case 'circle':
      for (let i = 0; i < carCount; i++) {
        const angle = (i / carCount) * Math.PI * 2;
        const radius = groupRadius || 100;
        const x = center.x + Math.cos(angle) * radius;
        const z = center.z + Math.sin(angle) * radius;
        const y = getTerrainHeight(x, z, terrain) || center.y;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;

    case 'line':
      const direction = lineDirection || new THREE.Vector3(1, 0, 0);
      direction.normalize();
      for (let i = 0; i < carCount; i++) {
        const offset = (i - (carCount - 1) / 2) * spacing;
        const x = center.x + direction.x * offset;
        const z = center.z + direction.z * offset;
        const y = getTerrainHeight(x, z, terrain) || center.y;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;

    case 'convoy':
      // Similar to line but with tighter spacing and forward orientation
      const convoyDirection = lineDirection || new THREE.Vector3(1, 0, 0);
      convoyDirection.normalize();
      for (let i = 0; i < carCount; i++) {
        const offset = i * spacing;
        const x = center.x + convoyDirection.x * offset;
        const z = center.z + convoyDirection.z * offset;
        const y = getTerrainHeight(x, z, terrain) || center.y;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;

    case 'grid':
      const actualRowCount = rowCount || Math.ceil(Math.sqrt(carCount));
      const actualColCount = colCount || Math.ceil(carCount / actualRowCount);

      for (let i = 0; i < carCount; i++) {
        const row = Math.floor(i / actualColCount);
        const col = i % actualColCount;
        const x = center.x + (col - (actualColCount - 1) / 2) * spacing;
        const z = center.z + (row - (actualRowCount - 1) / 2) * spacing;
        const y = getTerrainHeight(x, z, terrain) || center.y;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;

    case 'parking':
      // Parking lot formation: organized rows like a real parking lot
      const parkingRows = Math.ceil(carCount / 4); // 4 cars per row
      let carIndex = 0;

      for (let row = 0; row < parkingRows && carIndex < carCount; row++) {
        const carsInThisRow = Math.min(4, carCount - carIndex);
        for (let col = 0; col < carsInThisRow; col++) {
          const x = center.x + (col - 1.5) * spacing;
          const z = center.z + row * spacing * 1.2; // Slightly more space between rows
          const y = getTerrainHeight(x, z, terrain) || center.y;
          positions.push(new THREE.Vector3(x, y, z));
          carIndex++;
        }
      }
      break;

    case 'random':
      for (let i = 0; i < carCount; i++) {
        const maxRadius = groupRadius || 100;
        let position: THREE.Vector3;
        let attempts = 0;

        // Try to find a position that doesn't overlap with existing cars
        do {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * maxRadius;
          const x = center.x + Math.cos(angle) * radius;
          const z = center.z + Math.sin(angle) * radius;
          const y = getTerrainHeight(x, z, terrain) || center.y;
          position = new THREE.Vector3(x, y, z);
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
      for (let i = 0; i < carCount; i++) {
        const x = center.x + (i - (carCount - 1) / 2) * spacing;
        const z = center.z;
        const y = getTerrainHeight(x, z, terrain) || center.y;
        positions.push(new THREE.Vector3(x, y, z));
      }
  }

  return positions;
}

/**
 * Get terrain height at specific coordinates
 */
function getTerrainHeight(x: number, z: number, terrain?: THREE.Mesh): number | null {
  if (!terrain) return null;

  const raycaster = new THREE.Raycaster(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
  const intersects = raycaster.intersectObject(terrain);
  return intersects.length > 0 ? intersects[0].point.y : null;
}

/**
 * Generate car configurations for a parking lot
 */
export function generateParkingLotCars(size: 'small' | 'medium' | 'large' = 'medium'): CarConfig[] {
  const config = CAR_GROUP_PRESETS.parking[size];
  const cars: CarConfig[] = [];
  const colorPalette = CAR_COLOR_PALETTES.standard;

  for (let i = 0; i < config.count; i++) {
    const colors = colorPalette[i % colorPalette.length];
    const enableMovement = Math.random() < 0.2; // 20% chance of movement (cars leaving/arriving)

    cars.push({
      type: 'Car',
      enableMovement,
      pattern: enableMovement ? MovementPattern.LINEAR : undefined,
      speed: enableMovement ? 0.1 + Math.random() * 0.1 : undefined,
      radius: enableMovement ? 50 + Math.random() * 50 : undefined,
      scale: 0.8 + Math.random() * 0.4, // Varied car sizes
      ...colors,
      windowColor: '#87CEEB',
      wheelColor: '#222222',
    });
  }

  return cars;
}

/**
 * Generate car configurations for a convoy
 */
export function generateConvoy(size: 'small' | 'medium' | 'large' = 'medium'): CarConfig[] {
  const config = CAR_GROUP_PRESETS.convoy[size];
  const cars: CarConfig[] = [];
  const colorPalette = CAR_COLOR_PALETTES.professional;

  for (let i = 0; i < config.count; i++) {
    const colors = colorPalette[i % colorPalette.length];
    const isLeader = i === 0;

    cars.push({
      type: isLeader ? 'AutonomousCar' : 'Car',
      enableMovement: true,
      pattern: MovementPattern.LINEAR,
      speed: 0.2 + Math.random() * 0.1,
      radius: 200 + Math.random() * 100,
      scale: 0.9 + Math.random() * 0.2,
      ...colors,
      windowColor: '#87CEEB',
      wheelColor: '#222222',
      // Autonomous car specific options
      drivingMode: isLeader ? TerrainDrivingMode.EXPLORATION : undefined,
      explorationRadius: isLeader ? 300 : undefined,
      showDebugInfo: isLeader ? false : undefined, // Set to true for debugging
    });
  }

  return cars;
}

/**
 * Generate car configurations for patrol vehicles
 */
export function generatePatrolFleet(size: 'single' | 'team' | 'fleet' = 'team'): CarConfig[] {
  const config = CAR_GROUP_PRESETS.patrol[size];
  const cars: CarConfig[] = [];

  for (let i = 0; i < config.count; i++) {
    cars.push({
      type: 'AutonomousCar',
      enableMovement: true,
      pattern: MovementPattern.PATROL,
      speed: 0.15 + Math.random() * 0.1,
      radius: 150 + Math.random() * 100,
      scale: 1.0 + Math.random() * 0.2,
      bodyColor: '#2E8B57', // Sea green for patrol vehicles
      roofColor: '#1F5F3F',
      windowColor: '#87CEEB',
      wheelColor: '#222222',
      drivingMode: TerrainDrivingMode.PATROL,
      explorationRadius: 200 + Math.random() * 200,
      showDebugInfo: false, // Set to true for debugging
    });
  }

  return cars;
}

/**
 * Generate car configurations for traffic simulation
 */
export function generateTrafficCars(
  size: 'light' | 'moderate' | 'heavy' = 'moderate'
): CarConfig[] {
  const config = CAR_GROUP_PRESETS.traffic[size];
  const cars: CarConfig[] = [];
  const colorPalettes = [CAR_COLOR_PALETTES.standard, CAR_COLOR_PALETTES.vibrant];

  for (let i = 0; i < config.count; i++) {
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const colors = palette[Math.floor(Math.random() * palette.length)];
    const isAutonomous = Math.random() < 0.3; // 30% chance of autonomous car
    const enableMovement = Math.random() < 0.8; // 80% chance of movement

    cars.push({
      type: isAutonomous ? 'AutonomousCar' : 'Car',
      enableMovement,
      pattern: enableMovement
        ? Math.random() < 0.6
          ? MovementPattern.LINEAR
          : MovementPattern.RANDOM_DRIFT
        : undefined,
      speed: enableMovement ? 0.08 + Math.random() * 0.12 : undefined,
      radius: enableMovement ? 100 + Math.random() * 150 : undefined,
      scale: 0.7 + Math.random() * 0.6,
      ...colors,
      windowColor: '#87CEEB',
      wheelColor: '#222222',
      // Autonomous car specific options
      drivingMode: isAutonomous ? TerrainDrivingMode.EXPLORATION : undefined,
      explorationRadius: isAutonomous ? 250 + Math.random() * 150 : undefined,
      showDebugInfo: false,
    });
  }

  return cars;
}

/**
 * Generate mixed recreational cars
 */
export function generateMixedCars(count: number = 6): CarConfig[] {
  const cars: CarConfig[] = [];
  const allPalettes = [
    CAR_COLOR_PALETTES.standard,
    CAR_COLOR_PALETTES.vibrant,
    CAR_COLOR_PALETTES.professional,
  ];

  for (let i = 0; i < count; i++) {
    const palette = allPalettes[Math.floor(Math.random() * allPalettes.length)];
    const colors = palette[Math.floor(Math.random() * palette.length)];
    const isAutonomous = Math.random() < 0.25; // 25% chance of autonomous car
    const enableMovement = Math.random() < 0.6; // 60% chance of movement

    cars.push({
      type: isAutonomous ? 'AutonomousCar' : 'Car',
      enableMovement,
      pattern: enableMovement
        ? Math.random() < 0.4
          ? MovementPattern.RANDOM_DRIFT
          : MovementPattern.CIRCULAR
        : undefined,
      speed: enableMovement ? 0.05 + Math.random() * 0.1 : undefined,
      radius: enableMovement ? 80 + Math.random() * 120 : undefined,
      scale: 0.8 + Math.random() * 0.4,
      ...colors,
      windowColor: '#87CEEB',
      wheelColor: '#222222',
      // Autonomous car specific options
      drivingMode: isAutonomous ? TerrainDrivingMode.EXPLORATION : undefined,
      explorationRadius: isAutonomous ? 200 + Math.random() * 100 : undefined,
      showDebugInfo: false,
    });
  }

  return cars;
}
