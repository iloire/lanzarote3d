import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';

export interface SmallSailBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  sailColor?: string;
  scale?: number;
}

/**
 * Modern small sail boat component with realistic floating animation and optional movement
 */
export class SmallSailBoat extends MovableBoatComponent {
  constructor(options: SmallSailBoatOptions = {}) {
    super(
      {
        name: 'SmallSailBoat',
        version: '1.0.0',
        description: 'Small sail boat with realistic floating animation and optional movement',
      },
      {
        hullColor: '#FFFFFF',
        sailColor: '#666666',
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.08,
        radius: 150,
        forwardAxis: 'z', // Boats have bow pointing in +Z direction after rotation
        faceDirection: true, // FORWARD pattern handles its own rotation
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createObject
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    return this.createSyncContent();
  }

  protected createSyncContent(): THREE.Object3D {
    const boat = new THREE.Group();
    boat.name = 'SmallSailBoat';

    const options = this.options as SmallSailBoatOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(
      `small_sail_boat_hull_${options.hullColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.hullColor })
    );

    const sailMaterial = resourceManager.getOrCreateMaterial(
      `small_sail_boat_sail_${options.sailColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.sailColor })
    );

    // Main hull
    const hullGeometry = resourceManager.getOrCreateGeometry(
      'small_sail_boat_hull',
      () => new THREE.BoxGeometry(10, 2, 4)
    );
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = this.options.castShadow ?? true;
    hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(hull);

    // Sail
    const sailGeometry = resourceManager.getOrCreateGeometry(
      'small_sail_boat_sail',
      () => new THREE.ConeGeometry(2, 6, 3)
    );
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0, 4, 0);
    sail.castShadow = this.options.castShadow ?? true;
    boat.add(sail);

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
    const options = this.options as SmallSailBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as SmallSailBoatOptions;

    return {
      name: 'SmallSailBoat',
      version: '1.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      sailColor: options.sailColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const SmallSailBoatLegacy = SmallSailBoat as any;

// Add legacy load method that returns mesh directly
SmallSailBoatLegacy.prototype.load = function (): THREE.Object3D {
  return this.loadSync();
};

export default SmallSailBoatLegacy;
