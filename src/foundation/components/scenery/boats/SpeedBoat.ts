import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';

export interface SpeedBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  accentColor?: string;
  engineColor?: string;
  scale?: number;
}

/**
 * Modern speed boat component with realistic floating animation and optional movement
 */
export class SpeedBoat extends MovableBoatComponent {
  constructor(options: SpeedBoatOptions = {}) {
    super({
      name: 'SpeedBoat',
      version: '1.0.0',
      description: 'Speed boat with realistic floating animation and optional movement'
    }, {
      hullColor: '#FF4500',
      accentColor: '#FFFFFF',
      engineColor: '#333333',
      scale: 1,
      // Movement defaults - disabled by default, can be enabled via options
      enableMovement: false,
      pattern: MovementPattern.LINEAR,
      speed: 0.8,
      radius: 200,
      ...options
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const speedboat = new THREE.Group();
    speedboat.name = 'SpeedBoat';

    const options = this.options as SpeedBoatOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(
      `speed_boat_hull_${options.hullColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.hullColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `speed_boat_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const engineMaterial = resourceManager.getOrCreateMaterial(
      `speed_boat_engine_${options.engineColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.engineColor })
    );

    // Sleek hull - narrow and tapered
    const hullGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_hull',
      () => new THREE.BoxGeometry(16, 3, 6)
    );
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = this.options.castShadow ?? true;
    hull.receiveShadow = this.options.receiveShadow ?? true;
    speedboat.add(hull);

    // Pointed bow
    const bowGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_bow',
      () => new THREE.ConeGeometry(3, 4, 4)
    );
    const bow = new THREE.Mesh(bowGeometry, hullMaterial);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(10, 0, 0);
    bow.castShadow = this.options.castShadow ?? true;
    speedboat.add(bow);

    // Small cockpit
    const cockpitGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_cockpit',
      () => new THREE.BoxGeometry(8, 4, 4)
    );
    const cockpit = new THREE.Mesh(cockpitGeometry, accentMaterial);
    cockpit.position.set(-2, 3, 0);
    cockpit.castShadow = this.options.castShadow ?? true;
    cockpit.receiveShadow = this.options.receiveShadow ?? true;
    speedboat.add(cockpit);

    // Windshield
    const windshieldGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_windshield',
      () => new THREE.BoxGeometry(6, 3, 0.2)
    );
    const windshield = new THREE.Mesh(windshieldGeometry, accentMaterial);
    windshield.position.set(1, 4.5, 0);
    windshield.rotation.x = -Math.PI / 8; // Slight angle
    speedboat.add(windshield);

    // Engine compartment
    const engineGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_engine_compartment',
      () => new THREE.BoxGeometry(4, 2, 5)
    );
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(-6, 2, 0);
    engine.castShadow = this.options.castShadow ?? true;
    speedboat.add(engine);

    // Outboard motors
    const motorGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_motor',
      () => new THREE.BoxGeometry(1.5, 4, 1.5)
    );
    const leftMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    leftMotor.position.set(-9, 0, -2);
    leftMotor.castShadow = this.options.castShadow ?? true;
    speedboat.add(leftMotor);

    const rightMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    rightMotor.position.set(-9, 0, 2);
    rightMotor.castShadow = this.options.castShadow ?? true;
    speedboat.add(rightMotor);

    // Racing stripes
    const stripeGeometry = resourceManager.getOrCreateGeometry(
      'speed_boat_stripe',
      () => new THREE.BoxGeometry(18, 0.1, 1)
    );
    const leftStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    leftStripe.position.set(0, 1.6, -2);
    speedboat.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    rightStripe.position.set(0, 1.6, 2);
    speedboat.add(rightStripe);

    // Apply scale
    if (scale !== 1) {
      speedboat.scale.setScalar(scale);
    }

    return speedboat;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as SpeedBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as SpeedBoatOptions;

    return {
      name: 'SpeedBoat',
      version: '1.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      accentColor: options.accentColor,
      engineColor: options.engineColor,
      scale: options.scale,
      isFloating: this.isFloating()
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const SpeedBoatLegacy = SpeedBoat as any;

// Add legacy load method that returns mesh directly
SpeedBoatLegacy.prototype.load = function(): THREE.Object3D {
  return this.loadSync();
};

export default SpeedBoatLegacy;