import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface DatePalmOptions extends SimpleComponentOptions {
  trunkColor?: string;
  leafColor?: string;
  dateColor?: string;
  scale?: number;
  trunkHeight?: number;
}

/**
 * Date Palm component - Straight trunk with upward-angled fronds and date clusters
 */
export class DatePalm extends SimpleThreeComponent {
  constructor(options: DatePalmOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DatePalm',
      version: '1.0.0',
      description: 'Date palm with straight trunk, upward fronds, and hanging date clusters',
      tags: ['scenery', 'tree', 'palm', 'desert', 'nature'],
    };

    super(metadata, {
      trunkColor: '#A0522D', // Sienna brown
      leafColor: '#32CD32', // Lime green
      dateColor: '#8B4513', // Saddle brown dates
      scale: 1,
      trunkHeight: 18,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const palm = new THREE.Group();
    palm.name = 'DatePalm';

    const options = this.options as DatePalmOptions;
    const scale = options.scale || 1;
    const trunkHeight = options.trunkHeight || 18;

    // Create materials with resource sharing
    const trunkMaterial = resourceManager.getOrCreateMaterial(
      `date_palm_trunk_${options.trunkColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trunkColor })
    );

    const leafMaterial = resourceManager.getOrCreateMaterial(
      `date_palm_leaf_${options.leafColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.leafColor, side: THREE.DoubleSide })
    );

    const dateMaterial = resourceManager.getOrCreateMaterial(
      `date_palm_date_${options.dateColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.dateColor })
    );

    // Create straight trunk with diamond texture pattern
    const segments = 12;
    const segmentHeight = trunkHeight / segments;

    for (let i = 0; i < segments; i++) {
      const radius = 1.0 - (i / segments) * 0.3; // Slight taper

      const trunkGeometry = resourceManager.getOrCreateGeometry(
        `date_palm_trunk_segment_${i}`,
        () => new THREE.CylinderGeometry(radius, radius + 0.05, segmentHeight, 8)
      );

      const trunkSegment = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkSegment.position.set(0, i * segmentHeight + segmentHeight/2, 0);

      trunkSegment.castShadow = this.options.castShadow ?? true;
      trunkSegment.receiveShadow = this.options.receiveShadow ?? true;
      palm.add(trunkSegment);

      // Add diamond pattern texture rings
      if (i % 2 === 0) {
        const ringGeometry = resourceManager.getOrCreateGeometry(
          `date_palm_ring_${i}`,
          () => new THREE.TorusGeometry(radius + 0.1, 0.1, 4, 8)
        );
        const ring = new THREE.Mesh(ringGeometry, trunkMaterial);
        ring.position.set(0, i * segmentHeight + segmentHeight/2, 0);
        ring.rotation.x = Math.PI / 2;
        palm.add(ring);
      }
    }

    // Create upward-angled fronds characteristic of date palms
    const frondCount = 12;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;

      // Create central rachis (spine) of frond
      const rachisGeometry = resourceManager.getOrCreateGeometry(
        `date_palm_rachis_${i}`,
        () => new THREE.CylinderGeometry(0.15, 0.2, 14)
      );

      const rachis = new THREE.Mesh(rachisGeometry, trunkMaterial);
      rachis.position.set(
        Math.cos(angle) * 2,
        trunkHeight + 5,
        Math.sin(angle) * 2
      );
      rachis.rotation.z = angle + Math.PI/2;
      rachis.rotation.x = -Math.PI/6; // Upward angle
      rachis.castShadow = this.options.castShadow ?? true;
      palm.add(rachis);

      // Create pinnate leaflets along rachis
      const leafletsPerSide = 15;
      for (let side = 0; side < 2; side++) {
        for (let j = 0; j < leafletsPerSide; j++) {
          const leafletGeometry = resourceManager.getOrCreateGeometry(
            `date_palm_leaflet_${i}_${side}_${j}`,
            () => new THREE.PlaneGeometry(1.5, 8)
          );

          const leaflet = new THREE.Mesh(leafletGeometry, leafMaterial);
          const distanceAlongRachis = 2 + j * 0.8;
          const sideOffset = (side === 0 ? -1 : 1) * 0.8;

          leaflet.position.set(
            Math.cos(angle) * 2 + Math.cos(angle) * distanceAlongRachis + Math.cos(angle + Math.PI/2) * sideOffset,
            trunkHeight + 5 + Math.sin(-Math.PI/6) * distanceAlongRachis,
            Math.sin(angle) * 2 + Math.sin(angle) * distanceAlongRachis + Math.sin(angle + Math.PI/2) * sideOffset
          );

          // Orient leaflet properly
          leaflet.rotation.z = angle + (side === 0 ? -Math.PI/6 : Math.PI/6);
          leaflet.rotation.x = -Math.PI/6;
          leaflet.rotation.y = side === 0 ? Math.PI/4 : -Math.PI/4;

          leaflet.castShadow = this.options.castShadow ?? true;
          palm.add(leaflet);
        }
      }
    }

    // Add hanging date clusters
    for (let i = 0; i < 4; i++) {
      const clusterAngle = (i / 4) * Math.PI * 2;
      const datesPerCluster = 8 + Math.floor(Math.random() * 5);

      // Create cluster stem
      const stemGeometry = resourceManager.getOrCreateGeometry(
        `date_palm_cluster_stem_${i}`,
        () => new THREE.CylinderGeometry(0.1, 0.15, 3)
      );

      const stem = new THREE.Mesh(stemGeometry, trunkMaterial);
      stem.position.set(
        Math.cos(clusterAngle) * 1.5,
        trunkHeight - 2,
        Math.sin(clusterAngle) * 1.5
      );
      palm.add(stem);

      // Add individual dates
      for (let j = 0; j < datesPerCluster; j++) {
        const dateGeometry = resourceManager.getOrCreateGeometry(
          `date_palm_date_${i}_${j}`,
          () => new THREE.CylinderGeometry(0.3, 0.2, 1.5, 6)
        );

        const date = new THREE.Mesh(dateGeometry, dateMaterial);
        const clusterOffset = (Math.random() - 0.5) * 2;
        const heightOffset = Math.random() * 2;

        date.position.set(
          Math.cos(clusterAngle) * 1.5 + clusterOffset * 0.3,
          trunkHeight - 3 - heightOffset,
          Math.sin(clusterAngle) * 1.5 + clusterOffset * 0.3
        );
        date.rotation.x = Math.random() * Math.PI * 0.2;
        date.castShadow = this.options.castShadow ?? true;
        palm.add(date);
      }
    }

    // Apply scale
    if (scale !== 1) {
      palm.scale.setScalar(scale);
    }

    return palm;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DatePalmOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.trunkHeight && options.trunkHeight <= 0) {
      issues.push('Trunk height must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as DatePalmOptions;

    return {
      name: 'DatePalm',
      version: '1.0.0',
      type: 'tree',
      subtype: 'palm',
      variety: 'date',
      trunkHeight: options.trunkHeight,
      trunkColor: options.trunkColor,
      leafColor: options.leafColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const DatePalmLegacy = DatePalm as any;

// Add legacy load method that returns mesh directly
DatePalmLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default DatePalmLegacy;