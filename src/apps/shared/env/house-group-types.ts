import * as THREE from 'three';
import { HouseType } from '../../../foundation/components/scenery/buildings/House';

/**
 * Configuration for individual houses in a neighborhood
 */
export interface HouseConfig {
  type: 'House' | 'Villa' | 'Townhouse' | 'Barn' | 'DesertHouse' | 'DesertHouseWithPool';
  houseType?: HouseType; // For House component only
  scale?: number;
  includePool?: boolean; // Random chance if not specified
  colors?: { [key: string]: string }; // House-specific color overrides
  rotation?: number; // Optional specific rotation, otherwise random
  landPlot?: {
    width: number;
    depth: number;
    color?: string;
  };
}

/**
 * Configuration for house group positioning in neighborhoods
 */
export interface HouseGroupConfig {
  center: THREE.Vector3; // Center position for the neighborhood
  formation: 'street' | 'cul-de-sac' | 'grid' | 'suburban' | 'rural' | 'random';
  spacing: number; // Minimum distance between houses
  neighborhoodSize?: number; // Overall size of the neighborhood
  streetWidth?: number; // Width of streets for street formations
  rowCount?: number; // For grid formation
  colCount?: number; // For grid formation
  randomVariation?: number; // Amount of random positioning variation (0-1)
}

/**
 * Neighborhood style presets
 */
export interface NeighborhoodPresets {
  suburban: {
    small: { count: number; spacing: number; size: number };
    medium: { count: number; spacing: number; size: number };
    large: { count: number; spacing: number; size: number };
  };
  urban: {
    compact: { count: number; spacing: number; size: number };
    dense: { count: number; spacing: number; size: number };
    downtown: { count: number; spacing: number; size: number };
  };
  rural: {
    farmstead: { count: number; spacing: number; size: number };
    village: { count: number; spacing: number; size: number };
    scattered: { count: number; spacing: number; size: number };
  };
}

/**
 * Default neighborhood preset configurations
 */
export const NEIGHBORHOOD_PRESETS: NeighborhoodPresets = {
  suburban: {
    small: { count: 8, spacing: 80, size: 200 },
    medium: { count: 15, spacing: 90, size: 300 },
    large: { count: 25, spacing: 100, size: 400 },
  },
  urban: {
    compact: { count: 12, spacing: 60, size: 250 },
    dense: { count: 20, spacing: 50, size: 300 },
    downtown: { count: 30, spacing: 45, size: 350 },
  },
  rural: {
    farmstead: { count: 5, spacing: 150, size: 400 },
    village: { count: 10, spacing: 120, size: 350 },
    scattered: { count: 6, spacing: 200, size: 500 },
  },
};

/**
 * Random variation settings for neighborhood generation
 */
export interface NeighborhoodVariation {
  poolChance: number; // 0-1 probability of adding pools to eligible houses
  colorVariation: boolean; // Whether to apply random color variations
  scaleVariation: number; // Amount of scale variation (0-1)
  rotationVariation: boolean; // Whether to apply random rotations
}

/**
 * Default variation settings
 */
export const DEFAULT_VARIATION: NeighborhoodVariation = {
  poolChance: 0.3, // 30% chance of pools
  colorVariation: true,
  scaleVariation: 0.2, // ±20% scale variation
  rotationVariation: true,
};