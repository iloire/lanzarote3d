import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface CoconutPalmOptions extends SimpleComponentOptions {
  trunkColor?: string;
  leafColor?: string;
  coconutColor?: string;
  scale?: number;
  trunkHeight?: number;
}

/**
 * Coconut Palm component - Classic coconut palm with curved trunk and coconuts
 */
export class CoconutPalm extends SimpleThreeComponent {
  constructor(options: CoconutPalmOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'CoconutPalm',
      version: '1.0.0',
      description: 'Classic coconut palm with curved trunk, feather leaves, and coconuts',
      tags: ['scenery', 'tree', 'palm', 'tropical', 'nature'],
    };

    super(metadata, {
      trunkColor: '#8B4513', // Saddle brown
      leafColor: '#228B22', // Forest green
      coconutColor: '#8B7355', // Brown coconuts
      scale: 1,
      trunkHeight: 15,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const palm = new THREE.Group();
    palm.name = 'CoconutPalm';

    const options = this.options as CoconutPalmOptions;
    const scale = options.scale || 1;
    const trunkHeight = options.trunkHeight || 15;

    // Create materials with resource sharing
    const trunkMaterial = resourceManager.getOrCreateMaterial(
      `coconut_palm_trunk_${options.trunkColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trunkColor })
    );

    const leafMaterial = resourceManager.getOrCreateMaterial(
      `coconut_palm_leaf_${options.leafColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.leafColor, side: THREE.DoubleSide })
    );

    const coconutMaterial = resourceManager.getOrCreateMaterial(
      `coconut_palm_coconut_${options.coconutColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.coconutColor })
    );

    // Create curved trunk - multiple segments with increasing curve
    const segments = 8;
    const segmentHeight = trunkHeight / segments;

    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const radius = 0.8 - t * 0.3; // Tapering trunk

      const trunkGeometry = resourceManager.getOrCreateGeometry(
        `coconut_palm_trunk_segment_${i}`,
        () => new THREE.CylinderGeometry(radius, radius + 0.1, segmentHeight, 12)
      );

      const trunkSegment = new THREE.Mesh(trunkGeometry, trunkMaterial);

      // Create pronounced curve
      const curveAmount = t * t * 4; // Quadratic curve, more pronounced
      trunkSegment.position.set(curveAmount, i * segmentHeight + segmentHeight/2, 0);
      trunkSegment.rotation.z = t * 0.4; // More rotation for curve effect

      trunkSegment.castShadow = this.options.castShadow ?? true;
      trunkSegment.receiveShadow = this.options.receiveShadow ?? true;
      palm.add(trunkSegment);
    }

    // Create feather-like fronds (not fan-shaped)
    const frondCount = 8;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;

      // Create multiple leaflets per frond
      const leafletsPerFrond = 12;
      const frondGroup = new THREE.Group();

      for (let j = 0; j < leafletsPerFrond; j++) {
        const leafletGeometry = resourceManager.getOrCreateGeometry(
          `coconut_palm_leaflet_${i}_${j}`,
          () => new THREE.PlaneGeometry(2, 6)
        );

        const leaflet = new THREE.Mesh(leafletGeometry, leafMaterial);
        const leafletDistance = 2 + j * 1.5;

        leaflet.position.set(
          Math.cos(angle) * leafletDistance,
          trunkHeight + 2,
          Math.sin(angle) * leafletDistance
        );
        leaflet.rotation.z = angle;
        leaflet.rotation.x = Math.PI / 6 + j * 0.1; // Drooping effect
        leaflet.castShadow = this.options.castShadow ?? true;

        frondGroup.add(leaflet);
      }

      // Central stem of frond
      const stemGeometry = resourceManager.getOrCreateGeometry(
        `coconut_palm_stem_${i}`,
        () => new THREE.CylinderGeometry(0.1, 0.15, 20)
      );

      const stem = new THREE.Mesh(stemGeometry, trunkMaterial);
      stem.position.set(
        Math.cos(angle) * 10,
        trunkHeight + 2,
        Math.sin(angle) * 10
      );
      stem.rotation.z = angle + Math.PI/2;
      stem.rotation.x = Math.PI/3; // Angled upward

      frondGroup.add(stem);
      palm.add(frondGroup);
    }

    // Add coconut clusters
    for (let i = 0; i < 3; i++) {
      const clusterAngle = (i / 3) * Math.PI * 2;
      const coconutsPerCluster = 4 + Math.floor(Math.random() * 3);

      for (let j = 0; j < coconutsPerCluster; j++) {
        const coconutGeometry = resourceManager.getOrCreateGeometry(
          `coconut_palm_coconut_${i}_${j}`,
          () => new THREE.SphereGeometry(0.8, 8, 6)
        );

        const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);
        const coconutOffset = (j - coconutsPerCluster/2) * 0.5;

        coconut.position.set(
          Math.cos(clusterAngle) * 3 + coconutOffset,
          trunkHeight - 1,
          Math.sin(clusterAngle) * 3 + coconutOffset * 0.5
        );
        coconut.scale.set(1, 1.3, 1); // Elongated coconut shape
        coconut.castShadow = this.options.castShadow ?? true;
        palm.add(coconut);
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
    const options = this.options as CoconutPalmOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.trunkHeight && options.trunkHeight <= 0) {
      issues.push('Trunk height must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as CoconutPalmOptions;

    return {
      name: 'CoconutPalm',
      version: '1.0.0',
      type: 'tree',
      subtype: 'palm',
      variety: 'coconut',
      trunkHeight: options.trunkHeight,
      trunkColor: options.trunkColor,
      leafColor: options.leafColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const CoconutPalmLegacy = CoconutPalm as any;

// Add legacy load method that returns mesh directly
CoconutPalmLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default CoconutPalmLegacy;