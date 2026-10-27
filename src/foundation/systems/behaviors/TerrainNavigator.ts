import * as THREE from 'three';

/**
 * TerrainNavigator - Handles terrain interaction for vehicles
 * Provides height sampling, slope analysis, and navigation assistance
 */
export class TerrainNavigator {
  private terrain: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;

  // Cached vectors to avoid garbage collection
  private tempVector = new THREE.Vector3();
  private downVector = new THREE.Vector3(0, -1, 0);

  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Set the terrain mesh to navigate on
   */
  setTerrain(terrain: THREE.Mesh): void {
    this.terrain = terrain;
  }

  /**
   * Get the height of terrain at a specific world position
   */
  getHeightAt(worldPosition: THREE.Vector3): number | null {
    if (!this.terrain) return null;

    // Cast ray downward from high above the position
    const rayOrigin = this.tempVector.copy(worldPosition);
    rayOrigin.y = 10000; // Start high above terrain

    this.raycaster.set(rayOrigin, this.downVector);
    const intersects = this.raycaster.intersectObject(this.terrain, false);

    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return null;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.terrain = null;
  }
}
