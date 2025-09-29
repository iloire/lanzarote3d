import * as THREE from 'three';
import GuiHelper from '../../../utils/gui';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export enum HouseType {
  Small,   // 2 wings
  Medium,  // 3 wings
  Large,   // 4 wings
  Modern,  // 4 wings with modern styling
}

export interface HouseOptions extends SimpleComponentOptions {
  type: HouseType;
  wallColor?: string;
  accentColor?: string;
  roofColor?: string;
  windowColor?: string;
  scale?: number;
}

/**
 * House building component - Villa-based architecture with configurable wing count
 */
class House extends SimpleThreeComponent {
  private type: HouseType;

  constructor(options: HouseOptions = { type: HouseType.Small }) {
    const metadata: ComponentMetadata = {
      name: 'House',
      version: '2.0.0',
      description: 'Villa-based house component with 2-4 wings depending on type',
      tags: ['scenery', 'building', 'residential', 'villa-based'],
    };

    super(metadata, {
      wallColor: '#F5F5DC', // Beige walls
      accentColor: '#8B4513', // Brown accents
      roofColor: '#f8f8ff', // Almost white roof
      windowColor: '#4169E1', // Royal blue windows
      scale: 1,
      ...options,
    });

    this.type = options.type;
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  private getWingConfiguration(): Array<{
    position: [number, number, number];
    size: [number, number, number];
    name: string;
  }> {
    switch (this.type) {
      case HouseType.Small: // 2 wings
        return [
          { position: [0, 10, 0], size: [20, 20, 20], name: 'main' },
          { position: [-18, 8, 0], size: [16, 16, 16], name: 'left' },
        ];

      case HouseType.Medium: // 3 wings
        return [
          { position: [0, 10, 0], size: [20, 20, 20], name: 'main' },
          { position: [-18, 8, 0], size: [16, 16, 16], name: 'left' },
          { position: [18, 8, 0], size: [16, 16, 16], name: 'right' },
        ];

      case HouseType.Large: // 4 wings
        return [
          { position: [0, 12, 0], size: [22, 24, 22], name: 'main' },
          { position: [-20, 10, 0], size: [18, 20, 18], name: 'left' },
          { position: [20, 10, 0], size: [18, 20, 18], name: 'right' },
          { position: [0, 8, -20], size: [16, 16, 16], name: 'back' },
        ];

      case HouseType.Modern: // 4 wings modern
        return [
          { position: [0, 12, 0], size: [24, 24, 24], name: 'main' },
          { position: [-22, 10, 0], size: [20, 20, 20], name: 'left' },
          { position: [22, 10, 0], size: [20, 20, 20], name: 'right' },
          { position: [0, 8, -22], size: [18, 16, 18], name: 'back' },
        ];

      default:
        return [{ position: [0, 10, 0], size: [20, 20, 20], name: 'main' }];
    }
  }

  protected createSyncContent(): THREE.Object3D {
    const house = new THREE.Group();
    house.name = 'House';

    const options = this.options as HouseOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `house_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `house_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `house_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `house_window_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    const frameMaterial = resourceManager.getOrCreateMaterial(
      'house_frame',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
    );

    // Get wing configuration based on house type
    const wings = this.getWingConfiguration();

    // Create each wing
    wings.forEach((wing, index) => {
      // Main body
      const bodyGeometry = resourceManager.getOrCreateGeometry(
        `house_wing_${index}`,
        () => new THREE.BoxGeometry(wing.size[0], wing.size[1], wing.size[2])
      );

      const body = new THREE.Mesh(bodyGeometry, wallMaterial);
      body.position.set(wing.position[0], wing.position[1], wing.position[2]);
      body.castShadow = this.options.castShadow ?? true;
      body.receiveShadow = this.options.receiveShadow ?? true;
      house.add(body);

      // Roof for each wing
      const roofGeometry = resourceManager.getOrCreateGeometry(
        `house_roof_${index}`,
        () => new THREE.BoxGeometry(wing.size[0] + 2, 1, wing.size[2] + 2)
      );

      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(
        wing.position[0],
        wing.position[1] + wing.size[1]/2 + 0.5,
        wing.position[2]
      );
      roof.castShadow = this.options.castShadow ?? true;
      house.add(roof);

      // Add windows to each wing
      this.addWindowsToWing(house, wing, windowMaterial, frameMaterial);
    });

    // Add entrance door on main wing
    this.addEntrance(house, wings[0], accentMaterial, frameMaterial);

    // Add special features based on type
    if (this.type === HouseType.Modern) {
      this.addModernFeatures(house, wings, windowMaterial, frameMaterial, accentMaterial);
    }

    // Apply scale
    if (scale !== 1) {
      house.scale.setScalar(scale);
    }

    return house;
  }

  private addWindowsToWing(
    house: THREE.Group,
    wing: { position: [number, number, number]; size: [number, number, number]; name: string },
    windowMaterial: THREE.Material,
    frameMaterial: THREE.Material
  ): void {
    const windowSize = this.type === HouseType.Modern ? 8 : 6;
    const windowGeometry = resourceManager.getOrCreateGeometry(
      `house_window_${windowSize}`,
      () => new THREE.BoxGeometry(windowSize, windowSize, 0.5)
    );

    const frameGeometry = resourceManager.getOrCreateGeometry(
      `house_window_frame_${windowSize}`,
      () => new THREE.BoxGeometry(windowSize + 1, windowSize + 1, 1)
    );

    // Front windows
    const windowCount = wing.name === 'main' ? 3 : 2;
    for (let i = 0; i < windowCount; i++) {
      const spacing = wing.size[0] / (windowCount + 1);
      const x = wing.position[0] - wing.size[0]/2 + spacing * (i + 1);

      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, wing.position[1] + 2, wing.position[2] + wing.size[2]/2 + 0.25);
      house.add(window);

      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.copy(window.position);
      frame.position.z -= 0.25;
      house.add(frame);
    }

    // Side windows (if not main wing)
    if (wing.name !== 'main') {
      const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      sideWindow.position.set(
        wing.position[0] + (wing.name === 'left' ? -wing.size[0]/2 - 0.25 : wing.size[0]/2 + 0.25),
        wing.position[1] + 2,
        wing.position[2]
      );
      house.add(sideWindow);

      const sideFrame = new THREE.Mesh(frameGeometry, frameMaterial);
      sideFrame.position.copy(sideWindow.position);
      if (wing.name === 'left') {
        sideFrame.position.x += 0.25;
      } else {
        sideFrame.position.x -= 0.25;
      }
      house.add(sideFrame);
    }
  }

