import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { DefaultHelmet } from '../helmets/DefaultHelmet';
import { FullFaceHelmet } from '../helmets/FullFaceHelmet';
import { HelmetWithHorns } from '../helmets/HelmetWithHorns';
import { HelmetType } from '../helmets/types';

export interface HeadOptions extends SimpleComponentOptions {
  headType?: string;
  helmetType?: HelmetType;
  helmetOptions?: any;
  glassesType?: any;
  skinColor?: string;
  beardColor?: string;
  eyeColor?: string;
  glassesColor?: string;
}

export abstract class BaseHead extends SimpleThreeComponent {
  protected headOptions: HeadOptions;

  constructor(metadata: ComponentMetadata, options: HeadOptions = {}) {
    super(metadata, options);

    this.headOptions = {
      skinColor: '#e0bea5',
      beardColor: '#cc613d',
      eyeColor: 'white',
      glassesColor: 'pink',
      castShadow: true,
      receiveShadow: true,
      ...options
    };
  }

  protected getColoredMaterial(color: string): THREE.MeshStandardMaterial {
    const materialKey = `head_material_${color}`;
    return resourceManager.getMaterial(materialKey, {
      type: 'standard',
      color,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    }) as THREE.MeshStandardMaterial;
  }

  protected getHelmet(): THREE.Group {
    switch (this.headOptions.helmetType) {
      case HelmetType.Default:
        return new DefaultHelmet(this.headOptions.helmetOptions).load();
      case HelmetType.FullFace:
        return new FullFaceHelmet(this.headOptions.helmetOptions).load();
      case HelmetType.WithHorns:
        return new HelmetWithHorns(this.headOptions.helmetOptions).load();
      default:
        return new DefaultHelmet(this.headOptions.helmetOptions).load();
    }
  }

  /**
   * Base geometry creation - most head components override createObject instead
   */
  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(300, 350, 280);
  }

  /**
   * Override to create composite head object instead of simple mesh
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    return this.createHeadGroup();
  }

  /**
   * Create the complete head group - to be implemented by subclasses
   */
  protected abstract createHeadGroup(): THREE.Group;
}
