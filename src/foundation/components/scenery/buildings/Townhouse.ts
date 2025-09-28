import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface TownhouseOptions extends SimpleComponentOptions {
  brickColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  trimColor?: string;
  scale?: number;
}

/**
 * Townhouse building component - Multi-story urban building
 */
export class Townhouse extends SimpleThreeComponent {
  constructor(options: TownhouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Townhouse',
      version: '1.0.0',
      description: 'Multi-story urban townhouse with traditional brick architecture',
      tags: ['scenery', 'building', 'urban', 'multi-story', 'residential'],
    };

    super(metadata, {
      brickColor: '#8B4513', // Saddle brown for brick
      roofColor: '#2F4F4F', // Dark slate gray
      doorColor: '#4B0000', // Dark red door
      windowColor: '#F0F8FF', // Alice blue glass
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
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const brickMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_brick_${options.brickColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.brickColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_door_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_window_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    const trimMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_trim_${options.trimColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trimColor })
    );

    // Main townhouse structure - tall and narrow
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_main_body',
      () => new THREE.BoxGeometry(12, 25, 15)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, brickMaterial);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(mainBody);

    // Traditional sloped roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof',
      () => new THREE.BoxGeometry(14, 3, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 14, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Roof peak
    const peakGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof_peak',
      () => new THREE.BoxGeometry(2, 4, 17)
    );
    const peak = new THREE.Mesh(peakGeometry, roofMaterial);
    peak.position.set(0, 16.5, 0);
    peak.castShadow = this.options.castShadow ?? true;
    townhouse.add(peak);

    // Front door
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door',
      () => new THREE.BoxGeometry(3, 7, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -9, 7.75);
    townhouse.add(door);

    // Door frame with steps
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door_frame',
      () => new THREE.BoxGeometry(4, 8, 1)
    );
    const doorFrame = new THREE.Mesh(doorFrameGeometry, trimMaterial);
    doorFrame.position.set(0, -9, 7.5);
    townhouse.add(doorFrame);

    // Front steps
    const stepsGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_steps',
      () => new THREE.BoxGeometry(6, 1, 3)
    );
    const steps = new THREE.Mesh(stepsGeometry, trimMaterial);
    steps.position.set(0, -12, 9);
    townhouse.add(steps);

    // Windows for each floor - create a grid pattern
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_window',
      () => new THREE.BoxGeometry(2.5, 3, 0.3)
    );

    const frameGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_window_frame',
      () => new THREE.BoxGeometry(3, 3.5, 0.5)
    );

    // Ground floor windows (2 windows)
    const groundFloorY = -6;
    for (let i = 0; i < 2; i++) {
      const x = -2.5 + i * 5;

      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, groundFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, trimMaterial);
      frame.position.set(x, groundFloorY, 7.5);
      townhouse.add(frame);
    }

    // Second floor windows (3 windows)
    const secondFloorY = 1;
    for (let i = 0; i < 3; i++) {
      const x = -3 + i * 3;

      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, secondFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, trimMaterial);
      frame.position.set(x, secondFloorY, 7.5);
      townhouse.add(frame);
    }

    // Third floor windows (2 windows)
    const thirdFloorY = 8;
    for (let i = 0; i < 2; i++) {
      const x = -2.5 + i * 5;

      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, thirdFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, trimMaterial);
      frame.position.set(x, thirdFloorY, 7.5);
      townhouse.add(frame);
    }

    // Side windows
    const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow.position.set(6.15, 1, 0);
    townhouse.add(sideWindow);

    const sideFrame = new THREE.Mesh(frameGeometry, trimMaterial);
    sideFrame.position.set(6, 1, 0);
    townhouse.add(sideFrame);

    // Decorative cornices between floors
    const corniceGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_cornice',
      () => new THREE.BoxGeometry(13, 0.5, 16)
    );

    const cornice1 = new THREE.Mesh(corniceGeometry, trimMaterial);
    cornice1.position.set(0, -2.5, 0);
    townhouse.add(cornice1);

    const cornice2 = new THREE.Mesh(corniceGeometry, trimMaterial);
    cornice2.position.set(0, 5, 0);
    townhouse.add(cornice2);

    // Chimney
    const chimneyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_chimney',
      () => new THREE.BoxGeometry(2, 8, 2)
    );
    const chimney = new THREE.Mesh(chimneyGeometry, brickMaterial);
    chimney.position.set(4, 18, 6);
    chimney.castShadow = this.options.castShadow ?? true;
    townhouse.add(chimney);

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as TownhouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as TownhouseOptions;

    return {
      name: 'Townhouse',
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'urban',
      floors: 3,
      brickColor: options.brickColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const TownhouseLegacy = Townhouse as any;

// Add legacy load method that returns mesh directly
TownhouseLegacy.prototype.load = function (): THREE.Object3D {
  return this.loadSync();
};

export default TownhouseLegacy;