  private addEntrance(
    house: THREE.Group,
    mainWing: { position: [number, number, number]; size: [number, number, number] },
    accentMaterial: THREE.Material,
    frameMaterial: THREE.Material
  ): void {
    // Door
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'house_door',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );

    const door = new THREE.Mesh(doorGeometry, accentMaterial);
    door.position.set(
      mainWing.position[0],
      mainWing.position[1] - 6,
      mainWing.position[2] + mainWing.size[2]/2 + 0.25
    );
    house.add(door);

    // Door frame
    const frameGeometry = resourceManager.getOrCreateGeometry(
      'house_door_frame',
      () => new THREE.BoxGeometry(5, 9, 1)
    );

    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.copy(door.position);
    frame.position.z -= 0.25;
    house.add(frame);

    // Steps
    const stepsGeometry = resourceManager.getOrCreateGeometry(
      'house_steps',
      () => new THREE.BoxGeometry(8, 1, 4)
    );

    const steps = new THREE.Mesh(stepsGeometry, frameMaterial);
    steps.position.set(
      door.position.x,
      door.position.y - 4.5,
      door.position.z + 2
    );
    house.add(steps);
  }

  private addModernFeatures(
    house: THREE.Group,
    wings: Array<{ position: [number, number, number]; size: [number, number, number]; name: string }>,
    windowMaterial: THREE.Material,
    frameMaterial: THREE.Material,
    accentMaterial: THREE.Material
  ): void {
    const mainWing = wings[0];

    // Large panoramic window
    const panoramicGeometry = resourceManager.getOrCreateGeometry(
      'house_panoramic_window',
      () => new THREE.BoxGeometry(16, 10, 0.5)
    );

    const panoramic = new THREE.Mesh(panoramicGeometry, windowMaterial);
    panoramic.position.set(
      mainWing.position[0],
      mainWing.position[1] + 4,
      mainWing.position[2] + mainWing.size[2]/2 + 0.25
    );
    house.add(panoramic);

    const panoramicFrame = new THREE.Mesh(
      new THREE.BoxGeometry(17, 11, 1),
      frameMaterial
    );
    panoramicFrame.position.copy(panoramic.position);
    panoramicFrame.position.z -= 0.25;
    house.add(panoramicFrame);

    // Modern pillar
    const pillarGeometry = resourceManager.getOrCreateGeometry(
      'house_modern_pillar',
      () => new THREE.BoxGeometry(1, mainWing.size[1], 1)
    );

    const pillar = new THREE.Mesh(pillarGeometry, accentMaterial);
    pillar.position.set(
      mainWing.position[0] - 8,
      mainWing.position[1],
      mainWing.position[2] + mainWing.size[2]/2 - 2
    );
    house.add(pillar);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as HouseOptions;
    const wingCount = this.getWingConfiguration().length;

    return {
      name: 'House',
      version: '2.0.0',
      type: 'building',
      subtype: 'residential',
      style: this.type === HouseType.Modern ? 'modern' : 'villa-based',
      houseType: HouseType[this.type],
      wingCount,
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }

  // Legacy compatibility methods
  public loadWithGui(gui?: any): Promise<THREE.Object3D> {
    return Promise.resolve(this.createSyncContent()).then(mesh => {
      if (gui) {
        GuiHelper.addLocationGui(gui, 'House', mesh);
      }
      return mesh;
    });
  }
}

// Legacy compatibility layer for synchronous API
const HouseLegacy = House as any;

// Add legacy load method that returns mesh directly and supports GUI
HouseLegacy.prototype.load = function (gui?: any): THREE.Object3D {
  const mesh = this.createSyncContent();

  if (gui) {
    GuiHelper.addLocationGui(gui, 'House', mesh);
  }

  return mesh;
};

export default HouseLegacy;