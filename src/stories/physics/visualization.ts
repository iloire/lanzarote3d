import * as CANNON from "cannon-es";
import * as THREE from "three";

/**
 * Creates a box visualization mesh for a physics body
 */
export function createBoxVisualization(
  scene: THREE.Scene,
  dimensions: CANNON.Vec3,
  position: THREE.Vector3,
  color: number = 0xffff00,
  label?: string
): THREE.Mesh {
  // Create geometry and material for the box
  const geometry = new THREE.BoxGeometry(
    dimensions.x * 2, // Width
    dimensions.y * 2, // Height
    dimensions.z * 2  // Depth
  );
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.3
  });

  // Create mesh and position it
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Add name for identification
  if (label) {
    mesh.name = label;
  }

  // Add mesh to scene
  scene.add(mesh);

  return mesh;
}

/**
 * Creates a sphere visualization mesh for a physics body
 */
export function createSphereVisualization(
  scene: THREE.Scene,
  radius: number,
  position: THREE.Vector3,
  color: number = 0xffff00,
  label?: string
): THREE.Mesh {
  // Create geometry and material for the sphere
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.3
  });

  // Create mesh and position it
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Add name for identification
  if (label) {
    mesh.name = label;
  }

  // Add mesh to scene
  scene.add(mesh);

  return mesh;
}

/**
 * Creates a line visualization for constraints or connections
 */
export function createLineVisualization(
  scene: THREE.Scene,
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  color: number = 0xffffff
): THREE.Line {
  // Create geometry with two points
  const geometry = new THREE.BufferGeometry();

  // Create positions array for the line
  const positions = new Float32Array([
    startPoint.x, startPoint.y, startPoint.z,
    endPoint.x, endPoint.y, endPoint.z
  ]);

  // Set the positions attribute
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Create line material
  const material = new THREE.LineBasicMaterial({ color: color });

  // Create line and add it to the scene
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return line;
}

/**
 * Updates a line visualization with new start and end points
 */
export function updateLineVisualization(
  line: THREE.Line,
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3
): void {
  const positionAttribute = line.geometry.attributes.position;

  // Ensure we're working with a BufferAttribute
  if (positionAttribute instanceof THREE.BufferAttribute) {
    // Use setXYZ instead of direct array access
    positionAttribute.setXYZ(0, startPoint.x, startPoint.y, startPoint.z);
    positionAttribute.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);

    // Mark the positions attribute as needing an update
    positionAttribute.needsUpdate = true;
  }
} 