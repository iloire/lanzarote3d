import * as THREE from 'three';

/**
 * Configuration for individual houses in a neighborhood
 */
export interface HouseConfig {
  type: 'House' | 'Villa' | 'Townhouse' | 'Barn' | 'DesertHouse' | 'DesertHouseWithPool';
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
  formation: 'street' | 'grid' | 'suburban' | 'rural' | 'random';
  spacing: number; // Minimum distance between houses
  neighborhoodSize?: number; // Overall size of the neighborhood
  randomVariation?: number; // Amount of random positioning variation (0-1)
}

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
