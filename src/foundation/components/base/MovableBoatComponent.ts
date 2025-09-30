import * as THREE from 'three';
import { FloatingThreeComponent, FloatingComponentOptions } from './FloatingThreeComponent';
import {
  MovingBehavior,
  MovingBehaviorOptions,
  MovementPattern,
} from '../../systems/behaviors/MovingBehavior';
import type { ComponentMetadata } from './IThreeComponent';

export interface MovableBoatComponentOptions
  extends FloatingComponentOptions,
    MovingBehaviorOptions {
  // Movement configuration
  enableMovement?: boolean;
  autoStartMoving?: boolean;

  // Movement behavior options are inherited from MovingBehaviorOptions:
  // pattern?: MovementPattern;
  // speed?: number;
  // radius?: number;
  // bounds?: { min: THREE.Vector3; max: THREE.Vector3 };
  // waypoints?: THREE.Vector3[];
  // faceDirection?: boolean;
  // forwardAxis?: 'x' | 'z';
}

/**
 * Base class for boats that can optionally move while floating
 * Extends FloatingThreeComponent with optional movement capabilities
 */
export abstract class MovableBoatComponent extends FloatingThreeComponent {
  private movingBehavior: MovingBehavior | null = null;
  private enableMovement: boolean;

  constructor(metadata: ComponentMetadata, options: MovableBoatComponentOptions = {}) {
    super(metadata, options);

    this.enableMovement = options.enableMovement ?? false;

    // Only create moving behavior if movement is enabled
    if (this.enableMovement) {
      this.movingBehavior = new MovingBehavior({
        pattern: options.pattern || MovementPattern.CIRCULAR,
        speed: options.speed || 0.5,
        radius: options.radius || 150,
        bounds: options.bounds,
        waypoints: options.waypoints,
        autoStart: options.autoStartMoving ?? true,
        faceDirection: options.faceDirection ?? true,
        forwardAxis: options.forwardAxis || 'z', // Default changed to 'z' after boat rotation
      });
    }
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const object = await super.createObject();

    // Integrate moving behavior if enabled
    if (this.movingBehavior) {
      this.movingBehavior.attachTo(object);

      if ((this.options as MovableBoatComponentOptions).autoStartMoving ?? true) {
        this.movingBehavior.start();
      }
    }

    return object;
  }


  // Movement control methods (only work if movement is enabled)
  public startMoving(): void {
    if (this.movingBehavior) {
      this.movingBehavior.start();
    }
  }

  public stopMoving(): void {
    if (this.movingBehavior) {
      this.movingBehavior.stop();
    }
  }

  public setMovementSpeed(speed: number): void {
    if (this.movingBehavior) {
      this.movingBehavior.setSpeed(speed);
    }
  }

  public setMovementPattern(pattern: MovementPattern): void {
    if (this.movingBehavior) {
      this.movingBehavior.setPattern(pattern);
    }
  }

  public setWaypoints(waypoints: THREE.Vector3[]): void {
    if (this.movingBehavior) {
      this.movingBehavior.setWaypoints(waypoints);
    }
  }

  public updateMovementOrigin(): void {
    if (this.movingBehavior) {
      this.movingBehavior.updateOriginalPosition();
    }
  }

  public isMoving(): boolean {
    return this.movingBehavior ? this.movingBehavior.isActive() : false;
  }

  public hasMovementCapability(): boolean {
    return this.enableMovement;
  }

  // Combined state info
  public getMovementInfo(): Record<string, any> {
    return {
      isFloating: this.isFloating(),
      isMoving: this.isMoving(),
      hasMovement: this.hasMovementCapability(),
    };
  }

  public override dispose(): void {
    if (this.movingBehavior) {
      this.movingBehavior.dispose();
    }
    super.dispose();
  }
}
