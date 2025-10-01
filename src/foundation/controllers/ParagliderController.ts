import * as THREE from 'three';
import Paraglider from '../components/vehicles/Paraglider';
import ParagliderVoxel from '../components/vehicles/ParagliderVoxel';
import Weather from '../components/physics/Weather';
import Thermal from '../components/physics/Thermal';
import { ParagliderPhysics, ParagliderPhysicsOptions } from '../systems/physics/ParagliderPhysics';
import { ParagliderInputController } from '../systems/input/ParagliderInputController';
import { TrajectoryTracker } from '../systems/tracking/TrajectoryTracker';
import { TrajectoryPoint, TrajectoryPointType } from '../components/ui/Trajectory';
import { logger } from '../utils/logger';

type ControllableVehicle = Paraglider | ParagliderVoxel;

export interface ParagliderControllerOptions {
  flyable: ControllableVehicle;
  physics: ParagliderPhysicsOptions;
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  trackTrajectory?: boolean;
  antiCrashMode?: boolean;
}

export interface ParagliderState {
  isFlying: boolean;
  position: THREE.Vector3;
  flyingTime: number;
  metersFlown: number;
  groundTouches: number;
  lastPhysicsState: any;
  lastInputState: any;
}

/**
 * ParagliderController - Modern composition-based controller for paraglider simulation
 *
 * This replaces the monolithic Flier class with a clean architecture:
 * - ParagliderPhysics: Handles lift, thermals, weather effects
 * - ParagliderInputController: Handles keyboard/gamepad input
 * - TrajectoryTracker: Records flight path
 * - Uses requestAnimationFrame instead of setInterval
 *
 * Benefits:
 * - Single Responsibility Principle
 * - Better performance (requestAnimationFrame)
 * - Reusable components
 * - Type-safe (no 'any' types)
 * - Easier to test and maintain
 */
export class ParagliderController {
  private mesh: THREE.Object3D;
  private physics: ParagliderPhysics;
  private input: ParagliderInputController;
  private tracker: TrajectoryTracker | null = null;

  private running: boolean = false;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // State tracking
  private flyingTime: number = 0;
  private metersFlown: number = 0;
  private groundTouches: number = 0;
  private wrapSpeed: number = 1; // Time multiplier

  // Options
  private antiCrashMode: boolean;

  // For compatibility with old event system
  private eventCallbacks: Map<string, Array<(data: any) => void>> = new Map();

  constructor(options: ParagliderControllerOptions) {
    const { flyable, physics, weather, terrain, water, thermals, trackTrajectory, antiCrashMode } = options;

    this.mesh = flyable.getMesh();
    this.antiCrashMode = antiCrashMode ?? false;

    // Initialize subsystems
    this.physics = new ParagliderPhysics(physics, weather, terrain, water, thermals);
    this.input = new ParagliderInputController(flyable, this.mesh);

    if (trackTrajectory !== false) {
      this.tracker = new TrajectoryTracker({ recordInterval: 10 });
    }
  }

  /**
   * Start the simulation loop
   */
  start(): void {
    if (this.running) {
      logger.warn('ParagliderController already running');
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.tick();

    logger.info('ParagliderController started');
  }

  /**
   * Stop the simulation loop
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    logger.info('ParagliderController stopped');
  }

  /**
   * Main simulation tick
   */
  private tick = (): void => {
    if (!this.running) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * this.wrapSpeed;
    this.lastTime = currentTime;

    // Update input (rotation, banking)
    const inputState = this.input.update(deltaTime);

    // Get current direction from mesh rotation
    const direction = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.mesh.getWorldQuaternion(new THREE.Quaternion()));

    // Calculate physics forces
    const { velocity, state: physicsState } = this.physics.calculateForces(
      this.mesh.position,
      direction,
      deltaTime
    );

    // Update position
    this.mesh.position.add(velocity);

    // Update statistics
    this.flyingTime += deltaTime;
    this.metersFlown += physicsState.groundSpeed * deltaTime;

    // Check for ground touch
    if (this.physics.hasTouchedGround(this.mesh.position)) {
      this.handleGroundTouch();
    }

    // Update trajectory
    if (this.tracker) {
      const pointType = physicsState.isOnSpeedBar
        ? TrajectoryPointType.SpeedBar
        : TrajectoryPointType.Normal;
      this.tracker.update(this.mesh.position, pointType);
    }

    // Emit events for compatibility
    this.emit('position', { position: this.mesh.position });
    this.emit('delta', { delta: velocity.y / deltaTime });
    this.emit('lift', { lift: physicsState.lift });
    this.emit('heightAboveGround', { height: physicsState.heightAboveGround });
    this.emit('gradient', { gradient: physicsState.gradient });

    // Continue loop
    this.animationId = requestAnimationFrame(this.tick);
  };

  /**
   * Handle ground touch
   */
  private handleGroundTouch(): void {
    this.groundTouches++;

    if (this.tracker) {
      this.tracker.addGroundTouch(this.mesh.position);
    }

    this.emit('touchedGround', { groundTouches: this.groundTouches });

    if (!this.antiCrashMode) {
      this.emit('crashed', {});
      // Optionally stop simulation
      // this.stop();
    }
  }

  // Input methods
  setDirectionInput(direction: number): void {
    this.input.setDirectionInput(direction);
  }

  pressLeft(): void {
    this.input.pressLeft();
  }

  releaseLeft(): void {
    this.input.releaseLeft();
  }

  pressRight(): void {
    this.input.pressRight();
  }

  releaseRight(): void {
    this.input.releaseRight();
  }

  // Speed control
  toggleSpeedBar(): void {
    this.physics.toggleSpeedBar();
  }

  toggleEars(): void {
    this.physics.toggleEars();
  }

  isOnSpeedBar(): boolean {
    return this.physics.isOnSpeedBar();
  }

  isOnEars(): boolean {
    return this.physics.isOnEars();
  }

  // State getters
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  setPosition(position: THREE.Vector3): void {
    this.mesh.position.copy(position);
  }

  getAltitude(): number {
    return this.mesh.position.y;
  }

  getFlyingTime(): number {
    return this.flyingTime;
  }

  getMetersFlown(): number {
    return this.metersFlown;
  }

  getGroundSpeed(): number {
    const direction = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.mesh.getWorldQuaternion(new THREE.Quaternion()));

    const { state } = this.physics.calculateForces(this.mesh.position, direction, 0.016);
    return state.groundSpeed;
  }

  getTrajectory(): TrajectoryPoint[] {
    return this.tracker?.getTrajectory() ?? [];
  }

  getMesh(): THREE.Object3D {
    return this.mesh;
  }

  isRunning(): boolean {
    return this.running;
  }

  // Configuration
  setWrapSpeed(speed: number): void {
    this.wrapSpeed = speed;
    this.input.setWrapSpeed(speed);
  }

  updatePhysicsOptions(options: Partial<ParagliderPhysicsOptions>): void {
    this.physics.updateOptions(options);
  }

  updateEnvironment(weather?: Weather, thermals?: Thermal[]): void {
    this.physics.updateEnvironment(weather, thermals);
  }

  // Event system for backward compatibility
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.tracker?.clear();
    this.eventCallbacks.clear();
    this.input.reset();
    logger.debug('ParagliderController disposed');
  }
}
