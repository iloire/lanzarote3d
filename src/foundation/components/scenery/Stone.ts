// inspired in: https://codepen.io/yitliu/pen/gOaPxRX
import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';

const mat_stone = new THREE.MeshLambertMaterial({ color: 0x9eaeac });

export interface StoneOptions extends SimpleComponentOptions {
  stoneSize?: number;
  stoneColor?: number | string;
  roughness?: number;
}

class Stone extends SimpleThreeComponent {
  private stoneSize: number = 1;
  private stoneColor: number | string = 0x9eaeac;
  private roughness: number = 0;

  constructor(options: StoneOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Stone',
      version: '1.0.0',
      description: 'Procedural stone component with dodecahedral geometry',
      tags: ['scenery', 'nature', 'rock', 'procedural']
    };

    super(metadata, options);

    this.stoneSize = options.stoneSize || 1;
    this.stoneColor = options.stoneColor || 0x9eaeac;
    this.roughness = options.roughness || 0;

    if (options.scale) {
      const scaleFactor = typeof options.scale === 'number' ? options.scale : 1;
      this.stoneSize *= scaleFactor;
    }
  }

  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.DodecahedronGeometry(this.stoneSize, this.roughness);
  }

  protected override getMaterialConfig() {
    return {
      type: 'lambert' as const,
      color: this.stoneColor,
      transparent: false,
      opacity: 1.0,
      wireframe: false,
      side: THREE.FrontSide
    };
  }

  public override async load(): Promise<THREE.Object3D> {
    const stone = await super.load() as THREE.Mesh;

    // Apply default stone positioning and rotation
    stone.rotation.set(0, 0, Math.PI / 2);
    stone.position.set(0, 0.7, 5.3);
    stone.castShadow = true;

    return stone;
  }

  private createStone(): THREE.Mesh {
    const geo_stone = this.createGeometry();
    const stone = new THREE.Mesh(geo_stone, mat_stone);
    stone.castShadow = true;

    // Apply default positioning and rotation
    stone.rotation.set(0, 0, Math.PI / 2);
    stone.scale.set(1, 1, 1);
    stone.position.set(0, 0.7, 5.3);

    return stone;
  }
}

// Legacy compatibility layer for synchronous API
const StoneLegacy = Stone as any;

// Add legacy load method that returns mesh directly
StoneLegacy.prototype.load = function(): THREE.Object3D {
  return this.createStone();
};

export default StoneLegacy;
