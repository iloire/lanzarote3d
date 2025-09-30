import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface PalmTreeOptions extends SimpleComponentOptions {
  trunkColor?: string;
  leafColor?: string;
  scale?: number;
  leafCount?: number;
}

/**
 * Palm Tree component - Tropical palm tree with curved trunk and fan leaves
 */
export class PalmTree extends SimpleThreeComponent {
  constructor(options: PalmTreeOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'PalmTree',
      version: '1.0.0',
      description: 'Tropical palm tree with curved trunk and fan-shaped leaves',
      tags: ['scenery', 'tree', 'tropical', 'palm', 'nature'],
    };

    super(metadata, {
      trunkColor: '#8B4513', // Saddle brown for trunk
      leafColor: '#228B22', // Forest green for leaves
      scale: 1,
      leafCount: 8,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const palmTree = new THREE.Group();
    palmTree.name = 'PalmTree';

    const options = this.options as PalmTreeOptions;
    const scale = options.scale || 1;
    const leafCount = Math.max(4, Math.min(12, options.leafCount || 8));

    // Create materials with resource sharing
    const trunkMaterial = resourceManager.getOrCreateMaterial(
      `palm_tree_trunk_${options.trunkColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trunkColor })
    );

    const leafMaterial = resourceManager.getOrCreateMaterial(
      `palm_tree_leaf_${options.leafColor}`,
      () => new THREE.MeshLambertMaterial({
        color: options.leafColor,
        side: THREE.DoubleSide
      })
    );

    const coconutMaterial = resourceManager.getOrCreateMaterial(
      'palm_tree_coconut',
      () => new THREE.MeshLambertMaterial({ color: '#8B4513' })
    );

    // Create curved trunk using multiple cylinders
    const trunkSegments = 8;
    const trunkHeight = 25;
    const segmentHeight = trunkHeight / trunkSegments;

    for (let i = 0; i < trunkSegments; i++) {
      const t = i / (trunkSegments - 1);
      const radius = 1.2 - t * 0.4; // Taper from 1.2 to 0.8

      const trunkGeometry = resourceManager.getOrCreateGeometry(
        `palm_tree_trunk_segment_${i}`,
        () => new THREE.CylinderGeometry(radius, radius + 0.1, segmentHeight, 8)
      );

      const trunkSegment = new THREE.Mesh(trunkGeometry, trunkMaterial);

      // Create curved effect
      const curveAmount = t * t * 3; // Quadratic curve
      trunkSegment.position.set(curveAmount, i * segmentHeight - trunkHeight/2 + segmentHeight/2, 0);
      trunkSegment.rotation.z = t * 0.3; // Slight rotation for natural look

      trunkSegment.castShadow = this.options.castShadow ?? true;
      trunkSegment.receiveShadow = this.options.receiveShadow ?? true;
      palmTree.add(trunkSegment);
    }

    // Add trunk texture rings
    for (let i = 0; i < 6; i++) {
      const ringGeometry = resourceManager.getOrCreateGeometry(
        `palm_tree_ring_${i}`,
        () => new THREE.RingGeometry(1.0, 1.4, 8)
      );
      const ringMaterial = resourceManager.getOrCreateMaterial(
        'palm_tree_ring',
        () => new THREE.MeshLambertMaterial({ color: '#654321' })
      );

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(0, -8 + i * 3, 0);
      ring.rotation.x = Math.PI / 2;
      palmTree.add(ring);
    }

    // Create palm fronds (fan-shaped leaves)
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;

      // Create leaf shape using a custom geometry
      const leafGeometry = new THREE.BufferGeometry();
      const leafVertices = [];
      const leafIndices = [];

      // Create fan-shaped leaf
      const leafLength = 12;
      const leafSegments = 16;

      // Center point
      leafVertices.push(0, 0, 0);

      // Create fan points
      for (let j = 0; j <= leafSegments; j++) {
        const t = j / leafSegments;
        const fanAngle = (t - 0.5) * Math.PI * 0.6; // 60 degree fan
        const x = Math.sin(fanAngle) * leafLength * (0.8 + t * 0.2);
        const y = Math.cos(fanAngle) * leafLength;
        const z = Math.sin(t * Math.PI) * 2; // Slight droop

        leafVertices.push(x, y, z);

        // Create triangles
        if (j > 0) {
          leafIndices.push(0, j, j + 1);
        }
      }

      leafGeometry.setIndex(leafIndices);
      leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leafVertices, 3));
      leafGeometry.computeVertexNormals();

      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

      // Position and rotate leaf
      leaf.position.set(2.5, trunkHeight/2 - 2, 0);
      leaf.rotation.z = angle;
      leaf.rotation.x = -0.3 - Math.random() * 0.4; // Natural droop

      leaf.castShadow = this.options.castShadow ?? true;
      palmTree.add(leaf);
    }

    // Add coconuts
    const coconutCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < coconutCount; i++) {
      const coconutGeometry = resourceManager.getOrCreateGeometry(
        `palm_tree_coconut_${i}`,
        () => new THREE.SphereGeometry(0.8, 8, 6)
      );

      const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);

      const angle = (i / coconutCount) * Math.PI * 2;
      coconut.position.set(
        Math.cos(angle) * 2,
        trunkHeight/2 - 4 - Math.random() * 2,
        Math.sin(angle) * 2
      );

      coconut.castShadow = this.options.castShadow ?? true;
      palmTree.add(coconut);
    }

    // Add some ground roots
    for (let i = 0; i < 4; i++) {
      const rootGeometry = resourceManager.getOrCreateGeometry(
        `palm_tree_root_${i}`,
        () => new THREE.CylinderGeometry(0.3, 0.5, 3, 6)
      );

      const root = new THREE.Mesh(rootGeometry, trunkMaterial);
      const angle = (i / 4) * Math.PI * 2;

      root.position.set(
        Math.cos(angle) * 2,
        -trunkHeight/2 - 1,
        Math.sin(angle) * 2
      );
      root.rotation.z = Math.cos(angle) * 0.5;
      root.rotation.x = Math.sin(angle) * 0.5;

      root.castShadow = this.options.castShadow ?? true;
      root.receiveShadow = this.options.receiveShadow ?? true;
      palmTree.add(root);
    }

    // Apply scale
    if (scale !== 1) {
      palmTree.scale.setScalar(scale);
    }

    return palmTree;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as PalmTreeOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.leafCount && (options.leafCount < 4 || options.leafCount > 12)) {
      issues.push('Leaf count must be between 4 and 12');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as PalmTreeOptions;

    return {
      name: 'PalmTree',
      version: '1.0.0',
      type: 'tree',
      subtype: 'tropical',
      trunkColor: options.trunkColor,
      leafColor: options.leafColor,
      leafCount: options.leafCount,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const PalmTreeLegacy = PalmTree as any;

// Add legacy load method that returns mesh directly
PalmTreeLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default PalmTreeLegacy;