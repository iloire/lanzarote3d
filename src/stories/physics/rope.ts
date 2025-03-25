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

  // Get the sphere radius (assuming bodyB's first shape is a sphere)
  const sphereShape = bodyB.shapes[0] as CANNON.Sphere;
  const radius = sphereShape.radius;

  // Create a rope for each attachment point
  attachmentPoints.forEach((point, index) => {
    // Create a local attachment point for bodyA (the platform)
    // Set y to -halfExtents.y to attach at the bottom of the platform
    const shape = bodyA.shapes[0] as CANNON.Box;
    const localPointA = new CANNON.Vec3(point.x, -shape.halfExtents.y, point.z);

    // Create distributed attachment points on the sphere using a tetrahedral pattern
    // This provides maximum stability by spreading attachment points in different directions

    // Phi angle from center to attachment point (0.6 is a good value, about 34 degrees from vertical)
    const phi = 0.6;

    // Calculate sphere attachment point based on the index (spread points around the sphere)
    let localPointB: CANNON.Vec3;

    if (attachmentPoints.length <= 1) {
      // If there's only one attachment point, put it on top
      localPointB = new CANNON.Vec3(0, radius, 0);
    } else if (attachmentPoints.length === 2) {
      // For two points, put them at opposite sides (top and bottom)
      localPointB = index === 0
        ? new CANNON.Vec3(0, radius, 0)  // top
        : new CANNON.Vec3(0, -radius, 0); // bottom
    } else if (attachmentPoints.length === 3) {
      // For three points, use a tripod formation (120 degrees apart)
      const theta = (index * Math.PI * 2 / 3);
      // Use a slight upward bias for more stability (0.3 keeps points in upper hemisphere)
      localPointB = new CANNON.Vec3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * 0.3, // Slight upward bias
        radius * Math.sin(phi) * Math.sin(theta)
      );
    } else {
      // For four or more points, use tetrahedral formation for maximum stability
      // This places points in a pattern similar to the vertices of a tetrahedron
      switch (index % 4) {
        case 0: // Upper point
          localPointB = new CANNON.Vec3(0, radius * 0.8, 0);
          break;
        case 1: // Lower front point
          localPointB = new CANNON.Vec3(radius * 0.8, -radius * 0.4, 0);
          break;
        case 2: // Lower left point
          localPointB = new CANNON.Vec3(-radius * 0.4, -radius * 0.4, radius * 0.7);
          break;
        case 3: // Lower right point
          localPointB = new CANNON.Vec3(-radius * 0.4, -radius * 0.4, -radius * 0.7);
          break;
        default:
          // Fallback (shouldn't happen)
          localPointB = new CANNON.Vec3(0, radius, 0);
      }
    }

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
      localPointB  // Distributed attachment point on the sphere
    );

    ropes.push(rope);
  });

  return ropes;
} 