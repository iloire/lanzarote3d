import * as THREE from 'three';

export interface TerrainNavigatorOptions {
  sampleRadius?: number; // How far ahead to sample terrain
  maxSlope?: number; // Maximum slope angle in radians for drivability
  heightOffset?: number; // How high above terrain to position vehicle
  smoothingFactor?: number; // Smoothing for height transitions
}

/**
 * TerrainNavigator - Handles terrain interaction for vehicles
 * Provides height sampling, slope analysis, and navigation assistance
 */
export class TerrainNavigator {
  private terrain: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private options: Required<TerrainNavigatorOptions>;

  // Cached vectors to avoid garbage collection
  private tempVector = new THREE.Vector3();
  private upVector = new THREE.Vector3(0, 1, 0);
  private downVector = new THREE.Vector3(0, -1, 0);

  constructor(options: TerrainNavigatorOptions = {}) {
    this.raycaster = new THREE.Raycaster();
    this.options = {
      sampleRadius: 50,
      maxSlope: Math.PI / 6, // 30 degrees
      heightOffset: 5,
      smoothingFactor: 0.1,
      ...options,
    };
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
   * Get terrain surface normal at a position
   */
  getSurfaceNormalAt(worldPosition: THREE.Vector3): THREE.Vector3 | null {
    if (!this.terrain) return null;

    const rayOrigin = this.tempVector.copy(worldPosition);
    rayOrigin.y = 10000;

    this.raycaster.set(rayOrigin, this.downVector);
    const intersects = this.raycaster.intersectObject(this.terrain, false);

    if (intersects.length > 0) {
      return intersects[0].face?.normal?.clone().normalize() || this.upVector.clone();
    }

    return this.upVector.clone();
  }

  /**
   * Check if a position is drivable based on slope
   */
  isDrivable(worldPosition: THREE.Vector3): boolean {
    const normal = this.getSurfaceNormalAt(worldPosition);
    if (!normal) return false;

    // Calculate slope angle from surface normal
    const slopeAngle = Math.acos(normal.dot(this.upVector));
    return slopeAngle <= this.options.maxSlope;
  }

  /**
   * Sample terrain in multiple directions around a position
   * Returns an array of sample points with height and drivability
   */
  sampleAround(
    centerPosition: THREE.Vector3,
    samples: number = 8
  ): Array<{
    position: THREE.Vector3;
    height: number | null;
    normal: THREE.Vector3 | null;
    drivable: boolean;
    angle: number;
  }> {
    const results = [];
    const angleStep = (Math.PI * 2) / samples;

    for (let i = 0; i < samples; i++) {
      const angle = i * angleStep;
      const samplePos = new THREE.Vector3(
        centerPosition.x + Math.cos(angle) * this.options.sampleRadius,
        centerPosition.y,
        centerPosition.z + Math.sin(angle) * this.options.sampleRadius
      );

      const height = this.getHeightAt(samplePos);
      const normal = this.getSurfaceNormalAt(samplePos);
      const drivable = this.isDrivable(samplePos);

      results.push({
        position: samplePos,
        height,
        normal,
        drivable,
        angle,
      });
    }

    return results;
  }

  /**
   * Find the best direction to move from current position
   * Returns angle in radians (0 = +X direction)
   */
  findBestDirection(
    currentPosition: THREE.Vector3,
    currentDirection: THREE.Vector3
  ): number | null {
    const samples = this.sampleAround(currentPosition, 16);
    const currentHeight = this.getHeightAt(currentPosition);

    if (currentHeight === null) return null;

    // Score each direction based on multiple factors
    let bestAngle = null;
    let bestScore = -Infinity;

    for (const sample of samples) {
      if (!sample.drivable || sample.height === null) continue;

      let score = 0;

      // Prefer directions that maintain similar height (avoid steep climbs)
      const heightDiff = Math.abs(sample.height - currentHeight);
      score -= heightDiff * 0.1;

      // Prefer directions aligned with current movement
      const sampleDirection = sample.position.clone().sub(currentPosition).normalize();
      const alignment = currentDirection.dot(sampleDirection);
      score += alignment * 10; // Strong preference for forward movement

      // Prefer flatter terrain
      if (sample.normal) {
        const flatness = sample.normal.dot(this.upVector);
        score += flatness * 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAngle = sample.angle;
      }
    }

    return bestAngle;
  }

  /**
   * Position vehicle correctly on terrain with proper orientation
   */
  positionOnTerrain(object: THREE.Object3D, worldPosition: THREE.Vector3): void {
    const height = this.getHeightAt(worldPosition);
    const normal = this.getSurfaceNormalAt(worldPosition);

    if (height !== null) {
      // Set height with offset
      object.position.y = height + this.options.heightOffset;

      // Orient object to terrain surface
      if (normal) {
        // Calculate rotation to align with terrain normal
        const currentUp = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(currentUp, normal);

        // Apply rotation smoothly
        object.quaternion.slerp(quaternion, this.options.smoothingFactor);
      }
    }
  }

  /**
   * Check if there's an obstacle in the path ahead
   */
  checkPathAhead(position: THREE.Vector3, direction: THREE.Vector3, distance: number): boolean {
    const checkPosition = position.clone().add(direction.clone().multiplyScalar(distance));
    return this.isDrivable(checkPosition);
  }

  /**
   * Get terrain statistics for debugging
   */
  getTerrainStats(position: THREE.Vector3): {
    height: number | null;
    slope: number;
    drivable: boolean;
    normal: THREE.Vector3 | null;
  } {
    const height = this.getHeightAt(position);
    const normal = this.getSurfaceNormalAt(position);
    const slope = normal ? Math.acos(normal.dot(this.upVector)) : 0;
    const drivable = this.isDrivable(position);

    return { height, slope, drivable, normal };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.terrain = null;
  }
}
