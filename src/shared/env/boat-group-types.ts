import * as THREE from 'three';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';

/**
 * Configuration for individual boats in a group
 */
export interface BoatConfig {
  type: 'SmallSailBoat' | 'FishingBoat' | 'Yacht' | 'SpeedBoat' | 'PatrolBoat';
  enableMovement?: boolean;
  pattern?: MovementPattern;
  speed?: number;
  radius?: number;
  scale?: number;
  colors?: { [key: string]: string }; // Boat-specific color overrides
}

/**
 * Configuration for boat group positioning
 */
export interface BoatGroupConfig {
  center: THREE.Vector3; // Center position for the group
  formation: 'circle' | 'line' | 'grid' | 'random' | 'harbor';
  spacing: number; // Minimum distance between boats
  groupRadius?: number; // Overall size of the group (for circle/random)
  rowCount?: number; // For grid formation
  colCount?: number; // For grid formation
  lineDirection?: THREE.Vector3; // Direction for line formation
}

/**
 * Preset boat group configurations
 */
export interface BoatGroupPresets {
  marina: {
    small: { count: number; spacing: number; radius: number };
    medium: { count: number; spacing: number; radius: number };
    large: { count: number; spacing: number; radius: number };
  };
  patrol: {
    single: { count: number; spacing: number };
    formation: { count: number; spacing: number };
    fleet: { count: number; spacing: number };
  };
  racing: {
    small: { count: number; spacing: number };
    medium: { count: number; spacing: number };
    large: { count: number; spacing: number };
  };
}

/**
 * Default preset configurations
 */
export const BOAT_GROUP_PRESETS: BoatGroupPresets = {
  marina: {
    small: { count: 6, spacing: 40, radius: 80 },
    medium: { count: 10, spacing: 50, radius: 120 },
    large: { count: 15, spacing: 60, radius: 180 },
  },
  patrol: {
    single: { count: 1, spacing: 0 },
    formation: { count: 3, spacing: 80 },
    fleet: { count: 5, spacing: 100 },
  },
  racing: {
    small: { count: 4, spacing: 30 },
    medium: { count: 8, spacing: 35 },
    large: { count: 12, spacing: 40 },
  },
};
