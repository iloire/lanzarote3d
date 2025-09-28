import * as THREE from 'three';

export enum MovementPattern {
  CIRCULAR = 'circular',
  FIGURE_EIGHT = 'figure8',
  RANDOM_DRIFT = 'random',
  PATROL = 'patrol',
  LINEAR = 'linear',
}

export interface MovingBehaviorOptions {
  pattern?: MovementPattern;
  speed?: number;
  radius?: number;
  bounds?: { min: THREE.Vector3; max: THREE.Vector3 };
  waypoints?: THREE.Vector3[];
  autoStart?: boolean;
  faceDirection?: boolean;
  forwardAxis?: 'x' | 'z'; // Which axis the object faces forward in (default: 'z')
}

/**
 * Reusable movement behavior system for objects that should move horizontally
 * Can be combined with FloatingBehavior for boats or used alone for other objects
 */
export class MovingBehavior {
  private mesh: THREE.Object3D | null = null;
  private originalPosition: THREE.Vector3 = new THREE.Vector3();
  private animationId: number | null = null;
  private isMoving = false;

  // Movement configuration
  private pattern: MovementPattern;
  private speed: number;
  private radius: number;
  private bounds: { min: THREE.Vector3; max: THREE.Vector3 } | null;
  private waypoints: THREE.Vector3[];
  private faceDirection: boolean;
  private forwardAxis: 'x' | 'z';

  // Movement state
  private time = 0;
  private currentWaypointIndex = 0;
  private targetPosition = new THREE.Vector3();
  private randomTarget = new THREE.Vector3();
  private lastRandomUpdate = 0;

  constructor(options: MovingBehaviorOptions = {}) {
    this.pattern = options.pattern || MovementPattern.CIRCULAR;
    this.speed = options.speed || 0.5;
    this.radius = options.radius || 100;
    this.bounds = options.bounds || null;
    this.waypoints = options.waypoints || [];
    this.faceDirection = options.faceDirection ?? true;
    this.forwardAxis = options.forwardAxis ?? 'z';
  }

  /**
   * Attach movement behavior to a Three.js object
   */
  public attachTo(object: THREE.Object3D): void {
    this.mesh = object;
    this.originalPosition.copy(object.position);

    // Initialize movement targets
    if (this.pattern === MovementPattern.RANDOM_DRIFT) {
      this.randomTarget.copy(this.originalPosition);
    }
  }

  /**
   * Start the movement animation
   */
  public start(): void {
    if (!this.mesh || this.isMoving) return;

    this.isMoving = true;
    this.time = 0;
    this.animate();
  }

