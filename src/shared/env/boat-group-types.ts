import * as THREE from 'three';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';

/**
 * Configuration for individual boats in a group
 */
export interface BoatConfig {
  type: 'SmallSailBoat' | 'FishingBoat' | 'Yacht' | 'SpeedBoat';
  enableMovement?: boolean;
  pattern?: MovementPattern;
  speed?: number;
  radius?: number;
  scale?: number;
  /** Rotation about Y; a boat at 0 points its bow north (−z). Random when left out. */
  heading?: number;
}

/** A berth: where a moored boat lies and which way its bow points */
export interface Berth {
  position: THREE.Vector3;
  heading: number;
}

/**
 * Configuration for boat group positioning
 */
export interface BoatGroupConfig {
  center: THREE.Vector3; // Center position for the group
  formation: 'circle' | 'random';
  spacing: number; // Minimum distance between boats
  groupRadius?: number; // Overall size of the group (for circle/random)
}
