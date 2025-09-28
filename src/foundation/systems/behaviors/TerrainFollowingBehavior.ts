import * as THREE from 'three';
import { MovingBehavior, MovingBehaviorOptions, MovementPattern } from './MovingBehavior';
import { TerrainNavigator, TerrainNavigatorOptions } from './TerrainNavigator';

export enum TerrainDrivingMode {
  EXPLORATION = 'exploration', // Free exploration avoiding obstacles
  PATROL = 'patrol', // Follow predefined waypoints on terrain
  DESTINATION = 'destination', // Navigate to specific destination
  FOLLOW_ROADS = 'follow_roads', // Try to follow road-like terrain features
}

export interface TerrainFollowingOptions extends MovingBehaviorOptions {
  mode?: TerrainDrivingMode;
  terrain?: THREE.Mesh;
  terrainNavigator?: TerrainNavigatorOptions;
  destination?: THREE.Vector3;
  explorationRadius?: number;
  pathUpdateInterval?: number; // How often to recalculate path (milliseconds)
  stuckThreshold?: number; // Distance threshold to detect if vehicle is stuck
  reverseProbability?: number; // Chance to reverse when stuck
}

/**
 * TerrainFollowingBehavior - Autonomous driving on 3D terrain
 * Extends MovingBehavior with terrain awareness and intelligent navigation
 */
export class TerrainFollowingBehavior extends MovingBehavior {
  private terrainNavigator: TerrainNavigator;
  private mode: TerrainDrivingMode;
  private destination: THREE.Vector3 | null = null;
  private explorationRadius: number;
  private pathUpdateInterval: number;
  private stuckThreshold: number;
  private reverseProbability: number;

  // Navigation state
  private lastPosition = new THREE.Vector3();
  private lastPathUpdate = 0;
  private stuckTimer = 0;
  private isReversing = false;
  private explorationCenter = new THREE.Vector3();
  private currentTarget = new THREE.Vector3();

  // Performance optimization
  private tempVector = new THREE.Vector3();
  private tempDirection = new THREE.Vector3();

  constructor(options: TerrainFollowingOptions = {}) {
    // Override pattern to use custom terrain-following logic
    super({
      ...options,
      pattern: MovementPattern.CIRCULAR, // We'll override the movement logic
      faceDirection: true,
      forwardAxis: options.forwardAxis || 'x',
    });

    this.terrainNavigator = new TerrainNavigator(options.terrainNavigator);
    this.mode = options.mode || TerrainDrivingMode.EXPLORATION;
    this.destination = options.destination || null;
    this.explorationRadius = options.explorationRadius || 500;
    this.pathUpdateInterval = options.pathUpdateInterval || 1000; // 1 second
    this.stuckThreshold = options.stuckThreshold || 5; // 5 units
    this.reverseProbability = options.reverseProbability || 0.3;

    if (options.terrain) {
      this.terrainNavigator.setTerrain(options.terrain);
    }
  }

  /**
   * Set the terrain mesh for navigation
   */
  setTerrain(terrain: THREE.Mesh): void {
    this.terrainNavigator.setTerrain(terrain);
  }

  /**
   * Set driving mode
   */
  setMode(mode: TerrainDrivingMode): void {
    this.mode = mode;
  }

  /**
   * Set destination for navigation
   */
  setDestination(destination: THREE.Vector3): void {
    this.destination = destination.clone();
    this.mode = TerrainDrivingMode.DESTINATION;
  }

  /**
   * Override the attachTo method to set up terrain navigation
   */
  attachTo(object: THREE.Object3D): void {
    super.attachTo(object);

    if (this.mesh) {
      this.lastPosition.copy(this.mesh.position);
      this.explorationCenter.copy(this.mesh.position);
      this.currentTarget.copy(this.mesh.position);
    }
  }

