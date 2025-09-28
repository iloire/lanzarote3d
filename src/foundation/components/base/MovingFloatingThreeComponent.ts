import * as THREE from 'three';
import { FloatingThreeComponent, FloatingComponentOptions } from './FloatingThreeComponent';
import { MovingBehavior, MovingBehaviorOptions, MovementPattern } from '../../systems/behaviors/MovingBehavior';
import type { ComponentMetadata } from './BaseThreeComponent';

export interface MovingFloatingComponentOptions extends FloatingComponentOptions, MovingBehaviorOptions {
  autoStartMoving?: boolean;
}

/**
 * Base class that combines floating and moving behaviors
 * Perfect for boats that need to bob on water while also moving horizontally
 */
export abstract class MovingFloatingThreeComponent extends FloatingThreeComponent {
  private movingBehavior: MovingBehavior;

  constructor(metadata: ComponentMetadata, options: MovingFloatingComponentOptions = {}) {
    super(metadata, options);

    this.movingBehavior = new MovingBehavior({
      pattern: options.pattern || MovementPattern.RANDOM_DRIFT,
      speed: options.speed || 0.5,
      radius: options.radius || 100,
      bounds: options.bounds,
      waypoints: options.waypoints,
      autoStart: options.autoStartMoving ?? false,
      faceDirection: options.faceDirection ?? true
    });
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const object = await super.createObject();

    // Integrate moving behavior
    this.movingBehavior.attachTo(object);

    if ((this.options as MovingFloatingComponentOptions).autoStartMoving) {
      this.movingBehavior.start();
    }

    return object;
  }

  /**
   * Load the component synchronously for backward compatibility
   */
  public override loadSync(): THREE.Object3D {
    const content = super.loadSync();

    // Integrate moving behavior
    this.movingBehavior.attachTo(content);

    if ((this.options as MovingFloatingComponentOptions).autoStartMoving) {
      this.movingBehavior.start();
    }

    return content;
  }

  // Movement control methods
  public startMoving(): void {
    this.movingBehavior.start();
  }

  public stopMoving(): void {
    this.movingBehavior.stop();
  }

  public setMovementSpeed(speed: number): void {
    this.movingBehavior.setSpeed(speed);
  }

  public setMovementPattern(pattern: MovementPattern): void {
    this.movingBehavior.setPattern(pattern);
  }

  public setWaypoints(waypoints: THREE.Vector3[]): void {
    this.movingBehavior.setWaypoints(waypoints);
  }

  public isMoving(): boolean {
    return this.movingBehavior.isActive();
  }

  // Combined state info
  public getMovementInfo(): Record<string, any> {
    return {
      isFloating: this.isFloating(),
      isMoving: this.isMoving()
    };
  }

  public override dispose(): void {
    this.movingBehavior.dispose();
    super.dispose();
  }
}