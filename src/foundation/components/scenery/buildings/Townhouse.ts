import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface TownhouseOptions extends SimpleComponentOptions {
  wallColor?: string;
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
      wallColor: '#FFFACD', // Light yellow (lemon chiffon)
      roofColor: '#DEB887', // Burlywood matching desert house
      doorColor: '#228B22', // Forest green door
      windowColor: '#4169E1', // Royal blue windows
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
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
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

    // Main townhouse structure - tall and narrow (2-story)
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_main_body',
      () => new THREE.BoxGeometry(12, 18, 15)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 9, 0); // Position so bottom is at y=0 (ground level)
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(mainBody);

    // Traditional sloped roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof',
      () => new THREE.BoxGeometry(14, 3, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 19.5, 0); // Adjusted for main body repositioning
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Roof peak
    const peakGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof_peak',
      () => new THREE.BoxGeometry(2, 4, 17)
    );
    const peak = new THREE.Mesh(peakGeometry, roofMaterial);
    peak.position.set(0, 22, 0); // Adjusted for main body repositioning
    peak.castShadow = this.options.castShadow ?? true;
    townhouse.add(peak);

    // Front door
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door',
      () => new THREE.BoxGeometry(3, 7, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0, 7.75); // Adjusted for main body repositioning
    townhouse.add(door);

    // Door frame with steps
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door_frame',
      () => new THREE.BoxGeometry(4, 8, 1)
    );
    const doorFrame = new THREE.Mesh(doorFrameGeometry, trimMaterial);
    doorFrame.position.set(0, 0, 7.5); // Adjusted for main body repositioning
    townhouse.add(doorFrame);

    // Front steps
    const stepsGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_steps',
      () => new THREE.BoxGeometry(6, 1, 3)
    );
    const steps = new THREE.Mesh(stepsGeometry, trimMaterial);
    steps.position.set(0, -3, 9); // Adjusted for main body repositioning
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
    const groundFloorY = 3; // Adjusted for main body repositioning
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
    const secondFloorY = 10; // Adjusted for main body repositioning
    for (let i = 0; i < 3; i++) {
      const x = -3 + i * 3;

      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, secondFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, trimMaterial);
      frame.position.set(x, secondFloorY, 7.5);
      townhouse.add(frame);
    }


    // Side windows
    const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow.position.set(6.15, 10, 0); // Adjusted for main body repositioning
    townhouse.add(sideWindow);

    const sideFrame = new THREE.Mesh(frameGeometry, trimMaterial);
    sideFrame.position.set(6, 10, 0); // Adjusted for main body repositioning
    townhouse.add(sideFrame);

    // Decorative cornices between floors (adjusted for 2-story)
    const corniceGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_cornice',
      () => new THREE.BoxGeometry(13, 0.5, 16)
    );

    const cornice1 = new THREE.Mesh(corniceGeometry, trimMaterial);
    cornice1.position.set(0, 6.5, 0); // Adjusted for main body repositioning
    townhouse.add(cornice1);

    const cornice2 = new THREE.Mesh(corniceGeometry, trimMaterial);
    cornice2.position.set(0, 11, 0); // Adjusted for main body repositioning
    townhouse.add(cornice2);

    // Chimney (adjusted for reduced building height)
    const chimneyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_chimney',
      () => new THREE.BoxGeometry(2, 8, 2)
    );
    const chimney = new THREE.Mesh(chimneyGeometry, wallMaterial);
    chimney.position.set(4, 22, 6); // Adjusted for main body repositioning
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
      floors: 2,
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const TownhouseLegacy = Townhouse as any;

// Add legacy load method that returns mesh directly
TownhouseLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default TownhouseLegacy;