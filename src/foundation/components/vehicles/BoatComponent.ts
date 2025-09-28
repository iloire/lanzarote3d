import * as THREE from 'three';
import { AsyncThreeComponent } from '../base/AsyncThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';
import type { ComponentOptions } from '../base/BaseThreeComponent';

export enum BoatType {
  SPEED_BOAT = 'speedboat',
  FISHING_BOAT = 'fishingboat',
  SAIL_BOAT = 'sailboat',
  YACHT = 'yacht'
}

export interface BoatOptions extends ComponentOptions {
  boatType?: BoatType;
  hullColor?: string;
  accentColor?: string;
  engineColor?: string;
  enableFloating?: boolean;
  floatingScale?: number;
}

export interface BoatMovement {
  throttle: number;     // 0-1 (forward speed)
  rudder: number;       // -1 to 1 (left/right steering)
  isMoving: boolean;
}

export class BoatComponent extends AsyncThreeComponent {
  private floatingOffset = Math.random() * Math.PI * 2;
  private originalPosition = new THREE.Vector3();
  private animationId: number | null = null;
  private isFloating = false;
  private movement: BoatMovement = {
    throttle: 0,
    rudder: 0,
    isMoving: false
  };

  // Boat parts
  private hull: THREE.Mesh | null = null;
  private engine: THREE.Object3D | null = null;
  private propWash: THREE.Object3D | null = null;

  constructor(options: BoatOptions = {}) {
    super({
      name: 'BoatComponent',
      version: '1.0.0',
      ...options
    });
  }

  protected async createAsyncContent(): Promise<THREE.Object3D> {
    const container = new THREE.Object3D();
    container.name = 'BoatContainer';

    const options = this.options as BoatOptions;
    const boatType = options.boatType || BoatType.SPEED_BOAT;

    try {
      // Create boat based on type
      const boat = this.createBoatByType(boatType, options);
      container.add(boat);

      // Store original position for floating
      this.originalPosition.copy(container.position);

      // Start floating if enabled
      if (options.enableFloating !== false) {
        this.startFloating(container, options.floatingScale || 1);
      }

      return container;

    } catch (error) {
      console.error('❌ Failed to create boat:', error);
      throw error;
    }
  }

  private createBoatByType(type: BoatType, options: BoatOptions): THREE.Object3D {
    switch (type) {
      case BoatType.SPEED_BOAT:
        return this.createSpeedBoat(options);
      case BoatType.FISHING_BOAT:
        return this.createFishingBoat(options);
      case BoatType.SAIL_BOAT:
        return this.createSailBoat(options);
      case BoatType.YACHT:
        return this.createYacht(options);
      default:
        return this.createSpeedBoat(options);
    }
  }

