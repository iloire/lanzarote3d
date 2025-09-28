import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Options for tree component
 */
export interface TreeOptions extends SimpleComponentOptions {
  trunkHeight?: number;
  trunkRadius?: number;
  crownSize?: number;
  trunkColor?: number | string;
  crownColor?: number | string;
  style?: 'default' | 'pine' | 'palm';
}

/**
 * Tree component using the new architecture
 *
 * Features:
 * - Procedural tree generation with customizable parameters
 * - Shared geometry and materials through ResourceManager
 * - Multiple tree styles (default, pine, palm)
 * - Proper resource cleanup and lifecycle management
 */
export class TreeComponent extends SimpleThreeComponent {
  protected treeOptions: Required<TreeOptions>;

  constructor(options: TreeOptions = {}) {
    const metadata = {
      name: 'Tree',
      version: '2.0.0',
      description: 'Procedural tree component with multiple styles',
      author: 'Lanzarote3D',
      tags: ['scenery', 'vegetation', 'procedural']
    };

    super(metadata, options);

    // Set default options
    this.treeOptions = {
      trunkHeight: 50,
      trunkRadius: 3,
      crownSize: 25,
      trunkColor: 0xf3f2f7,
      crownColor: 0xb2d2a4,
      style: 'default',
      castShadow: true,
      receiveShadow: true,
      ...options
    };
  }

  /**
   * Create geometry is not used since we create a composite object
   */
  protected createGeometry(): THREE.BufferGeometry {
    // This method is required by SimpleThreeComponent but not used
    // since we override createObject to create a composite tree
    return new THREE.BufferGeometry();
  }

  /**
   * Override to create composite tree object
   */
  protected async createObject(): THREE.Object3D {
    const tree = new THREE.Group();
    tree.name = 'Tree';

    // Create trunk
    const trunk = this.createTrunk();
    tree.add(trunk);

    // Create crown based on style
    const crown = this.createCrown();
    tree.add(crown);

    // Apply transform options
    if (this.treeOptions.position) {
      tree.position.copy(this.treeOptions.position);
    }

    if (this.treeOptions.rotation) {
      tree.rotation.copy(this.treeOptions.rotation);
    }

    if (this.treeOptions.scale) {
      if (typeof this.treeOptions.scale === 'number') {
        tree.scale.setScalar(this.treeOptions.scale);
      } else {
        tree.scale.copy(this.treeOptions.scale);
      }
    }

    return tree;
  }

  /**
   * Create tree trunk
   */
  private createTrunk(): THREE.Mesh {
    const geometryKey = `trunk_${this.treeOptions.trunkHeight}_${this.treeOptions.trunkRadius}`;
    const geometry = resourceManager.getGeometry(geometryKey, () => {
      const geo = new THREE.IcosahedronGeometry(this.treeOptions.trunkRadius, 0);
      return geo;
    });

    const materialKey = `trunk_material_${this.treeOptions.trunkColor}`;
    const material = resourceManager.getMaterial(materialKey, {
      type: 'lambert',
      color: this.treeOptions.trunkColor
    });

    const trunk = new THREE.Mesh(geometry, material);
    trunk.name = 'trunk';

    // Position and scale trunk
    trunk.rotation.x = Math.PI / 2;
    trunk.position.y = this.treeOptions.trunkHeight / 2;
    trunk.scale.set(0.03, 0.03, this.treeOptions.trunkHeight / this.treeOptions.trunkRadius);

    trunk.castShadow = this.treeOptions.castShadow;
    trunk.receiveShadow = this.treeOptions.receiveShadow;

    return trunk;
  }

  /**
   * Create tree crown based on style
   */
  private createCrown(): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    const geometryKey = `crown_${this.treeOptions.style}_${this.treeOptions.crownSize}`;

    geometry = resourceManager.getGeometry(geometryKey, () => {
      switch (this.treeOptions.style) {
        case 'pine':
          return this.createPineCrown();
        case 'palm':
          return this.createPalmCrown();
        default:
          return this.createDefaultCrown();
      }
    });

    const materialKey = `crown_material_${this.treeOptions.crownColor}`;
    const material = resourceManager.getMaterial(materialKey, {
      type: 'lambert',
      color: this.treeOptions.crownColor
    });

    const crown = new THREE.Mesh(geometry, material);
    crown.name = 'crown';

    // Position crown on top of trunk
    crown.position.y = this.treeOptions.trunkHeight + this.treeOptions.crownSize / 2;
    crown.castShadow = this.treeOptions.castShadow;

    return crown;
  }

  /**
   * Create default icosahedral crown
   */
  private createDefaultCrown(): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry(this.treeOptions.crownSize, 0);
    // Apply some deformation for more natural look
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] *= 0.4; // Flatten vertically
    }
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }

  /**
   * Create conical pine crown
   */
  private createPineCrown(): THREE.BufferGeometry {
    return new THREE.ConeGeometry(
      this.treeOptions.crownSize,
      this.treeOptions.crownSize * 2,
      8
    );
  }

  /**
   * Create palm-style crown
   */
  private createPalmCrown(): THREE.BufferGeometry {
    // Create a flatter, wider crown for palm trees
    const geometry = new THREE.SphereGeometry(this.treeOptions.crownSize, 8, 6);
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] *= 0.3; // Very flat
    }
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }

  /**
   * Override geometry key to account for tree-specific parameters
   */
  protected getGeometryKey(): string {
    return `tree_${this.treeOptions.style}_${this.treeOptions.trunkHeight}_${this.treeOptions.crownSize}`;
  }

  /**
   * Trees don't use a single material, so we override this
   */
  protected getMaterialKey(): string {
    return `tree_composite_${this.treeOptions.trunkColor}_${this.treeOptions.crownColor}`;
  }

  /**
   * Override dispose to release all tree-specific resources
   */
  dispose(): void {
    // Release trunk and crown resources
    const trunkGeometryKey = `trunk_${this.treeOptions.trunkHeight}_${this.treeOptions.trunkRadius}`;
    const crownGeometryKey = `crown_${this.treeOptions.style}_${this.treeOptions.crownSize}`;
    const trunkMaterialKey = `trunk_material_${this.treeOptions.trunkColor}`;
    const crownMaterialKey = `crown_material_${this.treeOptions.crownColor}`;

    resourceManager.releaseResource(trunkGeometryKey);
    resourceManager.releaseResource(crownGeometryKey);
    resourceManager.releaseResource(trunkMaterialKey);
    resourceManager.releaseResource(crownMaterialKey);

    super.dispose();
  }

  /**
   * Create clone with same tree configuration
   */
  protected createClone(options: TreeOptions): TreeComponent {
    return new TreeComponent({ ...this.treeOptions, ...options });
  }

  /**
   * Validate tree-specific requirements
   */
  protected validateComponent(): string[] {
    const issues = super.validateComponent();

    if (this.treeOptions.trunkHeight <= 0) {
      issues.push('Trunk height must be positive');
    }

    if (this.treeOptions.trunkRadius <= 0) {
      issues.push('Trunk radius must be positive');
    }

    if (this.treeOptions.crownSize <= 0) {
      issues.push('Crown size must be positive');
    }

    return issues;
  }

  /**
   * Export tree-specific serialization
   */
  protected serializeComponent(): any {
    return {
      treeOptions: this.treeOptions
    };
  }
}