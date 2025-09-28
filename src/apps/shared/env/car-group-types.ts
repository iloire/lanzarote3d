import * as THREE from 'three';
import { MovementPattern } from '../../../foundation/systems/behaviors/MovingBehavior';
import { TerrainDrivingMode } from '../../../foundation/systems/behaviors/TerrainFollowingBehavior';

/**
 * Configuration for individual cars in a group
 */
export interface CarConfig {
  type: 'Car' | 'AutonomousCar';
  enableMovement?: boolean;
  pattern?: MovementPattern;
  speed?: number;
  radius?: number;
  scale?: number;

  // Movement orientation options
  faceDirection?: boolean;
  forwardAxis?: 'x' | 'z';

  // Car appearance options
  bodyColor?: string;
  roofColor?: string;
  windowColor?: string;
  wheelColor?: string;

  // Autonomous car specific options
  drivingMode?: TerrainDrivingMode;
  explorationRadius?: number;
  maxSlope?: number;
  heightOffset?: number;
  showDebugInfo?: boolean;
}

/**
 * Configuration for car group positioning and behavior
 */
export interface CarGroupConfig {
  center: THREE.Vector3;           // Center position for the group
  formation: 'circle' | 'line' | 'grid' | 'random' | 'parking' | 'convoy';
  spacing: number;                 // Minimum distance between cars
  groupRadius?: number;            // Overall size of the group (for circle/random)
  rowCount?: number;              // For grid/parking formation
  colCount?: number;              // For grid/parking formation
  lineDirection?: THREE.Vector3;   // Direction for line/convoy formation
  terrain?: THREE.Mesh;           // Terrain mesh for height calculation and navigation
}

/**
 * Preset car group configurations
 */
export interface CarGroupPresets {
  parking: {
    small: { count: number; spacing: number; radius: number };
    medium: { count: number; spacing: number; radius: number };
    large: { count: number; spacing: number; radius: number };
  };
  convoy: {
    small: { count: number; spacing: number };
    medium: { count: number; spacing: number };
    large: { count: number; spacing: number };
  };
  patrol: {
    single: { count: number; spacing: number };
    team: { count: number; spacing: number };
    fleet: { count: number; spacing: number };
  };
  traffic: {
    light: { count: number; spacing: number };
    moderate: { count: number; spacing: number };
    heavy: { count: number; spacing: number };
  };
}

/**
 * Default preset configurations for car groups
 */
export const CAR_GROUP_PRESETS: CarGroupPresets = {
  parking: {
    small: { count: 4, spacing: 25, radius: 60 },
    medium: { count: 8, spacing: 25, radius: 80 },
    large: { count: 12, spacing: 25, radius: 120 }
  },
  convoy: {
    small: { count: 3, spacing: 40 },
    medium: { count: 5, spacing: 35 },
    large: { count: 8, spacing: 30 }
  },
  patrol: {
    single: { count: 1, spacing: 0 },
    team: { count: 2, spacing: 50 },
    fleet: { count: 4, spacing: 60 }
  },
  traffic: {
    light: { count: 3, spacing: 60 },
    moderate: { count: 6, spacing: 45 },
    heavy: { count: 10, spacing: 30 }
  }
};

/**
 * Car type weights for realistic distribution
 */
export interface CarTypeWeights {
  [carType: string]: number;
}

/**
 * Default weights for car types (higher = more common)
 */
export const DEFAULT_CAR_WEIGHTS: CarTypeWeights = {
  'Car': 4,           // Most common - regular cars
  'AutonomousCar': 1  // Less common - autonomous vehicles
};

/**
 * Common car color palettes
 */
export const CAR_COLOR_PALETTES = {
  standard: [
    { bodyColor: '#FFFFFF', roofColor: '#E0E0E0' }, // White
    { bodyColor: '#000000', roofColor: '#1A1A1A' }, // Black
    { bodyColor: '#C0C0C0', roofColor: '#A0A0A0' }, // Silver
    { bodyColor: '#800000', roofColor: '#600000' }, // Maroon
    { bodyColor: '#000080', roofColor: '#000060' }, // Navy
  ],
  vibrant: [
    { bodyColor: '#FF0000', roofColor: '#CC0000' }, // Red
    { bodyColor: '#0000FF', roofColor: '#0000CC' }, // Blue
    { bodyColor: '#00FF00', roofColor: '#00CC00' }, // Green
    { bodyColor: '#FFFF00', roofColor: '#CCCC00' }, // Yellow
    { bodyColor: '#FF00FF', roofColor: '#CC00CC' }, // Magenta
  ],
  professional: [
    { bodyColor: '#2F4F4F', roofColor: '#1C3030' }, // Dark Slate Gray
    { bodyColor: '#483D8B', roofColor: '#362A66' }, // Dark Slate Blue
    { bodyColor: '#556B2F', roofColor: '#3D4F21' }, // Dark Olive Green
    { bodyColor: '#8B4513', roofColor: '#633018' }, // Saddle Brown
    { bodyColor: '#2E8B57', roofColor: '#1F5F3F' }, // Sea Green
  ]
};