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
      ...options,
    };
  }

  protected getColoredMaterial(color: string): THREE.MeshStandardMaterial {
    const materialKey = `head_material_${color}`;
    return resourceManager.getMaterial(materialKey, {
      type: 'standard',
      color,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
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
   * Create basic eyes with configurable color and position
   */
  protected createBasicEyes(eyeColor: string = 'white', scale: number = 1): THREE.Mesh[] {
    const eyeMaterialKey = `eye_material_${eyeColor}`;
    const eyeMaterial = resourceManager.getMaterial(eyeMaterialKey, {
      type: 'standard',
      color: eyeColor,
      emissive: eyeColor,
      emissiveIntensity: 0.2,
    });

    const eyeGeometry = resourceManager.getGeometry(`eye_geometry_${scale}`, () => {
      return new THREE.SphereGeometry(25 * scale, 8, 6);
    });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.name = 'leftEye';
    leftEye.position.set(-60 * scale, 50 * scale, 120 * scale);
    leftEye.castShadow = this.headOptions.castShadow;

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.name = 'rightEye';
    rightEye.position.set(60 * scale, 50 * scale, 120 * scale);
    rightEye.castShadow = this.headOptions.castShadow;

    return [leftEye, rightEye];
  }

  /**
   * Create basic mouth with configurable size and color
   */
  protected createBasicMouth(
    width: number = 90,
    height: number = 60,
    depth: number = 50,
    color?: string
  ): THREE.Mesh {
    const skinColor = color || this.headOptions.skinColor || '#e0bea5';
    const skinMat = this.getColoredMaterial(skinColor);
    const mouthGeo = new THREE.BoxGeometry(width, height, depth);
    const mouth = new THREE.Mesh(mouthGeo, skinMat);
    mouth.name = 'mouth';
    mouth.position.set(0, -130, 155);
    mouth.castShadow = this.headOptions.castShadow;
    return mouth;
  }

  /**
   * Create basic nose with configurable size and color
   */
  protected createBasicNose(
    width: number = 35,
    height: number = 50,
    depth: number = 50,
    color?: string
  ): THREE.Mesh {
    const skinColor = color || this.headOptions.skinColor || '#e0bea5';
    const skinMat = this.getColoredMaterial(skinColor);
    const noseGeo = new THREE.BoxGeometry(width, height, depth);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.name = 'nose';
    nose.position.set(0, 50, 140);
    nose.castShadow = this.headOptions.castShadow;
    return nose;
  }

  /**
   * Create a basic head mesh with configurable dimensions
   */
  protected createBasicHeadMesh(
    width: number = 300,
    height: number = 350,
    depth: number = 280,
    color?: string
  ): THREE.Mesh {
    const skinColor = color || this.headOptions.skinColor || '#e0bea5';
    const skinMat = this.getColoredMaterial(skinColor);
    const headGeo = new THREE.BoxGeometry(width, height, depth);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.name = 'head';
    head.castShadow = this.headOptions.castShadow;
    head.receiveShadow = this.headOptions.receiveShadow;
    return head;
  }

  /**
   * Apply shadow settings to an array of meshes
   */
  protected applyShadowSettings(meshes: THREE.Mesh[]): void {
    meshes.forEach(mesh => {
      mesh.castShadow = this.headOptions.castShadow;
      mesh.receiveShadow = this.headOptions.receiveShadow;
    });
  }

  /**
   * Create the complete head group - to be implemented by subclasses
   */
  protected abstract createHeadGroup(): THREE.Group;
}
