import * as THREE from 'three';
import { DEFAULT_VARIATION, NeighborhoodVariation } from '../../shared/env/house-group-types';

/**
 * Neighborhood type definitions
 */
export type NeighborhoodType = 'suburban' | 'urban' | 'rural' | 'cul-de-sac' | 'street' | 'grid' | 'luxury' | 'random';
export type NeighborhoodSize = 'small' | 'medium' | 'large';
export type NeighborhoodDensity = 'compact' | 'dense' | 'downtown';
export type NeighborhoodStyle = 'farmstead' | 'village' | 'scattered';

/**
 * Configuration for a single neighborhood
 */
export interface NeighborhoodConfig {
  name: string;
  center: THREE.Vector3;
  type: NeighborhoodType;
  size?: NeighborhoodSize;
  density?: NeighborhoodDensity;
  style?: NeighborhoodStyle;
  houses?: number;
  variation: NeighborhoodVariation;
}

/**
 * Predefined neighborhood configurations for the town showcase
 * 27 neighborhoods strategically positioned across a 2400x2000 ground area
 */
export const TOWN_NEIGHBORHOODS: NeighborhoodConfig[] = [
  {
    name: 'Suburban District',
    center: new THREE.Vector3(-600, 0, -150),
    type: 'suburban',
    size: 'medium',
    variation: DEFAULT_VARIATION,
  },
  {
    name: 'Urban Center',
    center: new THREE.Vector3(550, 0, -120),
    type: 'urban',
    density: 'dense',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.1 },
  },
  {
    name: 'Cul-de-Sac Community',
    center: new THREE.Vector3(-550, 0, 150),
    type: 'cul-de-sac',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.4 },
  },
  {
    name: 'Luxury Estates',
    center: new THREE.Vector3(600, 0, 180),
    type: 'luxury',
    houses: 6,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.8 },
  },
  {
    name: 'Village Green',
    center: new THREE.Vector3(-200, 0, 80),
    type: 'rural',
    style: 'village',
    houses: 10,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.3 },
  },
  {
    name: 'Industrial District',
    center: new THREE.Vector3(-650, 0, 400),
    type: 'grid',
    houses: 12,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.1 },
  },
  {
    name: 'Riverside Commons',
    center: new THREE.Vector3(200, 0, -350),
    type: 'street',
    houses: 14,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.5 },
  },
  {
    name: 'Farm Community',
    center: new THREE.Vector3(650, 0, 400),
    type: 'rural',
    style: 'farmstead',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.2 },
  },
  {
    name: 'Metro Heights',
    center: new THREE.Vector3(-150, 0, -350),
    type: 'urban',
    density: 'downtown',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.05 },
  },
  // Phase 1: New neighborhood types
  {
    name: 'Tech Campus',
    center: new THREE.Vector3(0, 0, 700),
    type: 'grid',
    houses: 12,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.2 },
  },
  {
    name: 'Historic District',
    center: new THREE.Vector3(-300, 0, -700),
    type: 'street',
    houses: 10,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.6 },
  },
  {
    name: 'Waterfront Villas',
    center: new THREE.Vector3(400, 0, 700),
    type: 'luxury',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.9 },
  },
  {
    name: 'Student Housing',
    center: new THREE.Vector3(0, 0, -700),
    type: 'urban',
    density: 'dense',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.1 },
  },
  // Phase 2: Strategic gap fillers
  {
    name: 'Mountain View Estates',
    center: new THREE.Vector3(-900, 0, -300),
    type: 'rural',
    style: 'scattered',
    houses: 6,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.7 },
  },
  {
    name: 'Commercial District',
    center: new THREE.Vector3(900, 0, -200),
    type: 'grid',
    houses: 15,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.15 },
  },
  {
    name: 'Eco Village',
    center: new THREE.Vector3(-400, 0, 800),
    type: 'rural',
    style: 'village',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.3 },
  },
  {
    name: 'Senior Community',
    center: new THREE.Vector3(300, 0, 500),
    type: 'suburban',
    size: 'small',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.4 },
  },
  // Phase 3: Fill empty spaces within current boundaries
  {
    name: 'Central Plaza',
    center: new THREE.Vector3(0, 0, 300),
    type: 'cul-de-sac',
    houses: 6,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.5 },
  },
  {
    name: 'Midtown Residences',
    center: new THREE.Vector3(100, 0, 100),
    type: 'street',
    houses: 10,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.3 },
  },
  {
    name: 'Artisan Quarter',
    center: new THREE.Vector3(-100, 0, -100),
    type: 'suburban',
    size: 'small',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.6 },
  },
  {
    name: 'East Gardens',
    center: new THREE.Vector3(750, 0, 100),
    type: 'luxury',
    houses: 5,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.8 },
  },
  {
    name: 'Heritage Homes',
    center: new THREE.Vector3(-700, 0, 100),
    type: 'rural',
    style: 'village',
    houses: 7,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.4 },
  },
  {
    name: 'Southside Commons',
    center: new THREE.Vector3(0, 0, -450),
    type: 'grid',
    houses: 9,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.2 },
  },
  {
    name: 'Desert Oaks',
    center: new THREE.Vector3(-300, 0, 300),
    type: 'cul-de-sac',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.4 },
  },
  {
    name: 'Sunrise Estates',
    center: new THREE.Vector3(500, 0, -50),
    type: 'suburban',
    size: 'medium',
    variation: { ...DEFAULT_VARIATION, poolChance: 0.6 },
  },
  {
    name: 'Westside Village',
    center: new THREE.Vector3(-500, 0, -50),
    type: 'street',
    houses: 8,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.3 },
  },
  {
    name: 'Canyon View',
    center: new THREE.Vector3(200, 0, 200),
    type: 'rural',
    style: 'scattered',
    houses: 5,
    variation: { ...DEFAULT_VARIATION, poolChance: 0.7 },
  },
];