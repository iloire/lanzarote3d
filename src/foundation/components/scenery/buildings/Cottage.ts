import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface CottageOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  scale?: number;
}

/**
 * Cottage building component - Small cozy house with traditional style
 */
export class Cottage extends SimpleThreeComponent {
  constructor(options: CottageOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Cottage',
      version: '1.0.0',
      description: 'Small cozy cottage with traditional architecture',
      tags: ['scenery', 'building', 'traditional', 'residential'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Wheat color for cozy walls
      roofColor: '#8B4513', // Saddle brown for thatched roof
      doorColor: '#654321', // Dark brown for wooden door
      windowColor: '#87CEEB', // Sky blue for glass
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const cottage = new THREE.Group();
    cottage.name = 'Cottage';

    const options = this.options as CottageOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `cottage_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `cottage_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `cottage_door_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `cottage_window_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    const frameMaterial = resourceManager.getOrCreateMaterial(
      'cottage_frame',
      () => new THREE.MeshLambertMaterial({ color: '#4A4A4A' })
    );

    // Main cottage body - smaller and cozy
    const wallsGeometry = resourceManager.getOrCreateGeometry(
      'cottage_walls',
      () => new THREE.BoxGeometry(16, 12, 14)
    );
    const walls = new THREE.Mesh(wallsGeometry, wallMaterial);
    walls.castShadow = this.options.castShadow ?? true;
    walls.receiveShadow = this.options.receiveShadow ?? true;
    cottage.add(walls);

    // Traditional sloped roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'cottage_roof',
      () => new THREE.ConeGeometry(12, 8, 4)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 10, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = this.options.castShadow ?? true;
    cottage.add(roof);

    // Chimney
    const chimneyGeometry = resourceManager.getOrCreateGeometry(
      'cottage_chimney',
      () => new THREE.BoxGeometry(2, 6, 2)
    );
    const chimney = new THREE.Mesh(chimneyGeometry, frameMaterial);
    chimney.position.set(4, 12, 4);
    chimney.castShadow = this.options.castShadow ?? true;
    cottage.add(chimney);

    // Front door - arched style
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'cottage_door',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -2, 7.25);
    cottage.add(door);

    // Door frame
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'cottage_door_frame',
      () => new THREE.BoxGeometry(5, 9, 1)
    );
    const doorFrame = new THREE.Mesh(doorFrameGeometry, frameMaterial);
    doorFrame.position.set(0, -2, 7);
    cottage.add(doorFrame);

    // Cottage windows - smaller and more traditional
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'cottage_window',
      () => new THREE.BoxGeometry(3, 3, 0.3)
    );

    // Front windows (2 small windows)
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-5, 2, 7.15);
    cottage.add(leftWindow);

    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(5, 2, 7.15);
    cottage.add(rightWindow);

    // Side windows
    const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow.position.set(8.15, 2, 0);
    cottage.add(sideWindow);

    // Window frames
    const frameGeometry = resourceManager.getOrCreateGeometry(
      'cottage_window_frame',
      () => new THREE.BoxGeometry(3.5, 3.5, 0.5)
    );

    [leftWindow, rightWindow, sideWindow].forEach(window => {
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.copy(window.position);
      frame.position.z -= 0.1; // Slightly behind window
      cottage.add(frame);
    });

    // Garden fence (decorative)
    const fenceGeometry = resourceManager.getOrCreateGeometry(
      'cottage_fence',
      () => new THREE.BoxGeometry(20, 2, 0.5)
    );
    const fence = new THREE.Mesh(fenceGeometry, frameMaterial);
    fence.position.set(0, -5, 10);
    cottage.add(fence);

    // Apply scale
    if (scale !== 1) {
      cottage.scale.setScalar(scale);
    }

    return cottage;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as CottageOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as CottageOptions;

    return {
      name: 'Cottage',
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'traditional',
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const CottageLegacy = Cottage as any;

// Add legacy load method that returns mesh directly
CottageLegacy.prototype.load = function (): THREE.Object3D {
  return this.loadSync();
};

export default CottageLegacy;