  /**
   * Stop the movement animation
   */
  public stop(): void {
    this.isMoving = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update movement speed
   */
  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, speed);
  }

  /**
   * Update movement pattern
   */
  public setPattern(pattern: MovementPattern): void {
    this.pattern = pattern;
  }

  /**
   * Set waypoints for patrol pattern
   */
  public setWaypoints(waypoints: THREE.Vector3[]): void {
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;
  }

  /**
   * Get current movement state
   */
  public isActive(): boolean {
    return this.isMoving;
  }

  /**
   * Update the original position (useful when object is repositioned after attachment)
   */
  public updateOriginalPosition(): void {
    if (this.mesh) {
      this.originalPosition.copy(this.mesh.position);
      if (this.pattern === MovementPattern.RANDOM_DRIFT) {
        this.randomTarget.copy(this.originalPosition);
      }
    }
  }

  /**
   * Dispose of the movement behavior
   */
  public dispose(): void {
    this.stop();
    this.mesh = null;
  }

  private animate = (): void => {
    if (!this.isMoving || !this.mesh) return;

    const deltaTime = 0.016; // Assume 60fps
    this.time += deltaTime * this.speed;

    // Calculate new position based on pattern
    const newPosition = new THREE.Vector3();

    switch (this.pattern) {
      case MovementPattern.CIRCULAR:
        this.calculateCircularMovement(newPosition);
        break;
      case MovementPattern.FIGURE_EIGHT:
        this.calculateFigureEightMovement(newPosition);
        break;
      case MovementPattern.RANDOM_DRIFT:
        this.calculateRandomDrift(newPosition, deltaTime);
        break;
      case MovementPattern.PATROL:
        this.calculatePatrolMovement(newPosition, deltaTime);
        break;
      case MovementPattern.LINEAR:
        this.calculateLinearMovement(newPosition);
        break;
    }

    // Apply bounds if specified
    if (this.bounds) {
      newPosition.x = Math.max(this.bounds.min.x, Math.min(this.bounds.max.x, newPosition.x));
      newPosition.z = Math.max(this.bounds.min.z, Math.min(this.bounds.max.z, newPosition.z));
    }

    // Face movement direction if enabled
    if (this.faceDirection && this.mesh.position.distanceTo(newPosition) > 0.1) {
      const direction = new THREE.Vector3().subVectors(newPosition, this.mesh.position).normalize();
      let angle: number;

      if (this.forwardAxis === 'x') {
        // For objects with forward direction in +X axis (like cars, boats)
        angle = Math.atan2(direction.z, direction.x) + Math.PI / 2;
      } else {
        // For objects with forward direction in +Z axis (standard)
        angle = Math.atan2(direction.x, direction.z);
      }

      this.mesh.rotation.y = angle;
    }

    // Update position (preserve Y for floating behavior compatibility)
    this.mesh.position.x = newPosition.x;
    this.mesh.position.z = newPosition.z;

    this.animationId = requestAnimationFrame(this.animate);
  };

  private calculateCircularMovement(position: THREE.Vector3): void {
    position.x = this.originalPosition.x + Math.cos(this.time) * this.radius;
    position.z = this.originalPosition.z + Math.sin(this.time) * this.radius;
  }

  private calculateFigureEightMovement(position: THREE.Vector3): void {
    position.x = this.originalPosition.x + Math.sin(this.time) * this.radius;
    position.z = this.originalPosition.z + Math.sin(this.time * 2) * this.radius * 0.5;
  }

  private calculateRandomDrift(position: THREE.Vector3, deltaTime: number): void {
    // Update random target every few seconds
    this.lastRandomUpdate += deltaTime;
    if (this.lastRandomUpdate > 3 + Math.random() * 4) {
      this.lastRandomUpdate = 0;

      // Generate new random target within radius
      const angle = Math.random() * Math.PI * 2;
      const distance = this.radius * (0.3 + Math.random() * 0.7);

      this.randomTarget.set(
        this.originalPosition.x + Math.cos(angle) * distance,
        this.originalPosition.y,
        this.originalPosition.z + Math.sin(angle) * distance
      );
    }

    // Smoothly move towards random target
    const lerpFactor = deltaTime * this.speed * 0.5;
    position.lerpVectors(this.mesh!.position, this.randomTarget, lerpFactor);
  }

  private calculatePatrolMovement(position: THREE.Vector3, deltaTime: number): void {
    if (this.waypoints.length < 2) {
      position.copy(this.mesh!.position);
      return;
    }

    const currentWaypoint = this.waypoints[this.currentWaypointIndex];
    const distanceToWaypoint = this.mesh!.position.distanceTo(currentWaypoint);

    // Check if reached waypoint
    if (distanceToWaypoint < 10) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    }

    // Move towards current waypoint
    const direction = new THREE.Vector3()
      .subVectors(currentWaypoint, this.mesh!.position)
      .normalize();
    const moveDistance = this.speed * deltaTime * 50;

    position.copy(this.mesh!.position);
    position.add(direction.multiplyScalar(moveDistance));
  }

  private calculateLinearMovement(position: THREE.Vector3): void {
    // Simple back and forth movement
    const offset = Math.sin(this.time) * this.radius;
    position.x = this.originalPosition.x + offset;
    position.z = this.originalPosition.z;
  }
}
