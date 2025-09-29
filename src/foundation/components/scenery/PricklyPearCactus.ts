import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface PricklyPearCactusOptions extends SimpleComponentOptions {
  padColor?: string;
  spineColor?: string;
  fruitColor?: string;
  scale?: number;
  padCount?: number;
}

/**
 * Prickly Pear Cactus component - Flat paddle-shaped segments
 */
export class PricklyPearCactus extends SimpleThreeComponent {
  constructor(options: PricklyPearCactusOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'PricklyPearCactus',
      version: '1.0.0',
      description: 'Prickly pear cactus with flat paddle-shaped segments',
      tags: ['scenery', 'cactus', 'desert', 'plant', 'nature'],
    };

    super(metadata, {
      padColor: '#90EE90', // Light green
      spineColor: '#8B7355', // Tan spines
      fruitColor: '#DC143C', // Crimson for prickly pear fruit
      scale: 1,
      padCount: 6,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const cactus = new THREE.Group();
    cactus.name = 'PricklyPearCactus';

    const options = this.options as PricklyPearCactusOptions;
    const scale = options.scale || 1;
    const padCount = Math.max(3, Math.min(10, options.padCount || 6));

    // Create materials with resource sharing
    const padMaterial = resourceManager.getOrCreateMaterial(
      `prickly_pad_${options.padColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.padColor })
    );

    const spineMaterial = resourceManager.getOrCreateMaterial(
      `prickly_spine_${options.spineColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.spineColor })
    );

    const fruitMaterial = resourceManager.getOrCreateMaterial(
      `prickly_fruit_${options.fruitColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.fruitColor })
    );

    // Create paddle geometry (flat oval shape)
    const createPadGeometry = (width: number, height: number) => {
      return resourceManager.getOrCreateGeometry(
        `prickly_pad_${width}_${height}`,
        () => {
          const geometry = new THREE.CylinderGeometry(width/2, width/2, 0.5, 16);
          // Flatten and make oval
          const positions = geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            positions.setZ(i, z * (height / width));
          }
          return geometry;
        }
      );
    };

    // Base pad
    const basePadGeometry = createPadGeometry(3, 4);
    const basePad = new THREE.Mesh(basePadGeometry, padMaterial);
    basePad.rotation.x = Math.PI / 2;
    basePad.position.y = 0.25; // Position so bottom sits at ground level
    basePad.castShadow = this.options.castShadow ?? true;
    basePad.receiveShadow = this.options.receiveShadow ?? true;
    cactus.add(basePad);

    // Add spines to base pad
    this.addSpinesToPad(basePad, spineMaterial, 20);

    // Add additional pads branching off
    const padConfigs = [
      { parent: basePad, x: 1.2, y: 0.25, angle: 0.3, width: 2.5, height: 3 }, // Adjusted for ground level
      { parent: basePad, x: -1.2, y: 0.25, angle: -0.3, width: 2.5, height: 3 }, // Adjusted for ground level
      { parent: basePad, x: 0, y: 1.25, angle: 0, width: 2, height: 2.5 }, // Adjusted for ground level
      { parent: basePad, x: 1, y: -1.25, angle: 0.5, width: 2, height: 2.5 }, // Adjusted for ground level
      { parent: basePad, x: -1, y: -1.25, angle: -0.5, width: 2, height: 2.5 }, // Adjusted for ground level
      { parent: basePad, x: 0.8, y: 2.25, angle: 0.2, width: 1.8, height: 2.2 }, // Adjusted for ground level
      { parent: basePad, x: -0.8, y: 2.25, angle: -0.2, width: 1.8, height: 2.2 }, // Adjusted for ground level
      { parent: basePad, x: 1.5, y: -1.75, angle: 0.7, width: 1.5, height: 2 }, // Adjusted for ground level
      { parent: basePad, x: -1.5, y: -1.75, angle: -0.7, width: 1.5, height: 2 }, // Adjusted for ground level
      { parent: basePad, x: 0, y: -2.75, angle: 0, width: 2, height: 2.5 } // Adjusted for ground level
    ];

    for (let i = 0; i < padCount && i < padConfigs.length; i++) {
      const config = padConfigs[i];
      const padGeometry = createPadGeometry(config.width, config.height);
      const pad = new THREE.Mesh(padGeometry, padMaterial);

      pad.rotation.x = Math.PI / 2;
      pad.rotation.z = config.angle;
      pad.position.set(config.x, config.y, 0);
      pad.castShadow = this.options.castShadow ?? true;
      pad.receiveShadow = this.options.receiveShadow ?? true;
      cactus.add(pad);

      // Add spines to pad
      this.addSpinesToPad(pad, spineMaterial, Math.floor(15 * (config.width / 3)));

      // Add fruit on some pads
      if (i % 3 === 0) {
        const fruitCount = 2 + Math.floor(Math.random() * 3);
        for (let j = 0; j < fruitCount; j++) {
          const fruitGeometry = resourceManager.getOrCreateGeometry(
            `prickly_fruit_${i}_${j}`,
            () => new THREE.SphereGeometry(0.3, 8, 6)
          );

          const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
          const fruitAngle = (j / fruitCount) * Math.PI * 2;
          const fruitRadius = config.width * 0.3;

          fruit.position.set(
            pad.position.x + Math.cos(fruitAngle) * fruitRadius,
            pad.position.y + config.height * 0.3,
            Math.sin(fruitAngle) * fruitRadius * 0.5
          );
          cactus.add(fruit);
        }
      }
    }

    // Add small ground pads (baby cacti)
    for (let i = 0; i < 3; i++) {
      const babyPadGeometry = createPadGeometry(0.8, 1);
      const babyPad = new THREE.Mesh(babyPadGeometry, padMaterial);

      const angle = (i / 3) * Math.PI * 2;
      babyPad.rotation.x = Math.PI / 2;
      babyPad.position.set(
        Math.cos(angle) * 4,
        0.25, // Adjusted for ground level positioning
        Math.sin(angle) * 4
      );
      babyPad.scale.set(0.7, 0.7, 0.7);
      cactus.add(babyPad);

      // Add tiny spines
      this.addSpinesToPad(babyPad, spineMaterial, 5);
    }

    // Apply scale
    if (scale !== 1) {
      cactus.scale.setScalar(scale);
    }

    return cactus;
  }

  private addSpinesToPad(pad: THREE.Mesh, spineMaterial: THREE.Material, spineCount: number): void {
    for (let i = 0; i < spineCount; i++) {
      const spineGeometry = resourceManager.getOrCreateGeometry(
        `prickly_spine_${Math.random()}`,
        () => new THREE.ConeGeometry(0.03, 0.2, 3)
      );

      const spine = new THREE.Mesh(spineGeometry, spineMaterial);

      // Random position on pad surface
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.8;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r * 0.7; // Oval shape

      spine.position.set(
        pad.position.x + x,
        pad.position.y + (Math.random() - 0.5) * 0.3,
        pad.position.z + z
      );

      // Random orientation
      spine.rotation.x = Math.random() * Math.PI * 0.3;
      spine.rotation.z = Math.random() * Math.PI * 2;

      pad.parent?.add(spine);
    }
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as PricklyPearCactusOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.padCount && (options.padCount < 3 || options.padCount > 10)) {
      issues.push('Pad count must be between 3 and 10');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as PricklyPearCactusOptions;

    return {
      name: 'PricklyPearCactus',
      version: '1.0.0',
      type: 'cactus',
      subtype: 'prickly_pear',
      padColor: options.padColor,
      fruitColor: options.fruitColor,
      padCount: options.padCount,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const PricklyPearCactusLegacy = PricklyPearCactus as any;

// Add legacy load method that returns mesh directly
PricklyPearCactusLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default PricklyPearCactusLegacy;