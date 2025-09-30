import * as THREE from 'three';

export enum FlightPattern {
  FREE_ROAM = 'free_roam',
  PERCH_AND_FLY = 'perch_and_fly',
  CIRCULAR = 'circular',
  FIGURE_EIGHT = 'figure8',
}

export type ForwardAxis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

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
  forwardAxis?: ForwardAxis;
  debugVectors?: boolean; // Show velocity and forward direction vectors
}

export interface FlightState {
  isFlying: boolean;
  position: THREE.Vector3 | undefined;
  velocity: THREE.Vector3;
  direction: THREE.Vector3;
  distanceFromCenter: number;
  pattern: FlightPattern;
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
  protected forwardAxis: ForwardAxis;
  protected debugVectors: boolean;

  // Debug visualization
  private velocityArrow?: THREE.ArrowHelper;
  private forwardArrow?: THREE.ArrowHelper;

  // Flight state
  protected currentVelocity: THREE.Vector3 = new THREE.Vector3();
  protected targetDirection: THREE.Vector3 = new THREE.Vector3();
  protected obstacles: THREE.Object3D[] = [];
  protected terrain: THREE.Mesh | null = null;

  // Speed management for collision avoidance
  protected baseSpeed: number; // Original configured speed
  protected currentSpeed: number; // Actual speed (reduced when near obstacles)
  protected speedReductionFactor = 1.0; // Multiplier (1.0 = full speed, 0.3 = 30% speed)
  protected nearestObstacleDistance = Infinity;

  // Internal state
  private time = 0;
  private lastUpdate = 0;
  private debugLogCounter = 0; // For throttled debug logging