  /**
   * Override the animation loop with terrain-aware navigation
   */
  protected animate = (): void => {
    if (!this.isMoving || !this.mesh) return;

    const deltaTime = 0.016; // Assume 60fps
    const currentTime = Date.now();

    // Update terrain position
    this.terrainNavigator.positionOnTerrain(this.mesh, this.mesh.position);

    // Check if stuck (not moving much)
    const distanceMoved = this.mesh.position.distanceTo(this.lastPosition);
    if (distanceMoved < this.stuckThreshold * deltaTime) {
      this.stuckTimer += deltaTime;
    } else {
      this.stuckTimer = 0;
      this.isReversing = false;
    }

    // Handle stuck situations
    if (this.stuckTimer > 2.0) {
      // Stuck for 2 seconds
      if (Math.random() < this.reverseProbability) {
        this.isReversing = true;
        this.stuckTimer = 0;
      }
    }

    // Update navigation path periodically
    if (currentTime - this.lastPathUpdate > this.pathUpdateInterval) {
      this.updateNavigationTarget();
      this.lastPathUpdate = currentTime;
    }

    // Calculate movement direction
    let targetDirection = this.calculateMovementDirection();

    if (this.isReversing) {
      targetDirection.multiplyScalar(-1);
    }

    // Move towards target
    if (targetDirection.length() > 0) {
      const movement = targetDirection.multiplyScalar(this.speed * deltaTime);
      const newPosition = this.mesh.position.clone().add(movement);

      // Validate movement (ensure it's drivable)
      if (this.terrainNavigator.isDrivable(newPosition)) {
        this.mesh.position.copy(newPosition);

        // Face movement direction if enabled
        if (this.faceDirection) {
          this.updateOrientation(targetDirection);
        }
      } else {
        // Path blocked, trigger stuck handling
        this.stuckTimer += deltaTime;
      }
    }

    this.lastPosition.copy(this.mesh.position);
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Update the current navigation target based on driving mode
   */
  private updateNavigationTarget(): void {
    if (!this.mesh) return;

    switch (this.mode) {
      case TerrainDrivingMode.EXPLORATION:
        this.updateExplorationTarget();
        break;
      case TerrainDrivingMode.DESTINATION:
        this.updateDestinationTarget();
        break;
      case TerrainDrivingMode.PATROL:
        this.updatePatrolTarget();
        break;
      case TerrainDrivingMode.FOLLOW_ROADS:
        this.updateRoadFollowingTarget();
        break;
    }
  }

  /**
   * Update target for exploration mode
   */
  private updateExplorationTarget(): void {
    if (!this.mesh) return;

    // Find best direction using terrain navigator
    const currentDirection = this.tempDirection.set(1, 0, 0); // Default forward direction
    const bestAngle = this.terrainNavigator.findBestDirection(this.mesh.position, currentDirection);

    if (bestAngle !== null) {
      // Set target in best direction
      this.currentTarget.copy(this.mesh.position);
      this.currentTarget.x += Math.cos(bestAngle) * 100;
      this.currentTarget.z += Math.sin(bestAngle) * 100;
    } else {
      // No good direction found, try to return to exploration center
      this.currentTarget.copy(this.explorationCenter);
    }
  }

  /**
   * Update target for destination mode
   */
  private updateDestinationTarget(): void {
    if (!this.mesh || !this.destination) return;

    // Simple direct approach - in a real implementation, this would use A* pathfinding
    this.currentTarget.copy(this.destination);
  }

  /**
   * Update target for patrol mode (using existing waypoints)
   */
  private updatePatrolTarget(): void {
    // Use the existing patrol logic from parent class
    // This would be enhanced with terrain validation
    this.currentTarget.copy(this.mesh.position);
  }

  /**
   * Update target for road following mode
   */
  private updateRoadFollowingTarget(): void {
    if (!this.mesh) return;

    // Analyze terrain ahead to find road-like features
    // This is a simplified version - real implementation would analyze texture or elevation patterns
    const samples = this.terrainNavigator.sampleAround(this.mesh.position, 8);

    // Find the flattest, most accessible direction
    let bestDirection = null;
    let bestFlatness = -1;

    for (const sample of samples) {
      if (sample.drivable && sample.normal) {
        const flatness = Math.abs(sample.normal.y); // How vertical the normal is
        if (flatness > bestFlatness) {
          bestFlatness = flatness;
          bestDirection = sample.angle;
        }
      }
    }

    if (bestDirection !== null) {
      this.currentTarget.copy(this.mesh.position);
      this.currentTarget.x += Math.cos(bestDirection) * 150;
      this.currentTarget.z += Math.sin(bestDirection) * 150;
    }
  }

  /**
   * Calculate movement direction towards current target
   */
  private calculateMovementDirection(): THREE.Vector3 {
    if (!this.mesh) return new THREE.Vector3();

    const direction = this.tempVector.copy(this.currentTarget).sub(this.mesh.position);
    direction.y = 0; // Only horizontal movement
    direction.normalize();

    return direction;
  }

  /**
   * Update object orientation based on movement direction
   */
  private updateOrientation(direction: THREE.Vector3): void {
    if (!this.mesh || direction.length() === 0) return;

    let angle: number;

    if (this.forwardAxis === 'x') {
      angle = Math.atan2(direction.x, direction.z) - Math.PI / 2;
    } else {
      angle = Math.atan2(direction.x, direction.z);
    }

    this.mesh.rotation.y = angle;
  }

  /**
   * Get current navigation status for debugging
   */
  getNavigationStatus(): {
    mode: TerrainDrivingMode;
    currentTarget: THREE.Vector3;
    isStuck: boolean;
    isReversing: boolean;
    terrainStats: any;
  } {
    const terrainStats = this.mesh
      ? this.terrainNavigator.getTerrainStats(this.mesh.position)
      : null;

    return {
      mode: this.mode,
      currentTarget: this.currentTarget.clone(),
      isStuck: this.stuckTimer > 1.0,
      isReversing: this.isReversing,
      terrainStats,
    };
  }

  /**
   * Override dispose to clean up terrain navigator
   */
  dispose(): void {
    super.dispose();
    this.terrainNavigator.dispose();
  }
}
