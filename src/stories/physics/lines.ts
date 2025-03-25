import * as CANNON from "cannon-es";
import * as THREE from "three";
import { createLineVisualization, createSphereVisualization } from "./visualization";

/**
 * Creates a line that connects two bodies with a series of segments and constraints
 */
export function createLine(
  world: CANNON.World,
  scene: THREE.Scene,
  bodyA: CANNON.Body,
  bodyB: CANNON.Body,
  numSegments: number = 8,
  lineThickness: number = 0.15,
  lineColor: number = 0xcccccc,
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

  // Calculate world positions for line endpoints
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

  // Create line segments
  for (let i = 0; i < numSegments; i++) {
    // Calculate position for this segment
    const segmentPos = new THREE.Vector3(
      startPos.x + direction.x * segmentLength * (i + 1),
      startPos.y + direction.y * segmentLength * (i + 1),
      startPos.z + direction.z * segmentLength * (i + 1)
    );

    // Calculate mass based on position to create progressive mass distribution
    // Segments closer to the pilot have less mass, creating a more stable system
    // This makes the line act more like a real paraglider line with progressive tension
    const progressiveMassFactor = i / numSegments; // 0 near glider, 1 near pilot
    const segmentMass = 0.05 * (1 - progressiveMassFactor) + 0.01 * progressiveMassFactor;

    // Create physics body for segment
    const segmentBody = new CANNON.Body({
      mass: segmentMass, // Lighter segments for better stability
      position: new CANNON.Vec3(segmentPos.x, segmentPos.y, segmentPos.z),
      shape: new CANNON.Sphere(lineThickness),
      linearDamping: 0.9, // Higher damping to reduce oscillation
      angularDamping: 0.9, // Higher damping to reduce spinning
      fixedRotation: true // Prevent segments from rotating, which increases stability
    });

    // Add physics body to world
    world.addBody(segmentBody);
    segments.push(segmentBody);

    // Create visualization for this segment
    const segmentMesh = createSphereVisualization(
      scene,
      lineThickness,
      segmentPos,
      lineColor
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

    // Create point-to-point constraint (joint) with increased parameters for stability
    const constraint = new CANNON.PointToPointConstraint(
      constraintBodyA,
      localPivotA,
      constraintBodyB,
      localPivotB,
      30 // Higher constraint force relaxation for more stability
    );

    // Add collide events to increase damping when segments get close to each other
    // This prevents excessive oscillation and entanglement
    segmentBody.addEventListener('collide', (e) => {
      if (e.body === bodyA || e.body === bodyB || segments.some(segment => segment === e.body)) {
        // Temporarily increase damping when segments collide with each other or main bodies
        segmentBody.linearDamping = 0.95;
        setTimeout(() => {
          segmentBody.linearDamping = 0.9;
        }, 500);
      }
    });

    world.addConstraint(constraint);
    constraints.push(constraint);

    // Create visual line for constraint
    const line = createLineVisualization(
      scene,
      new THREE.Vector3().copy(constraintBodyA.position as any),
      new THREE.Vector3().copy(constraintBodyB.position as any),
      lineColor
    );
    constraintLines.push(line);
  }

  // Create the final constraint connecting the last segment to bodyB
  const finalConstraint = new CANNON.PointToPointConstraint(
    segments[segments.length - 1],
    new CANNON.Vec3(0, 0, 0),
    bodyB,
    localPointB, // Use the specified attachment point for bodyB
    20 // Slightly lower constraint force for the pilot attachment to allow some movement
  );

  world.addConstraint(finalConstraint);
  constraints.push(finalConstraint);

  // Create visual line for the final constraint
  const finalLine = createLineVisualization(
    scene,
    new THREE.Vector3().copy(segments[segments.length - 1].position as any),
    new THREE.Vector3().copy(bodyB.position as any),
    lineColor
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
 * Creates multiple lines connecting two bodies
 */
export function createLines(
  world: CANNON.World,
  scene: THREE.Scene,
  bodyA: CANNON.Body,
  bodyB: CANNON.Body,
  attachmentPoints: { x: number, z: number }[],
  lineOptions: {
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
  const lines: {
    segments: CANNON.Body[],
    constraints: CANNON.PointToPointConstraint[],
    visualMeshes: THREE.Mesh[],
    constraintLines: THREE.Line[]
  }[] = [];

  // Default options
  const numSegments = lineOptions.numSegments || 8;
  const thickness = lineOptions.thickness || 0.15;

  // Default colors if not provided
  const defaultColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
  const colors = lineOptions.colors || defaultColors;

  // Get the sphere radius (assuming bodyB's first shape is a sphere)
  const sphereShape = bodyB.shapes[0] as CANNON.Sphere;
  const radius = sphereShape.radius;

  // Create a line for each attachment point
  attachmentPoints.forEach((point, index) => {
    // Create a local attachment point for bodyA (the platform)
    // Set y to -halfExtents.y to attach at the bottom of the platform
    const shape = bodyA.shapes[0] as CANNON.Box;
    const localPointA = new CANNON.Vec3(point.x, -shape.halfExtents.y, point.z);

    // Create optimized distributed attachment points on the sphere using an enhanced tetrahedral pattern
    // This provides maximum stability by spreading attachment points more evenly

    // Calculate sphere attachment point based on the index and number of points
    let localPointB: CANNON.Vec3;

    // Determine the ideal distribution based on the number of attachment points
    const attachmentCount = attachmentPoints.length;

    if (attachmentCount === 1) {
      // With a single line, attach at the top of the sphere
      localPointB = new CANNON.Vec3(0, radius, 0);
    }
    else if (attachmentCount === 2) {
      // For two points, position at upper front and upper back (slightly below top)
      // This creates a natural forward/back balance
      const theta = index === 0 ? 0 : Math.PI;
      localPointB = new CANNON.Vec3(
        radius * 0.3 * Math.cos(theta),
        radius * 0.9,
        radius * 0.3 * Math.sin(theta)
      );
    }
    else if (attachmentCount === 3) {
      // For three points, create a tripod formation angled from above center
      // This forms a stable triangular support system
      const theta = (index * Math.PI * 2 / 3);
      localPointB = new CANNON.Vec3(
        radius * 0.5 * Math.cos(theta),
        radius * 0.7, // Higher center point for stability
        radius * 0.5 * Math.sin(theta)
      );
    }
    else if (attachmentCount === 4) {
      // For four points, use optimized tetrahedron vertices for maximum stability
      // This is the ideal configuration for a 4-line system
      switch (index) {
        case 0: // Front upper position
          localPointB = new CANNON.Vec3(radius * 0.7, radius * 0.5, 0);
          break;
        case 1: // Back upper position
          localPointB = new CANNON.Vec3(-radius * 0.7, radius * 0.5, 0);
          break;
        case 2: // Left side position
          localPointB = new CANNON.Vec3(0, radius * 0.5, radius * 0.7);
          break;
        case 3: // Right side position
          localPointB = new CANNON.Vec3(0, radius * 0.5, -radius * 0.7);
          break;
      }
    }
    else {
      // For more than 4 lines, distribute in a balanced pattern around center of mass
      // This creates an even force distribution regardless of pull direction

      // Calculate even distribution around the sphere
      const isEvenCount = attachmentCount % 2 === 0;
      const upperCount = Math.ceil(attachmentCount / 2);
      const lowerCount = attachmentCount - upperCount;

      if (index < upperCount) {
        // Upper attachment points distributed evenly around upper hemisphere
        const theta = (index * (2 * Math.PI) / upperCount);
        const phi = 0.3; // Upper hemisphere angle (radians)

        localPointB = new CANNON.Vec3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
      } else {
        // Lower attachment points distributed evenly around middle hemisphere
        const lowerIndex = index - upperCount;
        const theta = (lowerIndex * (2 * Math.PI) / lowerCount) + (isEvenCount ? 0 : Math.PI / lowerCount);
        const phi = Math.PI / 2.5; // Middle-lower hemisphere angle (radians)

        localPointB = new CANNON.Vec3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
      }
    }

    // Create the line with the color for this index (cycling if needed)
    const color = colors[index % colors.length];

    const line = createLine(
      world,
      scene,
      bodyA,       // Use the actual bodyA (platform)
      bodyB,       // Use bodyB (sphere)
      numSegments,
      thickness,
      color,
      localPointA, // Pass the local attachment point for bodyA
      localPointB  // Optimized attachment point on the sphere
    );

    lines.push(line);
  });

  return lines;
} 