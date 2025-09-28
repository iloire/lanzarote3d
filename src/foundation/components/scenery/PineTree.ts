import * as THREE from 'three';
import { rndIntBetween } from '../../utils/math';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';

const pineMaterials = [
  new THREE.MeshBasicMaterial({ color: 0x0d5b28 }),
  new THREE.MeshBasicMaterial({ color: 0x093923 }),
  new THREE.MeshBasicMaterial({ color: 0x2e8d36 }),
  new THREE.MeshBasicMaterial({ color: 0x081f1c }),
  new THREE.MeshBasicMaterial({ color: 0x00b662 }),
];

export interface PineTreeOptions extends SimpleComponentOptions {
  trunkHeight?: number;
  foliageHeight?: number;
  foliageRadius?: number;
  materialVariation?: boolean;
}

class PineTree extends SimpleThreeComponent {
  private trunkHeight: number = 6;
  private foliageHeight: number = 9;
  private foliageRadius: number = 3;
  private materialVariation: boolean = true;

  constructor(options: PineTreeOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'PineTree',
      version: '1.0.0',
      description: 'Procedural pine tree with trunk and conical foliage',
      tags: ['scenery', 'nature', 'tree', 'procedural'],
    };

    super(metadata, options);

    this.trunkHeight = options.trunkHeight || 6;
    this.foliageHeight = options.foliageHeight || 9;
    this.foliageRadius = options.foliageRadius || 3;
    this.materialVariation = options.materialVariation !== false;

    if (options.scale) {
      const scaleFactor = typeof options.scale === 'number' ? options.scale : 1;
      this.trunkHeight *= scaleFactor;
      this.foliageHeight *= scaleFactor;
      this.foliageRadius *= scaleFactor;
    }
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return foliage geometry as the primary geometry
    return new THREE.ConeGeometry(this.foliageRadius, this.foliageHeight, 8);
  }

  public override async load(): Promise<THREE.Object3D> {
    const pineGroup = new THREE.Group();

    // Create foliage (pine cone)
    const foliage = (await super.load()) as THREE.Mesh;
    const foliageMaterial = this.materialVariation
      ? pineMaterials[rndIntBetween(0, pineMaterials.length - 1)]
      : pineMaterials[0];

    if (foliage.material instanceof THREE.Material) {
      foliage.material = foliageMaterial;
    }
    foliage.position.y = this.trunkHeight + this.foliageHeight / 2;
    pineGroup.add(foliage);

    // Create trunk
    this.createTrunk(pineGroup);

    return pineGroup;
  }

  private createPineTreeGroup(): THREE.Group {
    const group = new THREE.Group();

    // Create foliage
    const pineGeometry = this.createGeometry();
    const foliageMaterial = this.materialVariation
      ? pineMaterials[rndIntBetween(0, pineMaterials.length - 1)]
      : pineMaterials[0];
    const pine = new THREE.Mesh(pineGeometry, foliageMaterial);
    pine.position.y = this.trunkHeight + this.foliageHeight / 2;
    group.add(pine);

    // Create trunk
    this.createTrunk(group);

    return group;
  }

  private createTrunk(parent: THREE.Object3D): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.8, this.trunkHeight);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = this.trunkHeight / 2;
    parent.add(trunk);
  }
}

// Legacy compatibility layer for synchronous API
const PineTreeLegacy = PineTree as any;

// Add legacy load method that returns group directly
PineTreeLegacy.prototype.load = function (): THREE.Object3D {
  return this.createPineTreeGroup();
};

export default PineTreeLegacy;
