import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface BarnOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  trimColor?: string;
  scale?: number;
}

/**
 * Barn building component - Rural agricultural building
 */
export class Barn extends SimpleThreeComponent {
  constructor(options: BarnOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Barn',
      version: '1.0.0',
      description: 'Traditional rural barn with agricultural architecture',
      tags: ['scenery', 'building', 'rural', 'agricultural', 'traditional'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Sandy beige matching desert house
      roofColor: '#DEB887', // Burlywood matching desert house
      doorColor: '#654321', // Brown wooden doors
      trimColor: '#FFFFFF', // White trim
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const barn = new THREE.Group();
    barn.name = 'Barn';

    const options = this.options as BarnOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `barn_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `barn_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `barn_door_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const trimMaterial = resourceManager.getOrCreateMaterial(
      `barn_trim_${options.trimColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trimColor })
    );

    // Main barn structure - long and wide
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'barn_main_body',
      () => new THREE.BoxGeometry(30, 18, 20)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    barn.add(mainBody);

    // Gambrel roof (traditional barn roof) - use multiple parts
    const roofLowerGeometry = resourceManager.getOrCreateGeometry(
      'barn_roof_lower',
      () => new THREE.BoxGeometry(32, 4, 22)
    );
    const roofLower = new THREE.Mesh(roofLowerGeometry, roofMaterial);
    roofLower.position.set(0, 11, 0);
    roofLower.rotation.x = -Math.PI / 12; // Slight angle
    roofLower.castShadow = this.options.castShadow ?? true;
    barn.add(roofLower);

    const roofUpperGeometry = resourceManager.getOrCreateGeometry(
      'barn_roof_upper',
      () => new THREE.BoxGeometry(26, 4, 22)
    );
    const roofUpper = new THREE.Mesh(roofUpperGeometry, roofMaterial);
    roofUpper.position.set(0, 15, 0);
    roofUpper.rotation.x = -Math.PI / 6; // Steeper angle
    roofUpper.castShadow = this.options.castShadow ?? true;
    barn.add(roofUpper);

    // Large barn doors - traditional sliding style
    const largeDoorGeometry = resourceManager.getOrCreateGeometry(
      'barn_large_door',
      () => new THREE.BoxGeometry(8, 12, 0.5)
    );

    const leftDoor = new THREE.Mesh(largeDoorGeometry, doorMaterial);
    leftDoor.position.set(-4, -3, 10.25);
    barn.add(leftDoor);

    const rightDoor = new THREE.Mesh(largeDoorGeometry, doorMaterial);
    rightDoor.position.set(4, -3, 10.25);
    barn.add(rightDoor);

    // Door frame and track
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'barn_door_frame',
      () => new THREE.BoxGeometry(18, 14, 1)
    );
    const doorFrame = new THREE.Mesh(doorFrameGeometry, trimMaterial);
    doorFrame.position.set(0, -3, 10);
    barn.add(doorFrame);

    // Barn windows - small and high up
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'barn_window',
      () => new THREE.BoxGeometry(3, 2, 0.3)
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      'barn_window_glass',
      () => new THREE.MeshLambertMaterial({ color: '#333333' })
    );

    // Side windows
    const leftSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftSideWindow.position.set(-15.15, 4, 5);
    barn.add(leftSideWindow);

    const rightSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightSideWindow.position.set(15.15, 4, 5);
    barn.add(rightSideWindow);

    // Hay loft door (upper level)
    const loftDoorGeometry = resourceManager.getOrCreateGeometry(
      'barn_loft_door',
      () => new THREE.BoxGeometry(4, 4, 0.3)
    );
    const loftDoor = new THREE.Mesh(loftDoorGeometry, doorMaterial);
    loftDoor.position.set(0, 6, 10.15);
    barn.add(loftDoor);

    // Weathervane on roof peak
    const weathervaneGeometry = resourceManager.getOrCreateGeometry(
      'barn_weathervane',
      () => new THREE.CylinderGeometry(0.1, 0.1, 4)
    );
    const weathervane = new THREE.Mesh(weathervaneGeometry, trimMaterial);
    weathervane.position.set(0, 18, 0);
    barn.add(weathervane);

    // Weathervane arrow
    const arrowGeometry = resourceManager.getOrCreateGeometry(
      'barn_weathervane_arrow',
      () => new THREE.BoxGeometry(3, 0.2, 0.5)
    );
    const arrow = new THREE.Mesh(arrowGeometry, trimMaterial);
    arrow.position.set(0, 19.5, 0);
    barn.add(arrow);

    // Fence posts around barn (decorative)
    const fencePostGeometry = resourceManager.getOrCreateGeometry(
      'barn_fence_post',
      () => new THREE.CylinderGeometry(0.3, 0.3, 6)
    );

    // Create fence line
    for (let i = 0; i < 8; i++) {
      const fencePost = new THREE.Mesh(fencePostGeometry, doorMaterial);
      fencePost.position.set(-21 + i * 6, -6, 15);
      barn.add(fencePost);
    }

    // Horizontal fence rails
    const railGeometry = resourceManager.getOrCreateGeometry(
      'barn_fence_rail',
      () => new THREE.BoxGeometry(42, 0.5, 1)
    );
    const topRail = new THREE.Mesh(railGeometry, doorMaterial);
    topRail.position.set(0, -4, 15);
    barn.add(topRail);

    const bottomRail = new THREE.Mesh(railGeometry, doorMaterial);
    bottomRail.position.set(0, -7, 15);
    barn.add(bottomRail);

    // Apply scale
    if (scale !== 1) {
      barn.scale.setScalar(scale);
    }

    return barn;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as BarnOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as BarnOptions;

    return {
      name: 'Barn',
      version: '1.0.0',
      type: 'building',
      subtype: 'agricultural',
      style: 'traditional',
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const BarnLegacy = Barn as any;

// Add legacy load method that returns mesh directly
BarnLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default BarnLegacy;