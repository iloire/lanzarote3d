import * as THREE from 'three';

export enum FlightPattern {
  FREE_ROAM = 'free_roam',
  PERCH_AND_FLY = 'perch_and_fly',
  CIRCULAR = 'circular',
  FIGURE_EIGHT = 'figure8',
}

export interface FlyingBehaviorOptions {
  pattern?: FlightPattern;
  speed?: number;
  turnSpeed?: number;
  flightRadius?: number;
  minHeight?: number;
  maxHeight?: number;
  obstacleAvoidanceDistance?: number;
  returnDistance?: number;
  centerPoint?: THREE.Vector3;
  autoStart?: boolean;
  faceDirection?: boolean;
  forwardAxis?: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
}

/**
 * FlyingBehavior provides autonomous 3D flight with obstacle avoidance and boundary detection.
 * Unlike AutoFlier which follows predefined paths, this behavior creates natural flying patterns
 * with terrain awareness and dynamic obstacle avoidance.
 */
export class FlyingBehavior {
  protected mesh: THREE.Object3D | null = null;
  protected isFlying = false;
  protected animationId: number | null = null;

  // Flight configuration
  protected pattern: FlightPattern;
  protected speed: number;
  protected turnSpeed: number;
  protected flightRadius: number;
  protected minHeight: number;
  protected maxHeight: number;
  protected obstacleAvoidanceDistance: number;
  protected returnDistance: number;
  protected centerPoint: THREE.Vector3;
  protected faceDirection: boolean;
  protected forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

  // Flight state
  protected currentVelocity: THREE.Vector3 = new THREE.Vector3();
  protected targetDirection: THREE.Vector3 = new THREE.Vector3();
  protected obstacles: THREE.Object3D[] = [];
  protected terrain: THREE.Mesh | null = null;

  // Internal state
  private time = 0;
  private lastUpdate = 0;

