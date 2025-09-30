import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface FanPalmOptions extends SimpleComponentOptions {
  trunkColor?: string;
  leafColor?: string;
  scale?: number;
  trunkHeight?: number;
  fanCount?: number;
}

/**
 * Fan Palm component - Thick trunk with large fan-shaped leaves
 */
export class FanPalm extends SimpleThreeComponent {
  constructor(options: FanPalmOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'FanPalm',
      version: '1.0.0',
      description: 'Fan palm with thick trunk and distinctive large fan-shaped leaves',
      tags: ['scenery', 'tree', 'palm', 'tropical', 'nature'],
    };

    super(metadata, {
      trunkColor: '#654321', // Dark brown
      leafColor: '#2E8B57', // Sea green
      scale: 1,
      trunkHeight: 12,
      fanCount: 10,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const palm = new THREE.Group();
    palm.name = 'FanPalm';

    const options = this.options as FanPalmOptions;
    const scale = options.scale || 1;
    const trunkHeight = options.trunkHeight || 12;
    const fanCount = Math.max(6, Math.min(16, options.fanCount || 10));

    // Create materials with resource sharing
    const trunkMaterial = resourceManager.getOrCreateMaterial(
      `fan_palm_trunk_${options.trunkColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trunkColor })
    );

    const leafMaterial = resourceManager.getOrCreateMaterial(
      `fan_palm_leaf_${options.leafColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.leafColor, side: THREE.DoubleSide })
    );

    // Create thick, sturdy trunk
    const segments = 6;
    const segmentHeight = trunkHeight / segments;

    for (let i = 0; i < segments; i++) {
      const radius = 1.5 - (i / segments) * 0.2; // Thick trunk with minimal taper

      const trunkGeometry = resourceManager.getOrCreateGeometry(
        `fan_palm_trunk_segment_${i}`,
        () => new THREE.CylinderGeometry(radius, radius + 0.1, segmentHeight, 12)
      );

      const trunkSegment = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkSegment.position.set(0, i * segmentHeight + segmentHeight/2, 0);

      trunkSegment.castShadow = this.options.castShadow ?? true;
      trunkSegment.receiveShadow = this.options.receiveShadow ?? true;
      palm.add(trunkSegment);

      // Add horizontal ridges/texture
      const ridgeGeometry = resourceManager.getOrCreateGeometry(
        `fan_palm_ridge_${i}`,
        () => new THREE.TorusGeometry(radius + 0.05, 0.08, 4, 12)
      );
      const ridge = new THREE.Mesh(ridgeGeometry, trunkMaterial);
      ridge.position.set(0, i * segmentHeight + segmentHeight, 0);
      ridge.rotation.x = Math.PI / 2;
      palm.add(ridge);
    }

    // Create fan-shaped leaves
    for (let i = 0; i < fanCount; i++) {
      const angle = (i / fanCount) * Math.PI * 2;
      const fanGroup = new THREE.Group();

      // Create petiole (leaf stem)
      const petioleGeometry = resourceManager.getOrCreateGeometry(
        `fan_palm_petiole_${i}`,
        () => new THREE.CylinderGeometry(0.2, 0.3, 6)
      );

      const petiole = new THREE.Mesh(petioleGeometry, trunkMaterial);
      petiole.position.set(
        Math.cos(angle) * 3,
        trunkHeight + 2,
        Math.sin(angle) * 3
      );
      petiole.rotation.z = angle + Math.PI/2;
      petiole.rotation.x = -Math.PI/4; // Angled upward
      fanGroup.add(petiole);

      // Create fan blade segments
      const fanSegments = 12;
      const fanRadius = 8;

      for (let j = 0; j < fanSegments; j++) {
        const segmentAngle = (j / (fanSegments - 1)) * Math.PI - Math.PI/2; // -90 to +90 degrees

        const segmentGeometry = resourceManager.getOrCreateGeometry(
          `fan_palm_segment_${i}_${j}`,
          () => new THREE.PlaneGeometry(1, fanRadius)
        );

        const segment = new THREE.Mesh(segmentGeometry, leafMaterial);
        const segmentDistance = 6;

        segment.position.set(
          Math.cos(angle) * segmentDistance + Math.cos(angle + segmentAngle) * fanRadius * 0.3,
          trunkHeight + 4,
          Math.sin(angle) * segmentDistance + Math.sin(angle + segmentAngle) * fanRadius * 0.3
        );

        segment.rotation.z = angle + segmentAngle;
        segment.rotation.x = -Math.PI/6 + Math.abs(segmentAngle) * 0.2; // Slight droop, more at edges
        segment.castShadow = this.options.castShadow ?? true;

        fanGroup.add(segment);
      }

      // Create central fan membrane
      const fanGeometry = resourceManager.getOrCreateGeometry(
        `fan_palm_fan_${i}`,
        () => {
          const geometry = new THREE.CircleGeometry(fanRadius * 0.8, fanSegments);
          // Remove bottom half to create fan shape
          const positions = geometry.attributes.position;
          const newPositions = [];
          for (let k = 0; k < positions.count; k++) {
            const x = positions.getX(k);
            const y = positions.getY(k);
            if (y >= 0) { // Only keep upper half
              newPositions.push(x, y, 0);
            }
          }
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
          return geometry;
        }
      );

      const fan = new THREE.Mesh(fanGeometry, leafMaterial);
      fan.position.set(
        Math.cos(angle) * 6,
        trunkHeight + 4,
        Math.sin(angle) * 6
      );
      fan.rotation.z = angle;
      fan.rotation.x = -Math.PI/6;
      fanGroup.add(fan);

      palm.add(fanGroup);
    }

    // Add some dead fronds hanging down (characteristic of fan palms)
    for (let i = 0; i < 3; i++) {
      const deadAngle = Math.random() * Math.PI * 2;

      const deadFrondGeometry = resourceManager.getOrCreateGeometry(
        `fan_palm_dead_frond_${i}`,
        () => new THREE.PlaneGeometry(4, 10)
      );

      const deadFrondMaterial = resourceManager.getOrCreateMaterial(
        'fan_palm_dead_frond',
        () => new THREE.MeshLambertMaterial({ color: '#8B7355', side: THREE.DoubleSide })
      );

      const deadFrond = new THREE.Mesh(deadFrondGeometry, deadFrondMaterial);
      deadFrond.position.set(
        Math.cos(deadAngle) * 2,
        trunkHeight - 2,
        Math.sin(deadAngle) * 2
      );
      deadFrond.rotation.z = deadAngle;
      deadFrond.rotation.x = Math.PI/6; // Hanging downward
      palm.add(deadFrond);
    }

    // Apply scale
    if (scale !== 1) {
      palm.scale.setScalar(scale);
    }

    return palm;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as FanPalmOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.trunkHeight && options.trunkHeight <= 0) {
      issues.push('Trunk height must be greater than 0');
    }

    if (options.fanCount && (options.fanCount < 6 || options.fanCount > 16)) {
      issues.push('Fan count must be between 6 and 16');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as FanPalmOptions;

    return {
      name: 'FanPalm',
      version: '1.0.0',
      type: 'tree',
      subtype: 'palm',
      variety: 'fan',
      trunkHeight: options.trunkHeight,
      fanCount: options.fanCount,
      trunkColor: options.trunkColor,
      leafColor: options.leafColor,
      scale: options.scale,
    };
  }
}

export default FanPalm;
