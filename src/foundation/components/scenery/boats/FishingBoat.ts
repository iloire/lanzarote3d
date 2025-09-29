import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';

export interface FishingBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  cabinColor?: string;
  mastColor?: string;
  scale?: number;
}

/**
 * Modern fishing boat component with realistic floating animation and optional movement
 */
export class FishingBoat extends MovableBoatComponent {
  constructor(options: FishingBoatOptions = {}) {
    super(
      {
        name: 'FishingBoat',
        version: '1.0.0',
        description: 'Fishing boat with realistic floating animation and optional movement',
      },
      {
        hullColor: '#8B4513',
        cabinColor: '#FFFFFF',
        mastColor: '#654321',
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: false,
        pattern: MovementPattern.PATROL,
        speed: 0.4,
        radius: 120,
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
    boat.name = 'FishingBoat';

    const options = this.options as FishingBoatOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(
      `fishing_boat_hull_${options.hullColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.hullColor })
    );

    const cabinMaterial = resourceManager.getOrCreateMaterial(
      `fishing_boat_cabin_${options.cabinColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.cabinColor })
    );

    const mastMaterial = resourceManager.getOrCreateMaterial(
      `fishing_boat_mast_${options.mastColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.mastColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      'fishing_boat_windows',
      () => new THREE.MeshLambertMaterial({ color: 0x333333 })
    );

    // Main hull - longer and wider than sailboat
    const hullGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_hull',
      () => new THREE.BoxGeometry(20, 4, 8)
    );
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = this.options.castShadow ?? true;
    hull.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(hull);

    // Cabin structure
    const cabinGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_cabin',
      () => new THREE.BoxGeometry(12, 6, 6)
    );
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-2, 5, 0);
    cabin.castShadow = this.options.castShadow ?? true;
    cabin.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(cabin);

    // Cabin roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_roof',
      () => new THREE.BoxGeometry(13, 1, 7)
    );
    const roof = new THREE.Mesh(roofGeometry, hullMaterial);
    roof.position.set(-2, 8.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    roof.receiveShadow = this.options.receiveShadow ?? true;
    boat.add(roof);

    // Fishing mast/pole
    const mastGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_mast',
      () => new THREE.CylinderGeometry(0.3, 0.3, 12)
    );
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(6, 8, 0);
    mast.castShadow = this.options.castShadow ?? true;
    boat.add(mast);

    // Cross beam on mast
    const beamGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_beam',
      () => new THREE.CylinderGeometry(0.2, 0.2, 6)
    );
    const beam = new THREE.Mesh(beamGeometry, mastMaterial);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(6, 12, 0);
    beam.castShadow = this.options.castShadow ?? true;
    boat.add(beam);

    // Wheelhouse windows (simple dark rectangles)
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'fishing_boat_window',
      () => new THREE.BoxGeometry(8, 3, 0.2)
    );
    const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow.position.set(-2, 6, 3.1);
    boat.add(frontWindow);

    const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow.rotation.y = Math.PI / 2;
    sideWindow.position.set(4, 6, 0);
    boat.add(sideWindow);

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
    const options = this.options as FishingBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as FishingBoatOptions;

    return {
      name: 'FishingBoat',
      version: '1.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      cabinColor: options.cabinColor,
      mastColor: options.mastColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const FishingBoatLegacy = FishingBoat as any;

// Add legacy load method that returns mesh directly
FishingBoatLegacy.prototype.load = function (): THREE.Object3D {
  return this.loadSync();
};

export default FishingBoatLegacy;