  private createSpeedBoat(options: BoatOptions): THREE.Object3D {
    const boat = new THREE.Object3D();
    boat.name = 'SpeedBoat';

    const hullColor = options.hullColor || '#FF4500';
    const accentColor = options.accentColor || '#FFFFFF';
    const engineColor = options.engineColor || '#333333';

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(`boat_hull_${hullColor}`, () =>
      new THREE.MeshPhongMaterial({ color: hullColor })
    );
    const accentMaterial = resourceManager.getOrCreateMaterial(`boat_accent_${accentColor}`, () =>
      new THREE.MeshPhongMaterial({ color: accentColor })
    );
    const engineMaterial = resourceManager.getOrCreateMaterial(`boat_engine_${engineColor}`, () =>
      new THREE.MeshPhongMaterial({ color: engineColor })
    );

    // Hull - sleek and tapered
    const hullGeometry = resourceManager.getOrCreateGeometry('speedboat_hull', () =>
      new THREE.BoxGeometry(16, 3, 6)
    );
    this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
    this.hull.castShadow = this.options.castShadow ?? true;
    this.hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(this.hull);

    // Pointed bow
    const bowGeometry = resourceManager.getOrCreateGeometry('speedboat_bow', () =>
      new THREE.ConeGeometry(3, 4, 4)
    );
    const bow = new THREE.Mesh(bowGeometry, hullMaterial);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(10, 0, 0);
    bow.castShadow = this.options.castShadow ?? true;
    boat.add(bow);

    // Cockpit
    const cockpitGeometry = resourceManager.getOrCreateGeometry('speedboat_cockpit', () =>
      new THREE.BoxGeometry(8, 4, 4)
    );
    const cockpit = new THREE.Mesh(cockpitGeometry, accentMaterial);
    cockpit.position.set(-2, 3, 0);
    cockpit.castShadow = this.options.castShadow ?? true;
    boat.add(cockpit);

    // Windshield
    const windshieldGeometry = resourceManager.getOrCreateGeometry('speedboat_windshield', () =>
      new THREE.BoxGeometry(6, 3, 0.2)
    );
    const windshield = new THREE.Mesh(windshieldGeometry, accentMaterial);
    windshield.position.set(1, 4.5, 0);
    windshield.rotation.x = -Math.PI / 8;
    boat.add(windshield);

    // Engine compartment
    const engineGeometry = resourceManager.getOrCreateGeometry('speedboat_engine', () =>
      new THREE.BoxGeometry(4, 2, 5)
    );
    this.engine = new THREE.Mesh(engineGeometry, engineMaterial);
    this.engine.position.set(-6, 2, 0);
    this.engine.castShadow = this.options.castShadow ?? true;
    boat.add(this.engine);

    // Outboard motors
    const motorGeometry = resourceManager.getOrCreateGeometry('speedboat_motor', () =>
      new THREE.BoxGeometry(1.5, 4, 1.5)
    );
    const leftMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    leftMotor.position.set(-9, 0, -2);
    leftMotor.castShadow = this.options.castShadow ?? true;
    boat.add(leftMotor);

    const rightMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    rightMotor.position.set(-9, 0, 2);
    rightMotor.castShadow = this.options.castShadow ?? true;
    boat.add(rightMotor);

    // Racing stripes
    const stripeGeometry = resourceManager.getOrCreateGeometry('speedboat_stripe', () =>
      new THREE.BoxGeometry(18, 0.1, 1)
    );
    const leftStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    leftStripe.position.set(0, 1.6, -2);
    boat.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    rightStripe.position.set(0, 1.6, 2);
    boat.add(rightStripe);

    return boat;
  }

  private createFishingBoat(options: BoatOptions): THREE.Object3D {
    const boat = new THREE.Object3D();
    boat.name = 'FishingBoat';

    const hullColor = options.hullColor || '#8B4513';
    const accentColor = options.accentColor || '#FFFFFF';

    // Create basic fishing boat structure (simplified)
    const hullMaterial = resourceManager.getOrCreateMaterial(`boat_hull_${hullColor}`, () =>
      new THREE.MeshPhongMaterial({ color: hullColor })
    );

    const hullGeometry = resourceManager.getOrCreateGeometry('fishingboat_hull', () =>
      new THREE.BoxGeometry(20, 4, 8)
    );
    this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
    this.hull.castShadow = this.options.castShadow ?? true;
    this.hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(this.hull);

    return boat;
  }

  private createSailBoat(options: BoatOptions): THREE.Object3D {
    const boat = new THREE.Object3D();
    boat.name = 'SailBoat';

    // TODO: Implement sailboat structure with mast and sails
    const hullColor = options.hullColor || '#FFFFFF';

    const hullMaterial = resourceManager.getOrCreateMaterial(`boat_hull_${hullColor}`, () =>
      new THREE.MeshPhongMaterial({ color: hullColor })
    );

    const hullGeometry = resourceManager.getOrCreateGeometry('sailboat_hull', () =>
      new THREE.BoxGeometry(18, 3, 5)
    );
    this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
    this.hull.castShadow = this.options.castShadow ?? true;
    this.hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(this.hull);

    return boat;
  }

