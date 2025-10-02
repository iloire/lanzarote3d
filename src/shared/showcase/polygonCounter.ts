import * as THREE from 'three';

/**
 * Count the total number of triangles/polygons in a 3D object
 */
export const countPolygons = (object: THREE.Object3D): number => {
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
};

/**
 * Format polygon count for display
 */
export const formatPolygonCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};
