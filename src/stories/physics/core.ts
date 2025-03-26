import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PhysicsObjects } from "./helpers";
import { createBoxVisualization, createSphereVisualization } from "./visualization";

/**
 * Interface for the basic physics scene setup
 */
export interface PhysicsScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  world: CANNON.World;
  physicsObjects: PhysicsObjects;
  gliderBody: CANNON.Body;
  pilotBody: CANNON.Body;
  animate: () => void;
  cleanup: () => void;
}


/**
 * Create platform and sphere bodies for the basic simulation
 */
export function createBasicPhysicsObjects(
  scene: THREE.Scene,
  world: CANNON.World,
  initialPosition: THREE.Vector3
): {
  physicsObjects: PhysicsObjects;
  gliderBody: CANNON.Body;
  pilotBody: CANNON.Body;
} {
  // Create container for physics objects
  const physicsObjects: PhysicsObjects = {
    bodies: [],
    constraints: [],
    visualMeshes: [],
    constraintLines: [],
    initialPositions: [],
    addObjects: (
      newBodies: CANNON.Body[],
      newConstraints: CANNON.PointToPointConstraint[],
      newMeshes: THREE.Mesh[],
      newLines: THREE.Line[]
    ) => {
      physicsObjects.bodies = [...physicsObjects.bodies, ...newBodies];
      physicsObjects.constraints = [...physicsObjects.constraints, ...newConstraints];
      physicsObjects.visualMeshes = [...physicsObjects.visualMeshes, ...newMeshes];
      physicsObjects.constraintLines = [...physicsObjects.constraintLines, ...newLines];
    }
  };

  // Create rectangular platform (anchor)
  const gliderWidth = 12;
  const gliderHeight = 1;
  const gliderDepth = 12;
  const gliderPos = new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z);

  const gliderShape = new CANNON.Box(new CANNON.Vec3(
    gliderWidth / 2,
    gliderHeight / 2,
    gliderDepth / 2
  ));

  const gliderBody = new CANNON.Body({
    mass: 5, // Reduced mass for better stability (real paragliders are very light)
    position: new CANNON.Vec3(gliderPos.x, gliderPos.y, gliderPos.z),
    shape: gliderShape,
    type: CANNON.Body.DYNAMIC,
    linearDamping: 0.6, // Higher damping to reduce oscillation
    angularDamping: 0.8, // Higher damping to reduce rotation wobble
    fixedRotation: false, // Allow rotation for natural behavior
    material: new CANNON.Material("gliderMaterial")
  });

  // Set material properties
  gliderBody.material.friction = 0.2;
  gliderBody.material.restitution = 0.1;

  world.addBody(gliderBody);

  // Create visualization for platform
  const gliderMesh = createBoxVisualization(
    scene,
    new CANNON.Vec3(gliderWidth / 2, gliderHeight / 2, gliderDepth / 2),
    gliderPos,
    0xff0000, // Red for platform
    "Glider"
  );

  // Add platform to objects
  physicsObjects.bodies.push(gliderBody);
  physicsObjects.visualMeshes.push(gliderMesh);

  // Create a single sphere below the platform
  const sphereRadius = 1.5;
  const ropeLength = 20; // Shorter lines for better stability
  const spherePilotPos = new THREE.Vector3(gliderPos.x, gliderPos.y - ropeLength, gliderPos.z);
  const spherePilotShape = new CANNON.Sphere(sphereRadius);

  const pilotBody = new CANNON.Body({
    mass: 70, // Slightly lighter mass (realistic human weight)
    position: new CANNON.Vec3(spherePilotPos.x, spherePilotPos.y, spherePilotPos.z),
    shape: spherePilotShape,
    linearDamping: 0.8, // Higher damping to reduce swinging
    angularDamping: 0.9, // Higher damping to reduce spinning
    allowSleep: true, // Allow sleep for optimization
    material: new CANNON.Material("pilotMaterial")
  });

  // Set material properties
  pilotBody.material.friction = 0.3;
  pilotBody.material.restitution = 0.05;

  world.addBody(pilotBody);

  // Create visualization for the sphere
  const pilotMesh = createSphereVisualization(
    scene,
    sphereRadius,
    spherePilotPos,
    0x0088ff, // Blue for the main sphere
    "Sphere"
  );

  // Add sphere to objects
  physicsObjects.bodies.push(pilotBody);
  physicsObjects.visualMeshes.push(pilotMesh);

  return { physicsObjects, gliderBody, pilotBody };
}

/**
 * Update the visuals to match physics
 */
export function updateVisuals(physicsObjects: PhysicsObjects): void {
  // Update bodies and their meshes
  physicsObjects.bodies.forEach((body, i) => {
    const mesh = physicsObjects.visualMeshes[i];
    if (mesh) {
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    }
  });

  // Update lines for constraints
  physicsObjects.constraints.forEach((constraint, i) => {
    const line = physicsObjects.constraintLines[i];
    if (line) {
      const positionAttribute = line.geometry.attributes.position;

      if (positionAttribute instanceof THREE.BufferAttribute) {
        const bodyA = constraint.bodyA;
        const bodyB = constraint.bodyB;

        if (bodyA && bodyB) {
          // Calculate world positions for constraint endpoints
          const worldPointA = new CANNON.Vec3();
          bodyA.pointToWorldFrame(constraint.pivotA, worldPointA);

          const worldPointB = new CANNON.Vec3();
          bodyB.pointToWorldFrame(constraint.pivotB, worldPointB);

          // Update the line geometry to connect the actual attachment points
          positionAttribute.setXYZ(0, worldPointA.x, worldPointA.y, worldPointA.z);
          positionAttribute.setXYZ(1, worldPointB.x, worldPointB.y, worldPointB.z);
          positionAttribute.needsUpdate = true;
        }
      }
    }
  });
}
