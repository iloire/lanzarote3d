import * as CANNON from "cannon-es";
import * as THREE from "three";

// Constants for force application
export const PUSH_FORCE_MAGNITUDE = 800; // Strength of push when keys are pressed

// Key mappings for controls
export const KEY_MAPPING = {
  RESET_POSITION: ['KeyX'],          // X: Reset positions
  PLATFORM_LEFT: ['KeyQ'],           // Q: Move platform left
  PLATFORM_RIGHT: ['KeyE'],          // E: Move platform right
  PLATFORM_UP: ['KeyW'],            // W: Move platform up
  PLATFORM_DOWN: ['KeyS'],          // S: Move platform down
};

// Helper function to check if an array contains a value (compatible with older JS)
export function arrayIncludes(array: string[], value: string): boolean {
  return array.indexOf(value) !== -1;
}

// Helper function to create a physics world with good defaults
export function createPhysicsWorld(): CANNON.World {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  // Add stability settings
  // @ts-ignore - CANNON.js typings might not include all solver properties
  world.solver.iterations = 10;  // Default is usually 10, increasing helps with stability
  // @ts-ignore - CANNON.js typings might not include all solver properties
  world.solver.tolerance = 0.001;  // Smaller tolerance for more accurate solutions

  return world;
}


// Physics objects container type
export interface PhysicsObjects {
  bodies: CANNON.Body[];
  constraints: CANNON.PointToPointConstraint[];
  visualMeshes: THREE.Mesh[];
  constraintLines: THREE.Line[];
  initialPositions?: THREE.Vector3[];
  addObjects?: (
    newBodies: CANNON.Body[],
    newConstraints: CANNON.PointToPointConstraint[],
    newMeshes: THREE.Mesh[],
    newLines: THREE.Line[]
  ) => void;
} 