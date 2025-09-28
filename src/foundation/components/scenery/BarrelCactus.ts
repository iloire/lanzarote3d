import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface BarrelCactusOptions extends SimpleComponentOptions {
  bodyColor?: string;
  spineColor?: string;
  flowerColor?: string;
  scale?: number;
  ribCount?: number;
}

/**
 * Barrel Cactus component - Round barrel-shaped cactus
 */
export class BarrelCactus extends SimpleThreeComponent {
  constructor(options: BarrelCactusOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'BarrelCactus',
      version: '1.0.0',
      description: 'Round barrel-shaped cactus with prominent ribs and spines',
      tags: ['scenery', 'cactus', 'desert', 'plant', 'nature'],
    };

    super(metadata, {
      bodyColor: '#3CB371', // Medium sea green
      spineColor: '#FFD700', // Gold color for spines
      flowerColor: '#FF69B4', // Hot pink for flowers
      scale: 1,
      ribCount: 16,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const cactus = new THREE.Group();
    cactus.name = 'BarrelCactus';

    const options = this.options as BarrelCactusOptions;
    const scale = options.scale || 1;
    const ribCount = Math.max(8, Math.min(24, options.ribCount || 16));

    // Create materials with resource sharing
    const cactusMaterial = resourceManager.getOrCreateMaterial(
      `barrel_body_${options.bodyColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.bodyColor })
    );

    const spineMaterial = resourceManager.getOrCreateMaterial(
      `barrel_spine_${options.spineColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.spineColor })
    );

    const flowerMaterial = resourceManager.getOrCreateMaterial(
      `barrel_flower_${options.flowerColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.flowerColor })
    );

    // Main barrel body - spherical with flattened top and bottom
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'barrel_body',
      () => {
        const geometry = new THREE.SphereGeometry(3, 32, 16);
        // Flatten the sphere to create barrel shape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i);
          positions.setY(i, y * 0.7); // Compress vertically
        }
        return geometry;
      }
    );

    const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    cactus.add(body);

    // Add vertical ribs
    for (let i = 0; i < ribCount; i++) {
      const angle = (i / ribCount) * Math.PI * 2;

      // Rib geometry
      const ribGeometry = resourceManager.getOrCreateGeometry(
        `barrel_rib_${i}`,
        () => new THREE.BoxGeometry(0.2, 4, 0.5)
      );

      const rib = new THREE.Mesh(ribGeometry, cactusMaterial);
      rib.position.set(
        Math.cos(angle) * 3.1,
        0,
        Math.sin(angle) * 3.1
      );
      rib.rotation.y = angle;
      rib.castShadow = this.options.castShadow ?? true;
      cactus.add(rib);

      // Add spines along ribs
      for (let j = -3; j <= 3; j++) {
        const spineGeometry = resourceManager.getOrCreateGeometry(
          `barrel_spine_${i}_${j}`,
          () => new THREE.ConeGeometry(0.08, 0.5, 4)
        );

        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        spine.position.set(
          Math.cos(angle) * 3.2,
          j * 0.5,
          Math.sin(angle) * 3.2
        );
        spine.rotation.z = angle + Math.PI / 2;
        spine.rotation.x = -Math.PI / 2;
        cactus.add(spine);
      }
    }

    // Add crown of flowers at top
    const flowerCount = 8;
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2;

      // Flower petals
      const petalGeometry = resourceManager.getOrCreateGeometry(
        `barrel_flower_${i}`,
        () => new THREE.ConeGeometry(0.3, 0.8, 6)
      );

      const flower = new THREE.Mesh(petalGeometry, flowerMaterial);
      flower.position.set(
        Math.cos(angle) * 1.5,
        2.2,
        Math.sin(angle) * 1.5
      );
      flower.rotation.z = angle * 0.3;
      cactus.add(flower);

      // Flower center
      const centerGeometry = resourceManager.getOrCreateGeometry(
        `barrel_flower_center_${i}`,
        () => new THREE.SphereGeometry(0.2, 6, 4)
      );

      const centerMaterial = resourceManager.getOrCreateMaterial(
        'barrel_flower_center',
        () => new THREE.MeshLambertMaterial({ color: '#FFFF00' }) // Yellow center
      );

      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.copy(flower.position);
      center.position.y += 0.2;
      cactus.add(center);
    }

    // Add some ground spines that have fallen
    for (let i = 0; i < 10; i++) {
      const groundSpineGeometry = resourceManager.getOrCreateGeometry(
        `barrel_ground_spine_${i}`,
        () => new THREE.CylinderGeometry(0.03, 0.05, 0.4)
      );

      const groundSpine = new THREE.Mesh(groundSpineGeometry, spineMaterial);
      const angle = Math.random() * Math.PI * 2;
      const distance = 3.5 + Math.random() * 1;

      groundSpine.position.set(
        Math.cos(angle) * distance,
        -2,
        Math.sin(angle) * distance
      );
      groundSpine.rotation.z = Math.random() * Math.PI;
      groundSpine.rotation.x = Math.random() * Math.PI;
      cactus.add(groundSpine);
    }

    // Apply scale
    if (scale !== 1) {
      cactus.scale.setScalar(scale);
    }

    return cactus;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as BarrelCactusOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.ribCount && (options.ribCount < 8 || options.ribCount > 24)) {
      issues.push('Rib count must be between 8 and 24');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as BarrelCactusOptions;

    return {
      name: 'BarrelCactus',
      version: '1.0.0',
      type: 'cactus',
      subtype: 'barrel',
      bodyColor: options.bodyColor,
      flowerColor: options.flowerColor,
      ribCount: options.ribCount,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const BarrelCactusLegacy = BarrelCactus as any;

// Add legacy load method that returns mesh directly
BarrelCactusLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default BarrelCactusLegacy;