import * as CANNON from "cannon-es";
import * as THREE from "three";

// Constants for force application
export const PUSH_FORCE_MAGNITUDE = 800; // Strength of push when keys are pressed

// Key mappings for controls
export const KEY_MAPPING = {
  RESET_POSITION: ['KeyX'],          // X: Reset positions
  LEFT: ['KeyA'],           // Q: Move platform left
  RIGHT: ['KeyD'],          // E: Move platform right
  UP: ['KeyW'],            // W: Move platform up
  DOWN: ['KeyS'],          // S: Move platform down
};

// Helper function to check if an array contains a value (compatible with older JS)
export function arrayIncludes(array: string[], value: string): boolean {
  return array.indexOf(value) !== -1;
}

// Helper function to create a physics world with good defaults
export function createPhysicsWorld(): CANNON.World {
  const world = new CANNON.World();

  // Set lower gravity for more gradual and stable descent
  // Reduced gravity helps prevent excessive tension on lines
  world.gravity.set(0, -8.0, 0); // Slightly lower than Earth's gravity

  // Improved solver settings for better constraint stability
  // Higher iterations and lower tolerance improve physics accuracy
  // @ts-ignore - CANNON.js typings might not include all solver properties
  world.solver.iterations = 20;  // Increased from default 10 for better stability
  // @ts-ignore - CANNON.js typings might not include all solver properties
  world.solver.tolerance = 0.0001;  // Lower tolerance for more accurate solutions

  // Create contact material to reduce bouncing between objects
  const defaultMaterial = new CANNON.Material("defaultMaterial");
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.3,           // Moderate friction
      restitution: 0.1,        // Low restitution (less bouncy)
      contactEquationStiffness: 1e7,    // High stiffness for less penetration
      contactEquationRelaxation: 3     // Lower relaxation for more stability
    }
  );

  // Add the contact material to the world
  world.addContactMaterial(defaultContactMaterial);
  world.defaultContactMaterial = defaultContactMaterial;

  // Enable continuous collision detection for better stability
  // This helps prevent objects from passing through each other
  world.broadphase = new CANNON.SAPBroadphase(world);

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