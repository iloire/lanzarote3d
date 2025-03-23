import * as CANNON from "cannon-es";
import * as THREE from "three";
import { createLineVisualization, createSphereVisualization } from "./visualization";

/**
 * Creates a rope that connects two bodies with a series of segments and constraints
 */
export function createRope(
  world: CANNON.World,
  scene: THREE.Scene,
  bodyA: CANNON.Body,
  bodyB: CANNON.Body,
  numSegments: number = 8,
  ropeThickness: number = 0.15,
  ropeColor: number = 0xcccccc,
  localPointA: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0),
  localPointB: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0)
): {
  segments: CANNON.Body[],
  constraints: CANNON.PointToPointConstraint[],
  visualMeshes: THREE.Mesh[],
  constraintLines: THREE.Line[]
} {
  // Arrays to store the physics objects and visual elements
  const segments: CANNON.Body[] = [];
  const constraints: CANNON.PointToPointConstraint[] = [];
  const visualMeshes: THREE.Mesh[] = [];
  const constraintLines: THREE.Line[] = [];

  // Calculate world positions for rope endpoints
  const worldPointA = new CANNON.Vec3();
  bodyA.pointToWorldFrame(localPointA, worldPointA);

  const worldPointB = new CANNON.Vec3();
  bodyB.pointToWorldFrame(localPointB, worldPointB);

  // Convert to THREE.Vector3 for calculations
  const startPos = new THREE.Vector3(worldPointA.x, worldPointA.y, worldPointA.z);
  const endPos = new THREE.Vector3(worldPointB.x, worldPointB.y, worldPointB.z);
  const direction = new THREE.Vector3().subVectors(endPos, startPos);
  const segmentLength = direction.length() / (numSegments + 1);

  // Normalize direction
  direction.normalize();

  // Create rope segments
  for (let i = 0; i < numSegments; i++) {
    // Calculate position for this segment
    const segmentPos = new THREE.Vector3(
      startPos.x + direction.x * segmentLength * (i + 1),
      startPos.y + direction.y * segmentLength * (i + 1),
      startPos.z + direction.z * segmentLength * (i + 1)
    );

    // Create physics body for segment
    const segmentBody = new CANNON.Body({
      mass: 0.1, // Light segments
      position: new CANNON.Vec3(segmentPos.x, segmentPos.y, segmentPos.z),
      shape: new CANNON.Sphere(ropeThickness),
      linearDamping: 0.7, // Damping to prevent excessive oscillation
      angularDamping: 0.7
    });

    // Add physics body to world
    world.addBody(segmentBody);
    segments.push(segmentBody);

    // Create visualization for this segment
    const segmentMesh = createSphereVisualization(
      scene,
      ropeThickness,
      segmentPos,
      ropeColor
    );
    visualMeshes.push(segmentMesh);

    // Create constraints
    let constraintBodyA: CANNON.Body;
    let constraintBodyB: CANNON.Body;
    let localPivotA: CANNON.Vec3;
    let localPivotB: CANNON.Vec3;

    if (i === 0) {
      // First segment connects to bodyA
      constraintBodyA = bodyA;
      constraintBodyB = segmentBody;
      localPivotA = localPointA.clone(); // Use the specified attachment point
      localPivotB = new CANNON.Vec3(0, 0, 0);
    } else {
      // Other segments connect to previous segment
      constraintBodyA = segments[i - 1];
      constraintBodyB = segmentBody;
      localPivotA = new CANNON.Vec3(0, 0, 0);
      localPivotB = new CANNON.Vec3(0, 0, 0);
    }

    // Create point-to-point constraint (joint)
    const constraint = new CANNON.PointToPointConstraint(
      constraintBodyA,
      localPivotA,
      constraintBodyB,
      localPivotB
    );

    world.addConstraint(constraint);
    constraints.push(constraint);

    // Create visual line for constraint
    const line = createLineVisualization(
      scene,
      new THREE.Vector3().copy(constraintBodyA.position as any),
      new THREE.Vector3().copy(constraintBodyB.position as any),
      ropeColor
    );
    constraintLines.push(line);
  }

  // Create the final constraint connecting the last segment to bodyB
  const finalConstraint = new CANNON.PointToPointConstraint(
    segments[segments.length - 1],
    new CANNON.Vec3(0, 0, 0),
    bodyB,
    localPointB // Use the specified attachment point for bodyB
  );

  world.addConstraint(finalConstraint);
  constraints.push(finalConstraint);

  // Create visual line for the final constraint
  const finalLine = createLineVisualization(
    scene,
    new THREE.Vector3().copy(segments[segments.length - 1].position as any),
    new THREE.Vector3().copy(bodyB.position as any),
    ropeColor
  );
  constraintLines.push(finalLine);

  return {
    segments,
    constraints,
    visualMeshes,
    constraintLines
  };
}

/**
 * Creates multiple ropes connecting two bodies
 */
export function createRopes(
  world: CANNON.World,
  scene: THREE.Scene,
  bodyA: CANNON.Body,
  bodyB: CANNON.Body,
  attachmentPoints: { x: number, z: number }[],
  ropeOptions: {
    numSegments?: number,
    thickness?: number,
    colors?: number[]
  } = {}
): {
  segments: CANNON.Body[],
  constraints: CANNON.PointToPointConstraint[],
  visualMeshes: THREE.Mesh[],
  constraintLines: THREE.Line[]
}[] {
  const ropes: {
    segments: CANNON.Body[],
    constraints: CANNON.PointToPointConstraint[],
    visualMeshes: THREE.Mesh[],
    constraintLines: THREE.Line[]
  }[] = [];

  // Default options
  const numSegments = ropeOptions.numSegments || 8;
  const thickness = ropeOptions.thickness || 0.15;

  // Default colors if not provided
  const defaultColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
  const colors = ropeOptions.colors || defaultColors;

  // Create a rope for each attachment point
  attachmentPoints.forEach((point, index) => {
    // Create a local attachment point for bodyA (the platform)
    // Set y to -halfExtents.y to attach at the bottom of the platform
    const shape = bodyA.shapes[0] as CANNON.Box;
    const localPointA = new CANNON.Vec3(point.x, -shape.halfExtents.y, point.z);

    // Create the rope with the color for this index (cycling if needed)
    const color = colors[index % colors.length];

    const rope = createRope(
      world,
      scene,
      bodyA,       // Use the actual bodyA (platform)
      bodyB,       // Use bodyB (sphere)
      numSegments,
      thickness,
      color,
      localPointA, // Pass the local attachment point for bodyA
      new CANNON.Vec3(0, 0, 0) // Center of the sphere
    );

    ropes.push(rope);
  });

  return ropes;
} 