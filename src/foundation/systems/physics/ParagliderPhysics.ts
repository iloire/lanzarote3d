import * as THREE from 'three';
import Weather from '../../components/physics/Weather';
import Thermal from '../../components/physics/Thermal';
import { getTerrainHeightBelowPosition } from '../../utils/collision';

export interface ParagliderPhysicsOptions {
  glidingRatio: number;
  trimSpeed: number;
  fullSpeedBarSpeed: number;
  bigEarsSpeed: number;
}

export interface ParagliderPhysicsState {
  lift: number;
  drop: number;
  gradient: number;
  heightAboveGround: number;
  isOnSpeedBar: boolean;
  isOnEars: boolean;
  airSpeed: number;
  groundSpeed: number;
  insideThermalCount: number;
}

/**
 * ParagliderPhysics handles paraglider-specific physics calculations
 * including lift, thermals, weather effects, and gliding dynamics.
 *
 * This is a pure calculation system - it doesn't update positions directly.
 * Use with FlyingBehavior for movement.
 */
export class ParagliderPhysics {
  private options: ParagliderPhysicsOptions;
  private weather: Weather;
  private terrain: THREE.Mesh;
  private water: THREE.Mesh;
  private thermals: Thermal[];

  private speedBar: boolean = false;
  private ears: boolean = false;

  // Cached state
  private currentLift: number = 0;
  private currentGradient: number = 0;

  constructor(
    options: ParagliderPhysicsOptions,
    weather: Weather,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    thermals: Thermal[]
  ) {
    this.options = options;
    this.weather = weather;
    this.terrain = terrain;
    this.water = water;
    this.thermals = thermals;
  }

  /**
   * Calculate physics forces for current position
   */
  calculateForces(position: THREE.Vector3, direction: THREE.Vector3, deltaTime: number): {
    velocity: THREE.Vector3;
    state: ParagliderPhysicsState;
  } {
    const airSpeed = this.getAirSpeed();
    const drop = airSpeed / this.getGlidingRatio();

    // Calculate lift from terrain gradient
    const lift = this.getLiftValue(position);

    // Calculate thermal lift
    const thermalCount = this.countInsideHowManyThermals(position);
    const thermalLift = 2 * thermalCount;

    // Combine all forces
    const dropVector = new THREE.Vector3(0, -1, 0).multiplyScalar(deltaTime * drop);
    const liftVector = new THREE.Vector3(0, 1, 0).multiplyScalar(deltaTime * lift);
    const thermalLiftVector = new THREE.Vector3(0, 1, 0).multiplyScalar(deltaTime * thermalLift);
    const velocityVector = direction.clone().multiplyScalar(deltaTime * airSpeed);
    const windVector = this.weather.getWindVelocity(deltaTime);

    const combinedVelocity = new THREE.Vector3()
      .add(dropVector)
      .add(liftVector)
      .add(thermalLiftVector)
      .add(velocityVector)
      .add(windVector);

    // Calculate ground speed
    const pgVelocity = direction.clone().multiplyScalar(airSpeed);
    const windVelocity = this.weather.getWindVelocity();
    const groundSpeed = pgVelocity.add(windVelocity).length();

    // Get height above ground
    const terrainHeight = getTerrainHeightBelowPosition(position, this.terrain, this.water);
    const heightAboveGround = isNaN(terrainHeight) ? 0 : position.y - terrainHeight;

    return {
      velocity: combinedVelocity,
      state: {
        lift,
        drop,
        gradient: this.currentGradient,
        heightAboveGround,
        isOnSpeedBar: this.speedBar,
        isOnEars: this.ears,
        airSpeed,
        groundSpeed,
        insideThermalCount: thermalCount,
      }
    };
  }

  /**
   * Check if position is inside a thermal
   */
  private isInsideThermal(position: THREE.Vector3, thermal: Thermal): boolean {
    const pgBox = new THREE.Box3().setFromCenterAndSize(position, new THREE.Vector3(1, 1, 1));
    const thermalBox = new THREE.Box3().setFromObject(thermal.getMesh());
    return thermalBox.intersectsBox(pgBox);
  }

  /**
   * Count how many thermals the position is inside
   */
  private countInsideHowManyThermals(position: THREE.Vector3): number {
    return this.thermals.filter(thermal => this.isInsideThermal(position, thermal)).length;
  }

  /**
   * Calculate terrain gradient against wind direction for lift calculation
   */
  private getTerrainGradient(position: THREE.Vector3, windDirection: THREE.Vector3): number {
    const delta = 50;
    const heightPos = getTerrainHeightBelowPosition(position, this.terrain, this.water);

    if (isNaN(heightPos)) {
      return 0;
    }

    const posBarlovento = position.clone().addScaledVector(windDirection, -delta);
    const heightPosBarlovento = getTerrainHeightBelowPosition(posBarlovento, this.terrain, this.water);

    const gradient = (heightPos - heightPosBarlovento) / delta;
    return gradient > 0 ? gradient : 0;
  }

  /**
   * Calculate dynamic lift from terrain and wind
   */
  private getLiftValue(position: THREE.Vector3): number {
    const height = getTerrainHeightBelowPosition(position, this.terrain, this.water);

    if (isNaN(height)) {
      return 0;
    }

    const gradient = this.getTerrainGradient(position, this.weather.getWindDirection());
    this.currentGradient = gradient;

    const paragliderHeight = position.y;
    const heightRatio = (paragliderHeight - height) / paragliderHeight;
    const heightLiftComponent = (1 - heightRatio) * height * 0.002;
    const lift = heightLiftComponent * gradient;

    this.currentLift = lift;
    return lift;
  }

  /**
   * Check if position has touched ground
   */
  hasTouchedGround(position: THREE.Vector3): boolean {
    const terrainHeight = getTerrainHeightBelowPosition(position, this.terrain, this.water);
    const closeToTerrain = position.y - terrainHeight < 20;
    return isNaN(terrainHeight) || closeToTerrain;
  }

  // Speed control methods
  toggleSpeedBar(): void {
    this.speedBar = !this.speedBar;
  }

  toggleEars(): void {
    this.ears = !this.ears;
  }

  setSpeedBar(enabled: boolean): void {
    this.speedBar = enabled;
  }

  setEars(enabled: boolean): void {
    this.ears = enabled;
  }

  isOnSpeedBar(): boolean {
    return this.speedBar;
  }

  isOnEars(): boolean {
    return this.ears;
  }

  /**
   * Get current air speed based on trim speed and speed modifications
   */
  getAirSpeed(): number {
    let speed = this.options.trimSpeed;
    if (this.ears) {
      speed *= 0.8;
    }
    if (this.speedBar) {
      speed *= 1.2;
    }
    return speed;
  }

  /**
   * Get current gliding ratio based on speed modifications
   */
  getGlidingRatio(): number {
    let ratio = this.options.glidingRatio;
    if (this.speedBar) {
      ratio *= 0.8;
    }
    if (this.ears) {
      ratio *= 0.8;
    }
    return ratio;
  }

  // Update physics parameters
  updateOptions(options: Partial<ParagliderPhysicsOptions>): void {
    this.options = { ...this.options, ...options };
  }

  updateEnvironment(weather?: Weather, thermals?: Thermal[]): void {
    if (weather) {
      this.weather = weather;
    }
    if (thermals) {
      this.thermals = thermals;
    }
  }
}
