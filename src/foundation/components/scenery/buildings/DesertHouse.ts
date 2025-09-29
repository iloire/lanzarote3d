import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface DesertHouseOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  accentColor?: string;
  scale?: number;
  lowPoly?: boolean;
}

/**
 * Desert House building component - Simple adobe-style house typical of desert regions
 */
export class DesertHouse extends SimpleThreeComponent {
  constructor(options: DesertHouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DesertHouse',
      version: '1.0.0',
      description: 'Simple desert adobe-style house with sun-baked architecture',
      tags: ['scenery', 'building', 'desert', 'adobe', 'residential'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Sandy beige for adobe walls
      roofColor: '#DEB887', // Burlywood for flat roof
      doorColor: '#8B4513', // Saddle brown for wooden door
      windowColor: '#4682B4', // Steel blue for glass
      accentColor: '#D2691E', // Chocolate brown for accents
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const desertHouse = new THREE.Group();
    desertHouse.name = 'DesertHouse';

    const options = this.options as DesertHouseOptions;
    const scale = options.scale || 1;
    const isLowPoly = options.lowPoly || false;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_door_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_window_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    // Main house structure - simple cubic adobe style
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_main_body',
      () => new THREE.BoxGeometry(18, 14, 16)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 7, 0); // Position so bottom is at y=0 (ground level)
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    desertHouse.add(mainBody);

    // Flat roof typical of desert architecture
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_roof',
      () => new THREE.BoxGeometry(20, 1.5, 18)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 14.75, 0); // Adjusted for main body repositioning
    roof.castShadow = this.options.castShadow ?? true;
    desertHouse.add(roof);

    // Small parapet wall around roof edge (skip for low-poly)
    if (!isLowPoly) {
      const parapetGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_parapet',
        () => new THREE.BoxGeometry(20.5, 2, 18.5)
      );
      const parapet = new THREE.Mesh(parapetGeometry, wallMaterial);
      parapet.position.set(0, 15.5, 0); // Adjusted for main body repositioning
      desertHouse.add(parapet);
    }

    // Simple arched doorway
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_door',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 4, 8.25); // Adjusted for main body repositioning
    desertHouse.add(door);

    // Arched door frame (skip for low-poly)
    if (!isLowPoly) {
      const archGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_arch',
        () => new THREE.RingGeometry(2, 2.5, 0, Math.PI)
      );
      const arch = new THREE.Mesh(archGeometry, accentMaterial);
      arch.position.set(0, 8, 8.1); // Adjusted for main body repositioning
      arch.rotation.z = Math.PI;
      desertHouse.add(arch);
    }

    // Windows - simplified for low-poly mode
    if (isLowPoly) {
      // Low-poly: just one simple window, no frames
      const windowLowPolyGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window_lowpoly',
        () => new THREE.BoxGeometry(2, 2, 0.2)
      );

      const singleWindow = new THREE.Mesh(windowLowPolyGeometry, windowMaterial);
      singleWindow.position.set(0, 8, 8.1);
      desertHouse.add(singleWindow);

    } else {
      // Full detail windows with frames
      const windowGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window',
        () => new THREE.BoxGeometry(2.5, 2.5, 0.3)
      );

      // Side windows - asymmetrical placement for authentic look
      const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      leftWindow.position.set(-6, 9, 8.15); // Adjusted for main body repositioning
      desertHouse.add(leftWindow);

      const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      rightWindow.position.set(6, 8, 8.15); // Adjusted for main body repositioning
      desertHouse.add(rightWindow);

      // Side wall window
      const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      sideWindow.position.set(9.15, 7, 0); // Adjusted for main body repositioning
      desertHouse.add(sideWindow);

      // Window frames with desert accent color
      const frameGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window_frame',
        () => new THREE.BoxGeometry(3, 3, 0.5)
      );

      [leftWindow, rightWindow, sideWindow].forEach(window => {
        const frame = new THREE.Mesh(frameGeometry, accentMaterial);
        frame.position.copy(window.position);
        frame.position.z -= 0.1; // Slightly behind window
        desertHouse.add(frame);
      });
    }

    // Decorative elements (skip for low-poly)
    if (!isLowPoly) {
      // Small courtyard wall (typical of desert architecture)
      const courtyardWallGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_courtyard_wall',
        () => new THREE.BoxGeometry(12, 4, 1)
      );
      const courtyardWall = new THREE.Mesh(courtyardWallGeometry, wallMaterial);
      courtyardWall.position.set(-8, 2, 10); // Adjusted for main body repositioning
      desertHouse.add(courtyardWall);

      // Desert plants/decoration (simple geometric cactus)
      const cactusGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_cactus',
        () => new THREE.CylinderGeometry(0.5, 0.8, 6)
      );
      const cactusMaterial = resourceManager.getOrCreateMaterial(
        'desert_house_cactus',
        () => new THREE.MeshLambertMaterial({ color: '#228B22' })
      );

      const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
      cactus.position.set(-12, 3, 6); // Adjusted for main body repositioning
      desertHouse.add(cactus);

      // Cactus arm
      const cactusArmGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_cactus_arm',
        () => new THREE.CylinderGeometry(0.3, 0.4, 3)
      );
      const cactusArm = new THREE.Mesh(cactusArmGeometry, cactusMaterial);
      cactusArm.position.set(-10.5, 5, 6); // Adjusted for main body repositioning
      cactusArm.rotation.z = Math.PI / 2;
      desertHouse.add(cactusArm);

      // Small shade structure (ramada)
      const shadeGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_shade',
        () => new THREE.BoxGeometry(8, 0.5, 6)
      );
      const shade = new THREE.Mesh(shadeGeometry, accentMaterial);
      shade.position.set(8, 11, -6); // Adjusted for main body repositioning
      desertHouse.add(shade);

      // Shade posts
      const postGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_post',
        () => new THREE.CylinderGeometry(0.3, 0.3, 8)
      );

      const posts = [
        new THREE.Vector3(5, 4, -8), // Adjusted for main body repositioning
        new THREE.Vector3(11, 4, -8), // Adjusted for main body repositioning
        new THREE.Vector3(5, 4, -4), // Adjusted for main body repositioning
        new THREE.Vector3(11, 4, -4) // Adjusted for main body repositioning
      ];

      posts.forEach(pos => {
        const post = new THREE.Mesh(postGeometry, accentMaterial);
        post.position.copy(pos);
        desertHouse.add(post);
      });
    }

    // Apply scale
    if (scale !== 1) {
      desertHouse.scale.setScalar(scale);
    }

    return desertHouse;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DesertHouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as DesertHouseOptions;

    return {
      name: 'DesertHouse',
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'adobe',
      climate: 'desert',
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const DesertHouseLegacy = DesertHouse as any;

// Add legacy load method that returns mesh directly
DesertHouseLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default DesertHouseLegacy;