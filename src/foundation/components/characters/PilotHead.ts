import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { DefaultHead } from './heads/DefaultHead';
import { WarriorHead } from './heads/WarriorHead';
import { SkeletonHead } from './heads/SkeletonHead';
import { DevilHead } from './heads/DevilHead';
import { HeadOptions } from './heads/BaseHead';
import { HelmetType, HelmetOptions } from './helmets/types';

// Re-export helmet types for external use
export { HelmetType } from './helmets/types';
export type { HelmetOptions } from './helmets/types';

export enum PilotHeadType {
  Default,
  Warrior,
  Skeleton,
  Devil,
}

export enum GlassesType {
  Default,
  SunGlasses1,
}

export interface PilotHeadOptions extends SimpleComponentOptions {
  headType?: PilotHeadType;
  helmetType?: HelmetType;
  helmetOptions?: HelmetOptions;
  glassesType?: GlassesType;
  skinColor?: string;
  beardColor?: string;
  eyeColor?: string;
  glassesColor?: string;
}

const DEFAULT_OPTIONS = {
  skinColor: '#e0bea5',
  beardColor: '#cc613d',
  eyeColor: 'white',
  glassesColor: 'pink',
  headType: PilotHeadType.Default,
  glassesType: GlassesType.Default,
  helmetType: HelmetType.Default,
  helmetOptions: {
    color: 'yellow',
    color2: 'white',
    color3: '#c2c2c2',
  },
};

/**
 * Modern PilotHead component using the new Three.js architecture
 *
 * This component acts as a factory for different head types,
 * delegating to specialized head implementations while providing
 * a unified interface and modern component lifecycle.
 */
export class PilotHead extends SimpleThreeComponent {
  private headOptions: PilotHeadOptions;

  constructor(options: PilotHeadOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'PilotHead',
      version: '2.0.0',
      description: 'Configurable pilot head with multiple types and helmet options',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'head', 'configurable'],
    };

    super(metadata, options);

    this.headOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Create geometry - not used since we create composite objects
   */
  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BufferGeometry();
  }

  /**
   * Override to create composite head object based on head type
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const headGroup = await this.createHeadByType();

    // Apply component options
    if (this.headOptions.position) {
      headGroup.position.copy(this.headOptions.position);
    }
    if (this.headOptions.rotation) {
      headGroup.rotation.copy(this.headOptions.rotation);
    }
    if (this.headOptions.scale) {
      if (typeof this.headOptions.scale === 'number') {
        headGroup.scale.setScalar(this.headOptions.scale);
      } else {
        headGroup.scale.copy(this.headOptions.scale);
      }
    }

    return headGroup;
  }

  /**
   * Create head based on specified type
   */
  private async createHeadByType(): Promise<THREE.Group> {
    // Convert PilotHeadOptions to HeadOptions for the specific head components
    const headOptions: HeadOptions = {
      headType: this.getHeadTypeString(),
      helmetType: this.headOptions.helmetType,
      helmetOptions: this.headOptions.helmetOptions,
      glassesType: this.headOptions.glassesType,
      skinColor: this.headOptions.skinColor,
      beardColor: this.headOptions.beardColor,
      eyeColor: this.headOptions.eyeColor,
      glassesColor: this.headOptions.glassesColor,
      castShadow: this.headOptions.castShadow,
      receiveShadow: this.headOptions.receiveShadow,
    };

    switch (this.headOptions.headType) {
      case PilotHeadType.Warrior:
        return (await new WarriorHead(headOptions).load()) as THREE.Group;
      case PilotHeadType.Skeleton:
        return (await new SkeletonHead(headOptions).load()) as THREE.Group;
      case PilotHeadType.Devil:
        return (await new DevilHead(headOptions).load()) as THREE.Group;
      case PilotHeadType.Default:
      default:
        return (await new DefaultHead(headOptions).load()) as THREE.Group;
    }
  }

  /**
   * Convert enum to string for head components
   */
  private getHeadTypeString(): string {
    switch (this.headOptions.headType) {
      case PilotHeadType.Warrior:
        return 'warrior';
      case PilotHeadType.Skeleton:
        return 'skeleton';
      case PilotHeadType.Devil:
        return 'devil';
      case PilotHeadType.Default:
      default:
        return 'default';
    }
  }

  /**
   * Legacy load method for backward compatibility
   */
  override async load(): Promise<THREE.Group> {
    return (await super.load()) as THREE.Group;
  }
}

export default PilotHead;