  constructor(options: FlyingBehaviorOptions = {}) {
    this.pattern = options.pattern || FlightPattern.FREE_ROAM;
    this.speed = options.speed || 2.0;
    this.baseSpeed = this.speed; // Store original speed
    this.currentSpeed = this.speed; // Initialize current speed
    this.turnSpeed = options.turnSpeed || 1.0;
    this.flightRadius = options.flightRadius || 20;
    this.minHeight = options.minHeight || 3;
    this.maxHeight = options.maxHeight || 15;
    this.obstacleAvoidanceDistance = options.obstacleAvoidanceDistance || 5;
    this.returnDistance = options.returnDistance || this.flightRadius * 1.5;
    this.centerPoint = options.centerPoint ? options.centerPoint.clone() : new THREE.Vector3(0, 0, 0);
    this.faceDirection = options.faceDirection !== false;
    this.forwardAxis = options.forwardAxis || 'z';
    this.debugVectors = options.debugVectors || false;

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

    // Create debug arrows if enabled
    this.createDebugArrows();
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
   * Add single obstacle to avoid
   */
  public addObstacle(obstacle: THREE.Object3D): void {
    this.obstacles.push(obstacle);
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
  protected updateFlight(deltaTime: number): void {
    if (!this.mesh) return;

    // Get desired direction based on pattern
    const desiredDirection = this.getDesiredDirection();

    // Apply obstacle avoidance and calculate speed reduction
    const avoidanceForce = this.calculateObstacleAvoidance();
    desiredDirection.add(avoidanceForce);

    // Apply boundary constraints
    const boundaryForce = this.calculateBoundaryForce();
    desiredDirection.add(boundaryForce);

    // Apply terrain avoidance
    const terrainForce = this.calculateTerrainAvoidance();
    desiredDirection.add(terrainForce);

    // Calculate speed reduction based on obstacle proximity
    this.updateSpeedReduction();

    // Smooth direction changes
    this.targetDirection.lerp(desiredDirection.normalize(), this.turnSpeed * deltaTime);
    this.currentVelocity.copy(this.targetDirection).multiplyScalar(this.currentSpeed);

    // Apply velocity
    this.mesh.position.add(this.currentVelocity.clone().multiplyScalar(deltaTime));

    // Constrain to height bounds
    this.constrainHeight();

    // Orient the object if needed
    if (this.faceDirection) {
      this.orientToDirection(this.targetDirection);
    }

    // Update debug arrows if enabled
    this.updateDebugArrows();

    // Log debug information periodically
    this.logDebugInfo();
  }

  /**
   * Get desired direction based on flight pattern
   */
  protected getDesiredDirection(): THREE.Vector3 {
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
   * Calculate force to avoid obstacles and track nearest obstacle distance
   */
  protected calculateObstacleAvoidance(): THREE.Vector3 {
    const avoidanceForce = new THREE.Vector3();
    if (!this.mesh) return avoidanceForce;

    let nearestDistance = Infinity;
    let nearestObstacleName = 'None';

    for (const obstacle of this.obstacles) {
      const distance = this.mesh.position.distanceTo(obstacle.position);

      // Track nearest obstacle
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestObstacleName = obstacle.name || 'Unknown';
      }

      if (distance < this.obstacleAvoidanceDistance) {
        // Calculate avoidance force
        const avoidDirection = this.mesh.position.clone().sub(obstacle.position);
        avoidDirection.normalize();

        // Stronger force when closer
        const strength = (this.obstacleAvoidanceDistance - distance) / this.obstacleAvoidanceDistance;
        avoidanceForce.add(avoidDirection.multiplyScalar(strength * 2));

        // Log close encounters
        if (this.debugLogCounter % 30 === 0) { // Log every ~0.5 seconds at 60fps
          console.log(`⚠️ Close to ${nearestObstacleName}: distance=${distance.toFixed(2)}, strength=${strength.toFixed(2)}`);
        }
      }
    }

    // Store nearest obstacle distance for speed calculation
    this.nearestObstacleDistance = nearestDistance;

    return avoidanceForce;
  }

  /**
   * Calculate force to stay within boundaries
   */
  protected calculateBoundaryForce(): THREE.Vector3 {
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
  protected calculateTerrainAvoidance(): THREE.Vector3 {
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
   * Update speed based on proximity to obstacles
   * Reduces speed when approaching obstacles to allow time to maneuver
   */
  protected updateSpeedReduction(): void {
    // Calculate speed reduction based on nearest obstacle
    // Full speed when far away, reduced speed when close
    const safeDistance = this.obstacleAvoidanceDistance * 2; // Start slowing at 2x avoidance distance

    if (this.nearestObstacleDistance < safeDistance) {
      // Linear speed reduction from 100% at safeDistance to 30% at contact
      this.speedReductionFactor = Math.max(
        0.3, // Minimum 30% speed
        this.nearestObstacleDistance / safeDistance
      );
    } else {
      // Gradually return to full speed
      this.speedReductionFactor = Math.min(1.0, this.speedReductionFactor + 0.02);
    }

    // Apply speed reduction
    this.currentSpeed = this.baseSpeed * this.speedReductionFactor;
  }

  /**
   * Log debug information about flight state
   */
  protected logDebugInfo(): void {
    if (!this.mesh) return;

    this.debugLogCounter++;

    // Log every 2 seconds (120 frames at 60fps)
    if (this.debugLogCounter % 120 === 0) {
      const distanceFromCenter = this.mesh.position.distanceTo(this.centerPoint);

      console.log('🛩️ Flight Status:', {
        position: `(${this.mesh.position.x.toFixed(1)}, ${this.mesh.position.y.toFixed(1)}, ${this.mesh.position.z.toFixed(1)})`,
        speed: `${this.currentSpeed.toFixed(2)} (${(this.speedReductionFactor * 100).toFixed(0)}% of base)`,
        baseSpeed: this.baseSpeed.toFixed(2),
        nearestObstacle: this.nearestObstacleDistance === Infinity ? 'None' : this.nearestObstacleDistance.toFixed(2),
        distanceFromCenter: distanceFromCenter.toFixed(2),
        velocity: `(${this.currentVelocity.x.toFixed(2)}, ${this.currentVelocity.y.toFixed(2)}, ${this.currentVelocity.z.toFixed(2)})`,
        pattern: this.pattern
      });
    }
  }

  /**
   * Constrain height to bounds
   */
  protected constrainHeight(): void {
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
  protected orientToDirection(direction: THREE.Vector3): void {
    if (!this.mesh || direction.length() === 0) return;

    // Use the full 3D direction for more natural aircraft orientation
    const normalizedDirection = direction.clone().normalize();

    // Create target position for lookAt
    const targetPosition = this.mesh.position.clone().add(normalizedDirection);

    // Create a temporary object to get the lookAt rotation
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

    // Allow natural aircraft orientation including pitch and roll for realism
    const euler = new THREE.Euler().setFromQuaternion(finalQuaternion);

    // Limit extreme rotations for stability but allow some banking
    euler.x = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, euler.x)); // Limit pitch to ±30°
    euler.z = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, euler.z)); // Limit roll to ±22.5°

    const stableQuaternion = new THREE.Quaternion().setFromEuler(euler);

    // Increase rotation speed for more responsive turning
    const rotationSpeed = Math.min(this.turnSpeed * 0.3, 0.15); // Cap maximum rotation speed

    // Debug logging (can be removed later)
    if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
      console.log('🔄 FlyingBehavior orientation:', {
        direction: normalizedDirection.toArray(),
        currentRotation: this.mesh.rotation.toArray(),
        targetRotation: euler.toArray(),
        rotationSpeed
      });
    }

    // Smooth rotation with increased responsiveness
    this.mesh.quaternion.slerp(stableQuaternion, rotationSpeed);
  }

