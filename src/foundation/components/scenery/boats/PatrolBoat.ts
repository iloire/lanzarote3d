import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';

export interface PatrolBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  accentColor?: string;
  flagColor?: string;
  scale?: number;
}

/**
 * Patrol boat that moves around while floating
 * Based on SpeedBoat design with added flag for identification
 */
export class PatrolBoat extends MovableBoatComponent {
  constructor(options: PatrolBoatOptions = {}) {
    super(
      {
        name: 'PatrolBoat',
        version: '1.0.0',
        description: 'Patrol boat with movement and floating animation',
      },
      {
        // Default colors - distinctive blue/white coast guard style
        hullColor: '#0066CC',
        accentColor: '#FFFFFF',
        flagColor: '#FF0000',
        scale: 1,
        // Movement defaults - ENABLED by default for PatrolBoat
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.2,
        radius: 400,
        autoStartMoving: true,
        autoStartFloating: true,
        faceDirection: true,
        forwardAxis: 'x', // Boats have bow pointing in +X direction
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const boat = new THREE.Group();
    boat.name = 'PatrolBoat';

    const options = this.options as PatrolBoatOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(
      `patrol_boat_hull_${options.hullColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.hullColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `patrol_boat_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const flagMaterial = resourceManager.getOrCreateMaterial(
      `patrol_boat_flag_${options.flagColor}`,
      () =>
        new THREE.MeshLambertMaterial({
          color: options.flagColor,
          side: THREE.DoubleSide,
        })
    );

    const engineMaterial = resourceManager.getOrCreateMaterial(
      'patrol_boat_engine',
      () => new THREE.MeshLambertMaterial({ color: '#333333' })
    );

    // Main hull - based on SpeedBoat
    const hullGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_hull',
      () => new THREE.BoxGeometry(16, 3, 6)
    );
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = this.options.castShadow ?? true;
    hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(hull);

    // Pointed bow
    const bowGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_bow',
      () => new THREE.ConeGeometry(3, 4, 4)
    );
    const bow = new THREE.Mesh(bowGeometry, hullMaterial);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(10, 0, 0);
    bow.castShadow = this.options.castShadow ?? true;
    boat.add(bow);

    // Cockpit/Bridge
    const cockpitGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_cockpit',
      () => new THREE.BoxGeometry(8, 4, 4)
    );
    const cockpit = new THREE.Mesh(cockpitGeometry, accentMaterial);
    cockpit.position.set(-2, 3, 0);
    cockpit.castShadow = this.options.castShadow ?? true;
    cockpit.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(cockpit);

    // Windshield
    const windshieldGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_windshield',
      () => new THREE.BoxGeometry(6, 3, 0.2)
    );
    const windshield = new THREE.Mesh(windshieldGeometry, accentMaterial);
    windshield.position.set(1, 4.5, 0);
    windshield.rotation.x = -Math.PI / 8;
    boat.add(windshield);

    // Engine compartment
    const engineGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_engine',
      () => new THREE.BoxGeometry(4, 2, 5)
    );
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(-6, 2, 0);
    engine.castShadow = this.options.castShadow ?? true;
    boat.add(engine);

    // Outboard motors
    const motorGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_motor',
      () => new THREE.BoxGeometry(1.5, 4, 1.5)
    );
    const leftMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    leftMotor.position.set(-9, 0, -2);
    leftMotor.castShadow = this.options.castShadow ?? true;
    boat.add(leftMotor);

    const rightMotor = new THREE.Mesh(motorGeometry, engineMaterial);
    rightMotor.position.set(-9, 0, 2);
    rightMotor.castShadow = this.options.castShadow ?? true;
    boat.add(rightMotor);

    // Distinctive flag pole and flag
    const poleGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_pole',
      () => new THREE.CylinderGeometry(0.1, 0.1, 8)
    );
    const pole = new THREE.Mesh(poleGeometry, engineMaterial);
    pole.position.set(-4, 8, 0);
    boat.add(pole);

    // Flag
    const flagGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_flag',
      () => new THREE.PlaneGeometry(3, 2)
    );
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(-5.5, 11, 0);
    flag.rotation.y = Math.PI / 4; // Angle the flag
    boat.add(flag);

    // Coast guard stripes
    const stripeGeometry = resourceManager.getOrCreateGeometry(
      'patrol_boat_stripe',
      () => new THREE.BoxGeometry(18, 0.3, 0.1)
    );

    const topStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    topStripe.position.set(0, 2, 3.1);
    boat.add(topStripe);

    const bottomStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
    bottomStripe.position.set(0, 0.5, 3.1);
    boat.add(bottomStripe);

    const topStripeBack = new THREE.Mesh(stripeGeometry, accentMaterial);
    topStripeBack.position.set(0, 2, -3.1);
    boat.add(topStripeBack);

    const bottomStripeBack = new THREE.Mesh(stripeGeometry, accentMaterial);
    bottomStripeBack.position.set(0, 0.5, -3.1);
    boat.add(bottomStripeBack);

    // Apply scale
    if (scale !== 1) {
      boat.scale.setScalar(scale);
    }

    // Rotate 90 degrees to align with forward axis
    boat.rotateY(Math.PI / 2);

    return boat;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as PatrolBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as PatrolBoatOptions;

    return {
      name: 'PatrolBoat',
      version: '1.0.0',
      type: 'patrol_boat',
      hullColor: options.hullColor,
      accentColor: options.accentColor,
      flagColor: options.flagColor,
      scale: options.scale,
      ...this.getMovementInfo(),
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const PatrolBoatLegacy = PatrolBoat as any;

// Add legacy load method that returns mesh directly
PatrolBoatLegacy.prototype.load = function (): THREE.Object3D {
  const boat = this.loadSync();
  // Start moving after legacy load
  this.startMoving();
  return boat;
};

export default PatrolBoatLegacy;
