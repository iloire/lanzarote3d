import * as THREE from 'three';

/**
 * Count the total number of triangles/polygons in a 3D object
 */
export function countPolygons(object: THREE.Object3D): number {
  let totalTriangles = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;

      if (geometry.index !== null) {
        // Indexed geometry
        totalTriangles += geometry.index.count / 3;
      } else {
        // Non-indexed geometry
        const positionAttribute = geometry.getAttribute('position');
        if (positionAttribute) {
          totalTriangles += positionAttribute.count / 3;
        }
      }
    }
  });

  return Math.floor(totalTriangles);
}

/**
 * Format polygon count for display
 */
export function formatPolygonCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Creates a label mesh for displaying component information
 */
export function createLabel(
  text: string,
  position: THREE.Vector3,
  polygonCount?: number
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 320;
  canvas.height = 80;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Main title
    context.font = 'bold 28px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, 30);

    // Polygon count
    if (polygonCount !== undefined) {
      context.font = '20px Arial';
      context.fillStyle = '#ffff00'; // Yellow for polygon count
      context.fillText(`${formatPolygonCount(polygonCount)} polys`, canvas.width / 2, 55);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(15, 4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = 25; // Position labels above the models
  return mesh;
}

/**
 * Updates all labels to face the camera
 */
export function updateLabelRotations(labels: THREE.Mesh[], camera: THREE.Camera): void {
  labels.forEach((label) => {
    label.quaternion.copy(camera.quaternion);
  });
}