  /**
   * Create debug arrows to visualize velocity and forward direction
   */
  private createDebugArrows(): void {
    if (!this.debugVectors || !this.mesh) return;

    // Create velocity arrow (red) - shows where the object is moving
    const velocityDirection = new THREE.Vector3(1, 0, 0);
    this.velocityArrow = new THREE.ArrowHelper(
      velocityDirection,
      this.mesh.position,
      20, // length
      0xff0000, // red color
      8, // head length
      4 // head width
    );
    this.velocityArrow.name = 'VelocityVector';

    // Create forward direction arrow (blue) - shows where the object is facing
    const forwardDirection = this.getForwardDirectionVector();
    this.forwardArrow = new THREE.ArrowHelper(
      forwardDirection,
      this.mesh.position,
      15, // slightly shorter length
      0x0000ff, // blue color
      6, // head length
      3 // head width
    );
    this.forwardArrow.name = 'ForwardVector';

    // Add arrows to the scene (assuming mesh has a parent)
    if (this.mesh.parent) {
      this.mesh.parent.add(this.velocityArrow);
      this.mesh.parent.add(this.forwardArrow);
    }
  }

  /**
   * Update debug arrows to show current velocity and forward direction
   */
  protected updateDebugArrows(): void {
    if (!this.debugVectors || !this.mesh || !this.velocityArrow || !this.forwardArrow) return;

    // Update velocity arrow (red) - normalized velocity direction
    const velocityDirection = this.currentVelocity.clone().normalize();
    if (velocityDirection.length() > 0) {
      this.velocityArrow.setDirection(velocityDirection);
    }
    this.velocityArrow.position.copy(this.mesh.position);

    // Update forward direction arrow (blue) - where the object is facing
    const forwardDirection = this.getForwardDirectionVector();
    this.forwardArrow.setDirection(forwardDirection);
    this.forwardArrow.position.copy(this.mesh.position);
  }

  /**
   * Get the forward direction vector based on the object's current orientation and forwardAxis
   */
  private getForwardDirectionVector(): THREE.Vector3 {
    if (!this.mesh) return new THREE.Vector3(0, 0, 1);

    // Create the base forward vector based on forwardAxis
    const baseForward = new THREE.Vector3();
    switch (this.forwardAxis) {
      case 'x':
        baseForward.set(1, 0, 0);
        break;
      case '-x':
        baseForward.set(-1, 0, 0);
        break;
      case 'y':
        baseForward.set(0, 1, 0);
        break;
      case '-y':
        baseForward.set(0, -1, 0);
        break;
      case 'z':
        baseForward.set(0, 0, 1);
        break;
      case '-z':
        baseForward.set(0, 0, -1);
        break;
    }

    // Apply the object's current rotation to the forward vector
    return baseForward.applyQuaternion(this.mesh.quaternion).normalize();
  }

  /**
   * Remove debug arrows from the scene
   */
  private removeDebugArrows(): void {
    if (this.velocityArrow && this.velocityArrow.parent) {
      this.velocityArrow.parent.remove(this.velocityArrow);
      this.velocityArrow = undefined;
    }
    if (this.forwardArrow && this.forwardArrow.parent) {
      this.forwardArrow.parent.remove(this.forwardArrow);
      this.forwardArrow = undefined;
    }
  }

  /**
   * Dispose of the behavior
   */
  public dispose(): void {
    this.stop();
    this.removeDebugArrows();
    this.mesh = null;
    this.obstacles.length = 0;
    this.terrain = null;
  }

  /**
   * Get current flight state for debugging
   */
  /**
   * Get current flight state information
   */
  public getFlightState(): FlightState {
    return {
      isFlying: this.isFlying,
      position: this.mesh?.position.clone(),
      velocity: this.currentVelocity.clone(),
      direction: this.targetDirection.clone(),
      distanceFromCenter: this.mesh ? this.mesh.position.distanceTo(this.centerPoint) : 0,
      pattern: this.pattern
    };
  }

  /**
   * Update the center point for flight patterns
   */
  public updateCenterPoint(point: THREE.Vector3): void {
    this.centerPoint.copy(point);
  }

  /**
   * Check if currently flying
   */
  public isFlyingActive(): boolean {
    return this.isFlying;
  }
}