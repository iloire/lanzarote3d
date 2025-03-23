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
  ropeColor: number = 0xcccccc
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

  // Calculations for the rope
  const startPos = new THREE.Vector3().copy(bodyA.position as any);
  const endPos = new THREE.Vector3().copy(bodyB.position as any);
  const direction = new THREE.Vector3().subVectors(endPos, startPos);
  const segmentLength = direction.length() / (numSegments + 1);

  // Normalize direction
  direction.normalize();

  // Create rope segments
  for (let i = 0; i < numSegments; i++) {
    // Calculate position for this segment
    const t = (i + 1) / (numSegments + 1);
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

    if (i === 0) {
      // First segment connects to bodyA
      constraintBodyA = bodyA;
      constraintBodyB = segmentBody;
    } else {
      // Other segments connect to previous segment
      constraintBodyA = segments[i - 1];
      constraintBodyB = segmentBody;
    }

    // Create point-to-point constraint (joint)
    const constraint = new CANNON.PointToPointConstraint(
      constraintBodyA,
      new CANNON.Vec3(0, 0, 0), // Local point in bodyA
      constraintBodyB,
      new CANNON.Vec3(0, 0, 0)  // Local point in bodyB
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
    new CANNON.Vec3(0, 0, 0)
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
    // Create an offset position for the attachment in bodyA
    const localPointA = new CANNON.Vec3(point.x, 0, point.z);

    // Clone bodyA to create a position with the local offset applied
    const offsetBodyA = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3().copy(bodyA.position),
    });

    // Calculate the world position with the offset
    offsetBodyA.position.x += localPointA.x;
    offsetBodyA.position.z += localPointA.z;

    // Create the rope with the color for this index (cycling if needed)
    const color = colors[index % colors.length];

    const rope = createRope(
      world,
      scene,
      offsetBodyA, // Use the offset position instead of the actual bodyA
      bodyB,
      numSegments,
      thickness,
      color
    );

    ropes.push(rope);
  });

  return ropes;
} 