  private createYacht(options: BoatOptions): THREE.Object3D {
    const boat = new THREE.Object3D();
    boat.name = 'Yacht';

    // TODO: Implement luxury yacht structure
    const hullColor = options.hullColor || '#FFFFFF';

    const hullMaterial = resourceManager.getOrCreateMaterial(`boat_hull_${hullColor}`, () =>
      new THREE.MeshPhongMaterial({ color: hullColor })
    );

    const hullGeometry = resourceManager.getOrCreateGeometry('yacht_hull', () =>
      new THREE.BoxGeometry(30, 6, 10)
    );
    this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
    this.hull.castShadow = this.options.castShadow ?? true;
    this.hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(this.hull);

    return boat;
  }

  // Floating animation system
  private startFloating(object: THREE.Object3D, scaleMultiplier: number = 1): void {
    if (this.isFloating) return;

    this.isFloating = true;
    this.originalPosition.copy(object.position);

    // Store original rotation Y for yaw drift calculation
    object.userData.originalRotationY = object.rotation.y;

    this.animateFloating(object, scaleMultiplier);
  }

  private animateFloating = (object: THREE.Object3D, scaleMultiplier: number): void => {
    if (!this.isFloating || !object) return;

    const time = Date.now() * 0.001;

    // Realistic ocean wave simulation
    const primaryWave = Math.sin(time * 0.8 + this.floatingOffset) * 4 * scaleMultiplier;
    const secondaryWave = Math.sin(time * 1.3 + this.floatingOffset * 1.2) * 2 * scaleMultiplier;
    const tertiaryWave = Math.cos(time * 0.5 + this.floatingOffset * 0.8) * 1.5 * scaleMultiplier;
    const swellWave = Math.sin(time * 0.3 + this.floatingOffset * 1.5) * 3 * scaleMultiplier;

    // Combine waves for realistic ocean motion
    const totalWaveHeight = primaryWave + secondaryWave + tertiaryWave + swellWave;
    object.position.y = this.originalPosition.y + totalWaveHeight;

    // Realistic boat movement
    object.rotation.z = Math.sin(time * 0.9 + this.floatingOffset * 0.7) * 0.05 * scaleMultiplier;
    object.rotation.x = Math.cos(time * 0.7 + this.floatingOffset * 0.6) * 0.03 * scaleMultiplier;

    // Subtle yaw drift
    const originalY = object.userData.originalRotationY || 0;
    object.rotation.y = originalY + Math.sin(time * 0.4 + this.floatingOffset * 0.4) * 0.02 * scaleMultiplier;

    this.animationId = requestAnimationFrame(() => this.animateFloating(object, scaleMultiplier));
  };

  public stopFloating(): void {
    this.isFloating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Movement controls
  public setThrottle(throttle: number): void {
    this.movement.throttle = Math.max(0, Math.min(1, throttle));
    this.movement.isMoving = this.movement.throttle > 0;
    this.updatePropWash();
  }

  public setRudder(rudder: number): void {
    this.movement.rudder = Math.max(-1, Math.min(1, rudder));
  }

  private updatePropWash(): void {
    // TODO: Add visual prop wash effects based on throttle
  }

  // Getters
  public getMovement(): BoatMovement {
    return { ...this.movement };
  }

  public getBoatType(): BoatType {
    return (this.options as BoatOptions).boatType || BoatType.SPEED_BOAT;
  }

  public isFloatingActive(): boolean {
    return this.isFloating;
  }

  public override dispose(): void {
    this.stopFloating();
    this.hull = null;
    this.engine = null;
    this.propWash = null;
    super.dispose();
  }

  public override validate(): string[] {
    const issues = super.validate();

    if (!this.hull) {
      issues.push('Hull component not created');
    }

    return issues;
  }

  public override getInfo(): Record<string, any> {
    const baseInfo = super.getInfo();

    return {
      ...baseInfo,
      boatType: this.getBoatType(),
      isFloating: this.isFloating,
      movement: this.movement,
      floatingOffset: this.floatingOffset
    };
  }
}