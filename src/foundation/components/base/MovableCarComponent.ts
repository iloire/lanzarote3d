import * as THREE from 'three';
import { SimpleThreeComponent } from './SimpleThreeComponent';
import { MovingBehavior, MovingBehaviorOptions, MovementPattern } from '../../systems/behaviors/MovingBehavior';
import { TerrainNavigator, TerrainNavigatorOptions } from '../../systems/behaviors/TerrainNavigator';
import type { ComponentMetadata } from './IThreeComponent';

export interface MovableCarComponentOptions extends MovingBehaviorOptions {
  // Movement configuration
  enableMovement?: boolean;
  autoStartMoving?: boolean;

  // Terrain following options
  terrain?: THREE.Mesh;
  heightOffset?: number;
  maxSlope?: number;
  terrainSampleRadius?: number;

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
 * Base class for cars that can optionally move while following terrain
 * Extends SimpleThreeComponent with optional movement and terrain following capabilities
 */
export abstract class MovableCarComponent extends SimpleThreeComponent {
  private movingBehavior: MovingBehavior | null = null;
  private terrainNavigator: TerrainNavigator | null = null;
  private enableMovement: boolean;
  private terrain: THREE.Mesh | null = null;
  private heightOffset: number;
  private currentMesh: THREE.Object3D | null = null;

  constructor(metadata: ComponentMetadata, options: MovableCarComponentOptions = {}) {
    super(metadata, options);

    this.enableMovement = options.enableMovement ?? false;
    this.terrain = options.terrain || null;
    this.heightOffset = options.heightOffset || 3; // Cars hover slightly above terrain

    // Only create moving behavior if movement is enabled
    if (this.enableMovement) {
      this.movingBehavior = new MovingBehavior({
        pattern: options.pattern || MovementPattern.CIRCULAR,
        speed: options.speed || 0.2,
        radius: options.radius || 100,
        bounds: options.bounds,
        waypoints: options.waypoints,
        autoStart: options.autoStartMoving ?? true,
        faceDirection: options.faceDirection ?? true,
        forwardAxis: options.forwardAxis || 'x'
      });
    }

    // Create terrain navigator for height following
    if (this.terrain) {
      this.terrainNavigator = new TerrainNavigator({
        terrain: this.terrain,
        sampleRadius: options.terrainSampleRadius || 20,
        maxSlope: options.maxSlope || Math.PI / 4, // 45 degrees max slope
        heightOffset: this.heightOffset,
        smoothingFactor: 0.1
      } as TerrainNavigatorOptions);
    }
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const object = await super.createObject();
    this.currentMesh = object;

    // Integrate moving behavior if enabled
    if (this.movingBehavior) {
      this.movingBehavior.attachTo(object);

      if ((this.options as MovableCarComponentOptions).autoStartMoving ?? true) {
        this.movingBehavior.start();
      }
    }

    // Set initial terrain height
    this.updateTerrainHeight();

    return object;
  }

  /**
   * Load the component synchronously for backward compatibility
   */
  public override loadSync(): THREE.Object3D {
    const content = super.loadSync();
    this.currentMesh = content;

    // Integrate moving behavior if enabled
    if (this.movingBehavior) {
      this.movingBehavior.attachTo(content);

      if ((this.options as MovableCarComponentOptions).autoStartMoving ?? true) {
        this.movingBehavior.start();
      }
    }

    // Set initial terrain height
    this.updateTerrainHeight();

    return content;
  }

  /**
   * Update method called each frame - handles terrain following
   */
  public override update(deltaTime: number): void {
    super.update(deltaTime);

    // Update terrain height if we have terrain navigation
    if (this.terrainNavigator && this.currentMesh) {
      this.updateTerrainHeight();
    }
  }

  /**
   * Update the car's height to follow terrain
   */
  private updateTerrainHeight(): void {
    if (!this.terrainNavigator || !this.currentMesh) return;

    const currentPosition = this.currentMesh.position;
    const terrainData = this.terrainNavigator.sampleTerrain(currentPosition.x, currentPosition.z);

    if (terrainData.isValid) {
      // Smoothly interpolate to the new height
      const targetY = terrainData.height + this.heightOffset;
      const lerpFactor = 0.1; // Smooth height transitions
      this.currentMesh.position.y = THREE.MathUtils.lerp(currentPosition.y, targetY, lerpFactor);

      // Optional: Tilt the car slightly based on terrain slope
      if (terrainData.normal) {
        const up = new THREE.Vector3(0, 1, 0);
        const angle = up.angleTo(terrainData.normal);

        // Only apply tilt if slope is reasonable (not too steep)
        if (angle < Math.PI / 6) { // 30 degrees max tilt
          const tiltAmount = 0.05; // Subtle tilt effect
          this.currentMesh.rotation.x = THREE.MathUtils.lerp(
            this.currentMesh.rotation.x,
            (terrainData.normal.z - 1) * tiltAmount,
            0.1
          );
          this.currentMesh.rotation.z = THREE.MathUtils.lerp(
            this.currentMesh.rotation.z,
            -(terrainData.normal.x - 1) * tiltAmount,
            0.1
          );
        }
      }
    }
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

  public setMovementRadius(radius: number): void {
    if (this.movingBehavior) {
      this.movingBehavior.setRadius(radius);
    }
  }

  public setMovementPattern(pattern: MovementPattern): void {
    if (this.movingBehavior) {
      this.movingBehavior.setPattern(pattern);
    }
  }

  public isMoving(): boolean {
    return this.movingBehavior?.isActive() ?? false;
  }

  /**
   * Set the terrain for height following
   */
  public setTerrain(terrain: THREE.Mesh): void {
    this.terrain = terrain;

    if (this.terrainNavigator) {
      this.terrainNavigator.setTerrain(terrain);
    } else {
      // Create terrain navigator if we didn't have terrain before
      this.terrainNavigator = new TerrainNavigator({
        terrain,
        sampleRadius: 20,
        maxSlope: Math.PI / 4,
        heightOffset: this.heightOffset,
        smoothingFactor: 0.1
      } as TerrainNavigatorOptions);
    }
  }

  /**
   * Update movement origin after the car has been positioned
   */
  public updateMovementOrigin(): void {
    if (this.movingBehavior && this.currentMesh) {
      this.movingBehavior.updateOrigin(this.currentMesh.position);
    }
  }

  /**
   * Get movement information for debugging
   */
  public getMovementInfo(): Record<string, any> {
    if (!this.movingBehavior) {
      return { movement: 'disabled' };
    }

    return {
      movement: {
        enabled: this.enableMovement,
        active: this.movingBehavior.isActive(),
        pattern: this.movingBehavior.getPattern(),
        speed: this.movingBehavior.getSpeed(),
        radius: this.movingBehavior.getRadius()
      },
      terrain: {
        hasNavigator: !!this.terrainNavigator,
        heightOffset: this.heightOffset
      }
    };
  }

  public override dispose(): void {
    if (this.movingBehavior) {
      this.movingBehavior.dispose();
      this.movingBehavior = null;
    }

    if (this.terrainNavigator) {
      this.terrainNavigator.dispose();
      this.terrainNavigator = null;
    }

    this.currentMesh = null;
    super.dispose();
  }
}