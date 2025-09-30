import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';

export interface YachtOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  trimColor?: string;
  glassColor?: string;
  scale?: number;
}

/**
 * Modern yacht component with realistic floating animation and optional movement
 */
export class Yacht extends MovableBoatComponent {
  constructor(options: YachtOptions = {}) {
    super(
      {
        name: 'Yacht',
        version: '1.0.0',
        description: 'Luxury yacht with realistic floating animation and optional movement',
      },
      {
        hullColor: '#F5F5F5',
        trimColor: '#4169E1',
        glassColor: '#87CEEB',
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.1,
        radius: 250,
        forwardAxis: 'x', // Boats have bow pointing in +Z direction after rotation
        faceDirection: false, // FORWARD pattern handles its own rotation
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const yacht = new THREE.Group();
    yacht.name = 'Yacht';

    const options = this.options as YachtOptions;
    const scale = options.scale || 1;
    console.log('🚤 Creating yacht with options:', options);

    // Create materials with resource sharing
    const hullMaterial = resourceManager.getOrCreateMaterial(
      `yacht_hull_${options.hullColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.hullColor })
    );

    const trimMaterial = resourceManager.getOrCreateMaterial(
      `yacht_trim_${options.trimColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trimColor })
    );

    const glassMaterial = resourceManager.getOrCreateMaterial(
      `yacht_glass_${options.glassColor}`,
      () =>
        new THREE.MeshLambertMaterial({
          color: options.glassColor,
          transparent: true,
          opacity: 0.7,
        })
    );

    // Main hull - sleek and long
    const hullGeometry = resourceManager.getOrCreateGeometry(
      'yacht_hull',
      () => new THREE.BoxGeometry(30, 5, 10)
    );
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = this.options.castShadow ?? true;
    hull.receiveShadow = this.options.receiveShadow ?? true;
    yacht.add(hull);

    // Lower deck
    const lowerDeckGeometry = resourceManager.getOrCreateGeometry(
      'yacht_lower_deck',
      () => new THREE.BoxGeometry(25, 2, 8)
    );
    const lowerDeck = new THREE.Mesh(lowerDeckGeometry, hullMaterial);
    lowerDeck.position.set(0, 3.5, 0);
    lowerDeck.castShadow = this.options.castShadow ?? true;
    lowerDeck.receiveShadow = this.options.receiveShadow ?? true;
    yacht.add(lowerDeck);

    // Upper cabin/bridge
    const cabinGeometry = resourceManager.getOrCreateGeometry(
      'yacht_cabin',
      () => new THREE.BoxGeometry(15, 8, 7)
    );
    const cabin = new THREE.Mesh(cabinGeometry, hullMaterial);
    cabin.position.set(-3, 8, 0);
    cabin.castShadow = this.options.castShadow ?? true;
    cabin.receiveShadow = this.options.receiveShadow ?? true;
    yacht.add(cabin);

    // Bridge/flybridge
    const bridgeGeometry = resourceManager.getOrCreateGeometry(
      'yacht_bridge',
      () => new THREE.BoxGeometry(8, 4, 5)
    );
    const bridge = new THREE.Mesh(bridgeGeometry, hullMaterial);
    bridge.position.set(-3, 14, 0);
    bridge.castShadow = this.options.castShadow ?? true;
    yacht.add(bridge);

    // Trim lines
    const trimGeometry = resourceManager.getOrCreateGeometry(
      'yacht_trim',
      () => new THREE.BoxGeometry(32, 0.5, 10.5)
    );
    const trim = new THREE.Mesh(trimGeometry, trimMaterial);
    trim.position.set(0, 2.5, 0);
    yacht.add(trim);

    // Large windows on main cabin
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'yacht_window',
      () => new THREE.BoxGeometry(12, 5, 0.3)
    );
    const frontWindow = new THREE.Mesh(windowGeometry, glassMaterial);
    frontWindow.position.set(-3, 9, 3.6);
    yacht.add(frontWindow);

    const backWindow = new THREE.Mesh(windowGeometry, glassMaterial);
    backWindow.position.set(-3, 9, -3.6);
    yacht.add(backWindow);

    // Side windows
    const sideWindowGeometry = resourceManager.getOrCreateGeometry(
      'yacht_side_window',
      () => new THREE.BoxGeometry(0.3, 5, 6)
    );
    const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
    leftWindow.position.set(4.6, 9, 0);
    yacht.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
    rightWindow.position.set(-10.6, 9, 0);
    yacht.add(rightWindow);

    // Radar/antenna mast
    const mastGeometry = resourceManager.getOrCreateGeometry(
      'yacht_mast',
      () => new THREE.CylinderGeometry(0.2, 0.2, 8)
    );
    const mast = new THREE.Mesh(mastGeometry, trimMaterial);
    mast.position.set(-3, 20, 0);
    mast.castShadow = this.options.castShadow ?? true;
    yacht.add(mast);

    // Radar dish
    const radarGeometry = resourceManager.getOrCreateGeometry(
      'yacht_radar',
      () => new THREE.CylinderGeometry(1.5, 1.5, 0.3)
    );
    const radar = new THREE.Mesh(radarGeometry, glassMaterial);
    radar.position.set(-3, 24, 0);
    yacht.add(radar);

    // Apply scale
    if (scale !== 1) {
      yacht.scale.setScalar(scale);
    }

    // Rotate 90 degrees to align with forward axis
    yacht.rotateY(Math.PI / 2);

    console.log('🚤 Yacht created with', yacht.children.length, 'children');
    console.log('🚤 Yacht bounding box:', yacht);
    yacht.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log('  - Mesh:', child.name || 'unnamed', 'geometry:', child.geometry, 'material:', child.material);
      }
    });

    return yacht;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as YachtOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as YachtOptions;

    return {
      name: 'Yacht',
      version: '1.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      trimColor: options.trimColor,
      glassColor: options.glassColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const YachtLegacy = Yacht as any;

// Add legacy load method that returns mesh directly
YachtLegacy.prototype.load = function (): THREE.Object3D {
  return this.loadSync();
};

export default YachtLegacy;
