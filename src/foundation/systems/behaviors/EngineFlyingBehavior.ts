import * as THREE from 'three';
import { FlyingBehavior, FlyingBehaviorOptions, FlightPattern } from './FlyingBehavior';

export interface EngineFlyingBehaviorOptions extends FlyingBehaviorOptions {
  // Engine-specific options
  cruiseAltitude?: number; // Preferred flying altitude
  climbRate?: number; // How fast the aircraft climbs (units per second)
  terrainClearance?: number; // Minimum clearance above terrain
  lookAheadDistance?: number; // How far ahead to check terrain
}

/**
 * EngineFlyingBehavior for powered aircraft (planes, jets, etc.)
 *
 * Unlike wind-dependent gliders, engine-powered aircraft can:
 * - Fly in any direction regardless of wind
 * - Maintain consistent altitude
 * - Climb actively when needed
 * - Navigate complex terrain with forward-looking terrain avoidance
 */
export class EngineFlyingBehavior extends FlyingBehavior {
  private cruiseAltitude: number;
  private climbRate: number;
  private terrainClearance: number;
  private lookAheadDistance: number;

  constructor(options: EngineFlyingBehaviorOptions = {}) {
    // Set sensible defaults for engine aircraft
    super({
      pattern: FlightPattern.FREE_ROAM,
      speed: options.speed || 5.0, // Faster than gliders
      turnSpeed: options.turnSpeed || 0.8,
      flightRadius: options.flightRadius || 1000, // Larger flight area
      minHeight: options.minHeight || 100, // Fly higher
      maxHeight: options.maxHeight || 500,
      obstacleAvoidanceDistance: options.obstacleAvoidanceDistance || 50,
      returnDistance: options.returnDistance || 1500,
      centerPoint: options.centerPoint,
      autoStart: options.autoStart,
      faceDirection: options.faceDirection !== false,
      forwardAxis: options.forwardAxis || 'x', // Most planes point forward on X axis
      debugVectors: options.debugVectors,
    });

    this.cruiseAltitude = options.cruiseAltitude || 200;
    this.climbRate = options.climbRate || 2.0;
    this.terrainClearance = options.terrainClearance || 80;
    this.lookAheadDistance = options.lookAheadDistance || 150;
  }

  /**
   * Override updateFlight to add engine-specific behaviors
   */
  protected override updateFlight(deltaTime: number): void {
    if (!this.mesh) return;

    // Get desired direction based on pattern
    const desiredDirection = this.getDesiredDirection();

    // Apply obstacle avoidance
    const avoidanceForce = this.calculateObstacleAvoidance();
    desiredDirection.add(avoidanceForce);

    // Apply boundary constraints
    const boundaryForce = this.calculateBoundaryForce();
    desiredDirection.add(boundaryForce);

    // Apply terrain avoidance (basic)
    const terrainForce = this.calculateTerrainAvoidance();
    desiredDirection.add(terrainForce);

    // ENGINE-SPECIFIC: Forward-looking terrain avoidance
    const forwardTerrainForce = this.calculateForwardTerrainAvoidance();
    desiredDirection.add(forwardTerrainForce);

    // ENGINE-SPECIFIC: Maintain cruise altitude
    const altitudeForce = this.maintainCruiseAltitude();
    desiredDirection.add(altitudeForce);

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
   * Look ahead to detect terrain and climb if necessary
   * This allows the aircraft to avoid hills before hitting them
   */
  private calculateForwardTerrainAvoidance(): THREE.Vector3 {
    const avoidanceForce = new THREE.Vector3();
    if (!this.mesh || !this.terrain) return avoidanceForce;

    // Cast multiple rays forward and to the sides
    const raycaster = new THREE.Raycaster();
    const currentPos = this.mesh.position.clone();
    const forwardDir = this.targetDirection.clone().normalize();

    // Check center, left, and right
    const checkAngles = [0, -0.3, 0.3]; // Center, left 17°, right 17°
    let maxTerrainHeight = 0;

    for (const angle of checkAngles) {
      // Rotate forward direction by angle
      const checkDir = forwardDir.clone();
      checkDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

      // Cast ray forward at look-ahead distance
      const checkPoint = currentPos.clone().add(checkDir.multiplyScalar(this.lookAheadDistance));

      // Cast ray down from high above to find terrain
      const rayStart = new THREE.Vector3(checkPoint.x, 2000, checkPoint.z);
      raycaster.set(rayStart, new THREE.Vector3(0, -1, 0));

      const intersects = raycaster.intersectObject(this.terrain);
      if (intersects.length > 0) {
        const terrainHeight = intersects[0].point.y;
        maxTerrainHeight = Math.max(maxTerrainHeight, terrainHeight);
      }
    }

    // If terrain ahead is higher than current altitude + clearance, climb
    if (maxTerrainHeight > 0) {
      const requiredAltitude = maxTerrainHeight + this.terrainClearance;
      const currentAltitude = currentPos.y;

      if (currentAltitude < requiredAltitude) {
        const climbUrgency = (requiredAltitude - currentAltitude) / this.terrainClearance;
        avoidanceForce.add(new THREE.Vector3(0, Math.min(climbUrgency * 3, 5), 0));

        // Log when climbing to avoid terrain
        if (Math.random() < 0.01) { // 1% of frames
          console.log(`⛰️  Climbing to avoid terrain: required=${requiredAltitude.toFixed(0)}, current=${currentAltitude.toFixed(0)}`);
        }
      }
    }

    return avoidanceForce;
  }

  /**
   * Maintain cruise altitude when not avoiding terrain or obstacles
   */
  private maintainCruiseAltitude(): THREE.Vector3 {
    const altitudeForce = new THREE.Vector3();
    if (!this.mesh) return altitudeForce;

    const currentAltitude = this.mesh.position.y;
    const altitudeDiff = this.cruiseAltitude - currentAltitude;

    // Gentle force to return to cruise altitude
    if (Math.abs(altitudeDiff) > 20) { // Only adjust if significantly off cruise altitude
      const climbForce = (altitudeDiff / this.cruiseAltitude) * 0.5;
      altitudeForce.add(new THREE.Vector3(0, climbForce, 0));
    }

    return altitudeForce;
  }

  /**
   * Get info about engine aircraft state
   */
  public getEngineFlightInfo() {
    const baseInfo = this.getFlightState();
    return {
      ...baseInfo,
      cruiseAltitude: this.cruiseAltitude,
      currentAltitude: this.mesh?.position.y || 0,
      climbRate: this.climbRate,
      terrainClearance: this.terrainClearance,
    };
  }
}