  constructor(options: FlyingBehaviorOptions = {}) {
    this.pattern = options.pattern || FlightPattern.FREE_ROAM;
    this.speed = options.speed || 2.0;
    this.turnSpeed = options.turnSpeed || 1.0;
    this.flightRadius = options.flightRadius || 20;
    this.minHeight = options.minHeight || 3;
    this.maxHeight = options.maxHeight || 15;
    this.obstacleAvoidanceDistance = options.obstacleAvoidanceDistance || 5;
    this.returnDistance = options.returnDistance || this.flightRadius * 1.5;
    this.centerPoint = options.centerPoint ? options.centerPoint.clone() : new THREE.Vector3(0, 0, 0);
    this.faceDirection = options.faceDirection !== false;
    this.forwardAxis = options.forwardAxis || 'z';

    // Initialize with random direction
    this.targetDirection.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5, // Less vertical movement
      (Math.random() - 0.5) * 2
    ).normalize();
  }

  /**
   * Attach flying behavior to a Three.js object
   */
  public attachTo(object: THREE.Object3D): void {
    this.mesh = object;
    // Set initial position if not set
    if (this.mesh.position.length() === 0) {
      this.mesh.position.copy(this.centerPoint);
      this.mesh.position.y += this.minHeight;
    }
  }

  /**
   * Set terrain for height detection
   */
  public setTerrain(terrain: THREE.Mesh): void {
    this.terrain = terrain;
  }

  /**
   * Add obstacles to avoid
   */
  public addObstacles(obstacles: THREE.Object3D[]): void {
    this.obstacles.push(...obstacles);
  }

  /**
   * Start the flying animation
   */
  public start(): void {
    if (!this.mesh || this.isFlying) return;

    this.isFlying = true;
    this.lastUpdate = performance.now();
    this.animate();
  }

  /**
   * Stop the flying animation
   */
  public stop(): void {
    if (!this.isFlying) return;

    this.isFlying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isFlying || !this.mesh) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    this.time += deltaTime;

    this.updateFlight(deltaTime);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Update flight behavior
   */
  private updateFlight(deltaTime: number): void {
    if (!this.mesh) return;

    // Get desired direction based on pattern
    const desiredDirection = this.getDesiredDirection();

    // Apply obstacle avoidance
    const avoidanceForce = this.calculateObstacleAvoidance();
    desiredDirection.add(avoidanceForce);

    // Apply boundary constraints
    const boundaryForce = this.calculateBoundaryForce();
    desiredDirection.add(boundaryForce);

    // Apply terrain avoidance
    const terrainForce = this.calculateTerrainAvoidance();
    desiredDirection.add(terrainForce);

    // Smooth direction changes
    this.targetDirection.lerp(desiredDirection.normalize(), this.turnSpeed * deltaTime);
    this.currentVelocity.copy(this.targetDirection).multiplyScalar(this.speed);

    // Apply velocity
    this.mesh.position.add(this.currentVelocity.clone().multiplyScalar(deltaTime));

    // Constrain to height bounds
    this.constrainHeight();

    // Orient the object if needed
    if (this.faceDirection) {
      this.orientToDirection(this.targetDirection);
    }
  }

  /**
   * Get desired direction based on flight pattern
   */
  private getDesiredDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3();

    switch (this.pattern) {
      case FlightPattern.CIRCULAR:
        // Fly in a circle around center point
        const toCenter = this.centerPoint.clone().sub(this.mesh!.position);
        toCenter.y = 0; // Keep horizontal
        direction.crossVectors(toCenter.normalize(), new THREE.Vector3(0, 1, 0));
        break;

      case FlightPattern.FIGURE_EIGHT:
        // Create figure-eight pattern
        const figureEightX = Math.cos(this.time * 0.5) * this.flightRadius;
        const figureEightZ = Math.sin(this.time) * this.flightRadius * 0.5;
        const target = new THREE.Vector3(figureEightX, 0, figureEightZ).add(this.centerPoint);
        direction.copy(target).sub(this.mesh!.position).normalize();
        break;

      case FlightPattern.FREE_ROAM:
      default:
        // Continue in current direction with slight random variations
        direction.copy(this.targetDirection);

        // Add some randomness every few seconds
        if (Math.random() < 0.02) { // 2% chance per frame
          direction.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.3
          ));
        }
        break;
    }

    return direction.normalize();
  }

  /**
   * Calculate force to avoid obstacles
   */
  private calculateObstacleAvoidance(): THREE.Vector3 {
    const avoidanceForce = new THREE.Vector3();
    if (!this.mesh) return avoidanceForce;

    for (const obstacle of this.obstacles) {
      const distance = this.mesh.position.distanceTo(obstacle.position);

      if (distance < this.obstacleAvoidanceDistance) {
        // Calculate avoidance force
        const avoidDirection = this.mesh.position.clone().sub(obstacle.position);
        avoidDirection.normalize();

        // Stronger force when closer
        const strength = (this.obstacleAvoidanceDistance - distance) / this.obstacleAvoidanceDistance;
        avoidanceForce.add(avoidDirection.multiplyScalar(strength * 2));
      }
    }

    return avoidanceForce;
  }

  /**
   * Calculate force to stay within boundaries
   */
  private calculateBoundaryForce(): THREE.Vector3 {
    const boundaryForce = new THREE.Vector3();
    if (!this.mesh) return boundaryForce;

    const distanceFromCenter = this.mesh.position.distanceTo(this.centerPoint);

    if (distanceFromCenter > this.returnDistance) {
      // Strong force to return to center
      const returnDirection = this.centerPoint.clone().sub(this.mesh.position);
      returnDirection.normalize();
      boundaryForce.add(returnDirection.multiplyScalar(3));
    } else if (distanceFromCenter > this.flightRadius) {
      // Gentle force to return to flight area
      const returnDirection = this.centerPoint.clone().sub(this.mesh.position);
      returnDirection.normalize();
      const strength = (distanceFromCenter - this.flightRadius) / (this.returnDistance - this.flightRadius);
      boundaryForce.add(returnDirection.multiplyScalar(strength));
    }

    return boundaryForce;
  }

  /**
   * Calculate force to avoid terrain
   */
  private calculateTerrainAvoidance(): THREE.Vector3 {
    const terrainForce = new THREE.Vector3();
    if (!this.mesh || !this.terrain) return terrainForce;

    // Cast ray downward to detect terrain height
    const raycaster = new THREE.Raycaster();
    raycaster.set(this.mesh.position, new THREE.Vector3(0, -1, 0));

    const intersects = raycaster.intersectObject(this.terrain);
    if (intersects.length > 0) {
      const terrainHeight = intersects[0].point.y;
      const currentHeight = this.mesh.position.y;
      const heightAboveTerrain = currentHeight - terrainHeight;

      if (heightAboveTerrain < this.minHeight) {
        // Force upward to maintain minimum height
        const upwardForce = (this.minHeight - heightAboveTerrain) / this.minHeight;
        terrainForce.add(new THREE.Vector3(0, upwardForce * 2, 0));
      }
    }

    return terrainForce;
  }

  /**
   * Constrain height to bounds
   */
  private constrainHeight(): void {
    if (!this.mesh) return;

    if (this.mesh.position.y < this.minHeight) {
      this.mesh.position.y = this.minHeight;
      this.currentVelocity.y = Math.max(0, this.currentVelocity.y);
    } else if (this.mesh.position.y > this.maxHeight) {
      this.mesh.position.y = this.maxHeight;
      this.currentVelocity.y = Math.min(0, this.currentVelocity.y);
    }
  }

  /**
   * Orient object to face movement direction with horizontal stability
   */
  private orientToDirection(direction: THREE.Vector3): void {
    if (!this.mesh || direction.length() === 0) return;

    // Create horizontal-only direction (ignore Y component for stability)
    const horizontalDirection = direction.clone();
    horizontalDirection.y = 0; // Remove vertical component

    if (horizontalDirection.length() === 0) return; // Avoid pure vertical movement
    horizontalDirection.normalize();

    // Create target position for lookAt using only horizontal direction
    const targetPosition = this.mesh.position.clone().add(horizontalDirection);

    // Create a temporary object to get the lookAt rotation (horizontal only)
    const tempObject = new THREE.Object3D();
    tempObject.position.copy(this.mesh.position);
    tempObject.lookAt(targetPosition);

    // Apply corrective rotation based on model's forward axis
    let correction = new THREE.Euler();
    switch (this.forwardAxis) {
      case 'x':
        correction.set(0, -Math.PI / 2, 0);
        break;
      case '-x':
        correction.set(0, Math.PI / 2, 0);
        break;
      case 'y':
        correction.set(-Math.PI / 2, 0, 0);
        break;
      case '-y':
        correction.set(Math.PI / 2, 0, 0);
        break;
      case 'z':
        // Default Three.js orientation
        break;
      case '-z':
        correction.set(0, Math.PI, 0);
        break;
    }

    const correctionQuaternion = new THREE.Quaternion().setFromEuler(correction);
    const finalQuaternion = tempObject.quaternion.clone().multiply(correctionQuaternion);

    // Extract only the Y-axis rotation to maintain horizontal stability
    const euler = new THREE.Euler().setFromQuaternion(finalQuaternion);
    euler.x = 0; // Remove pitch rotation
    euler.z = 0; // Remove roll rotation
    const horizontalQuaternion = new THREE.Quaternion().setFromEuler(euler);

    // Smooth rotation (horizontal only)
    this.mesh.quaternion.slerp(horizontalQuaternion, this.turnSpeed * 0.1);
  }

  /**
   * Dispose of the behavior
   */
  public dispose(): void {
    this.stop();
    this.mesh = null;
    this.obstacles.length = 0;
    this.terrain = null;
  }

  /**
   * Get current flight state for debugging
   */
  public getFlightState() {
    return {
      isFlying: this.isFlying,
      position: this.mesh?.position.clone(),
      velocity: this.currentVelocity.clone(),
      direction: this.targetDirection.clone(),
      distanceFromCenter: this.mesh ? this.mesh.position.distanceTo(this.centerPoint) : 0,
      pattern: this.pattern
    };
  }
}