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
  platformBody: CANNON.Body;
  sphereBody: CANNON.Body;
  animate: () => void;
  cleanup: () => void;
}


/**
 * Create platform and sphere bodies for the basic simulation
 */
export function createBasicPhysicsObjects(
  scene: THREE.Scene,
  world: CANNON.World
): {
  physicsObjects: PhysicsObjects;
  platformBody: CANNON.Body;
  sphereBody: CANNON.Body;
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
  const platformWidth = 12;
  const platformHeight = 1;
  const platformDepth = 4;
  const platformPos = new THREE.Vector3(0, 10, 0);

  const platformShape = new CANNON.Box(new CANNON.Vec3(
    platformWidth / 2,
    platformHeight / 2,
    platformDepth / 2
  ));

  const platformBody = new CANNON.Body({
    mass: 3, // Small mass instead of static
    position: new CANNON.Vec3(platformPos.x, platformPos.y, platformPos.z),
    shape: platformShape,
    type: CANNON.Body.DYNAMIC,
    linearDamping: 0.5,
    angularDamping: 0.5
  });

  world.addBody(platformBody);

  // Create visualization for platform
  const platformMesh = createBoxVisualization(
    scene,
    new CANNON.Vec3(platformWidth / 2, platformHeight / 2, platformDepth / 2),
    platformPos,
    0xff0000, // Red for platform
    "Platform"
  );

  // Add platform to objects
  physicsObjects.bodies.push(platformBody);
  physicsObjects.visualMeshes.push(platformMesh);

  // Create a single sphere below the platform
  const sphereRadius = 1.5;
  const ropeLength = 24;
  const spherePos = new THREE.Vector3(platformPos.x, platformPos.y - ropeLength, platformPos.z);
  const sphereShape = new CANNON.Sphere(sphereRadius);

  const sphereBody = new CANNON.Body({
    mass: 150, // Default heavy sphere
    position: new CANNON.Vec3(spherePos.x, spherePos.y, spherePos.z),
    shape: sphereShape,
    linearDamping: 0.7,
    angularDamping: 0.7
  });
  world.addBody(sphereBody);

  // Create visualization for the sphere
  const sphereMesh = createSphereVisualization(
    scene,
    sphereRadius,
    spherePos,
    0x0088ff, // Blue for the main sphere
    "Sphere"
  );

  // Add sphere to objects
  physicsObjects.bodies.push(sphereBody);
  physicsObjects.visualMeshes.push(sphereMesh);

  return { physicsObjects, platformBody, sphereBody };
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
          positionAttribute.setXYZ(
            0,
            bodyA.position.x + constraint.pivotA.x,
            bodyA.position.y + constraint.pivotA.y,
            bodyA.position.z + constraint.pivotA.z
          );

          positionAttribute.setXYZ(
            1,
            bodyB.position.x + constraint.pivotB.x,
            bodyB.position.y + constraint.pivotB.y,
            bodyB.position.z + constraint.pivotB.z
          );

          positionAttribute.needsUpdate = true;
        }
      }
    }
  });
} 