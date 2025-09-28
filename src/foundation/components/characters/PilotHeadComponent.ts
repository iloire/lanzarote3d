import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentOptions } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Head types available for pilots
 */
export enum PilotHeadType {
  Default = 'default',
  Warrior = 'warrior',
  Skeleton = 'skeleton',
  Devil = 'devil',
}

/**
 * Helmet types available
 */
export enum HelmetType {
  None = 'none',
  Default = 'default',
  FullFace = 'fullface',
  WithHorns = 'withhorns',
  Winged = 'winged',
  Spiked = 'spiked',
  Shark = 'shark',
  Crown = 'crown',
  Crystal = 'crystal',
}

/**
 * Glasses types available
 */
export enum GlassesType {
  None = 'none',
  Default = 'default',
  Sunglasses = 'sunglasses',
}

/**
 * Options for pilot head component
 */
export interface PilotHeadOptions extends SimpleComponentOptions {
  headType?: PilotHeadType;
  helmetType?: HelmetType;
  glassesType?: GlassesType;
  skinColor?: number | string;
  beardColor?: number | string;
  eyeColor?: number | string;
  glassesColor?: number | string;
  helmetColor?: number | string;
  helmetColor2?: number | string;
  helmetColor3?: number | string;
}

/**
 * Modern PilotHead component using the new architecture
 *
 * Features:
 * - Multiple head types with different facial features
 * - Configurable helmet and glasses options
 * - Shared geometry and materials through ResourceManager
 * - Proper component lifecycle management
 * - Color customization for all features
 */
export class PilotHead extends SimpleThreeComponent {
  protected headOptions: PilotHeadOptions;

  constructor(options: PilotHeadOptions = {}) {
    const metadata = {
      name: 'PilotHead',
      version: '2.0.0',
      description: 'Configurable pilot head with helmet and glasses options',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'head', 'customizable']
    };

    super(metadata, options);

    // Set default options
    this.headOptions = {
      headType: PilotHeadType.Default,
      helmetType: HelmetType.Default,
      glassesType: GlassesType.Default,
      skinColor: 0xe0bea5,
      beardColor: 0xcc613d,
      eyeColor: 0xffffff,
      glassesColor: 0xff69b4,
      helmetColor: 0xffff00,
      helmetColor2: 0xffffff,
      helmetColor3: 0xc2c2c2,
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
    // since we override createObject to create a composite head
    return new THREE.BufferGeometry();
  }

  /**
   * Override to create composite head object
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const headGroup = new THREE.Group();
    headGroup.name = 'PilotHead';

    // Create the main head based on type
    const head = this.createHead();
    headGroup.add(head);

    // Add helmet if specified
    if (this.headOptions.helmetType !== HelmetType.None) {
      const helmet = this.createHelmet();
      headGroup.add(helmet);
    }

    // Add glasses if specified
    if (this.headOptions.glassesType !== GlassesType.None) {
      const glasses = this.createGlasses();
      head.add(glasses); // Attach glasses to head, not group
    }

    // Apply transform options
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
   * Create the main head mesh based on head type
   */
  private createHead(): THREE.Object3D {
    const headGroup = new THREE.Group();
    headGroup.name = 'head';

    // Get shared head geometry
    const geometryKey = `head_${this.headOptions.headType}`;
    const geometry = resourceManager.getGeometry(geometryKey, () => {
      return this.createHeadGeometry();
    });

    // Get shared skin material
    const materialKey = `skin_material_${this.headOptions.skinColor}`;
    const skinMaterial = resourceManager.getMaterial(materialKey, {
      type: 'standard',
      color: this.headOptions.skinColor,
      roughness: 0.8,
      metalness: 0.1
    });

    // Create main head mesh
    const headMesh = new THREE.Mesh(geometry, skinMaterial);
    headMesh.name = 'headMesh';
    headMesh.castShadow = this.headOptions.castShadow;
    headMesh.receiveShadow = this.headOptions.receiveShadow;
    headGroup.add(headMesh);

    // Add facial features based on head type
    this.addFacialFeatures(headGroup, skinMaterial);

    return headGroup;
  }

  /**
   * Create head geometry based on head type
   */
  private createHeadGeometry(): THREE.BufferGeometry {
    switch (this.headOptions.headType) {
      case PilotHeadType.Warrior:
        return this.createWarriorHeadGeometry();
      case PilotHeadType.Skeleton:
        return this.createSkeletonHeadGeometry();
      case PilotHeadType.Devil:
        return this.createDevilHeadGeometry();
      case PilotHeadType.Default:
      default:
        return new THREE.BoxGeometry(300, 350, 280);
    }
  }

  /**
   * Create warrior head geometry (more angular)
   */
  private createWarriorHeadGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(320, 380, 300);
    // Could add more complex geometry modifications here
    return geometry;
  }

  /**
   * Create skeleton head geometry (thinner)
   */
  private createSkeletonHeadGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(280, 330, 260);
    return geometry;
  }

  /**
   * Create devil head geometry (with horn points)
   */
  private createDevilHeadGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(310, 360, 290);
    return geometry;
  }

  /**
   * Add facial features like mouth, eyes, etc.
   */
  private addFacialFeatures(headGroup: THREE.Group, skinMaterial: THREE.Material): void {
    // Add mouth
    const mouthGeometry = resourceManager.getGeometry('mouth_geometry', () => {
      return new THREE.BoxGeometry(90, 60, 50);
    });

    const mouth = new THREE.Mesh(mouthGeometry, skinMaterial);
    mouth.name = 'mouth';
    mouth.position.set(0, -130, 155);
    mouth.castShadow = this.headOptions.castShadow;
    headGroup.add(mouth);

    // Add lip
    const lipMaterialKey = `lip_material_${0x333333}`;
    const lipMaterial = resourceManager.getMaterial(lipMaterialKey, {
      type: 'standard',
      color: 0x333333
    });

    const lipGeometry = resourceManager.getGeometry('lip_geometry', () => {
      return new THREE.BoxGeometry(40, 20, 50);
    });

    const lip = new THREE.Mesh(lipGeometry, lipMaterial);
    lip.name = 'lip';
    lip.position.set(0, -120, 162);
    lip.castShadow = this.headOptions.castShadow;
    headGroup.add(lip);

    // Add eyes based on head type
    this.addEyes(headGroup);

    // Add beard or other features based on head type
    if (this.headOptions.headType === PilotHeadType.Warrior) {
      this.addBeard(headGroup);
    }
  }

  /**
   * Add eyes to the head
   */
  private addEyes(headGroup: THREE.Group): void {
    const eyeMaterialKey = `eye_material_${this.headOptions.eyeColor}`;
    const eyeMaterial = resourceManager.getMaterial(eyeMaterialKey, {
      type: 'standard',
      color: this.headOptions.eyeColor,
      emissive: this.headOptions.eyeColor,
      emissiveIntensity: 0.2
    });

    const eyeGeometry = resourceManager.getGeometry('eye_geometry', () => {
      return new THREE.SphereGeometry(25, 8, 6);
    });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.name = 'leftEye';
    leftEye.position.set(-60, 50, 120);
    leftEye.castShadow = this.headOptions.castShadow;
    headGroup.add(leftEye);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.name = 'rightEye';
    rightEye.position.set(60, 50, 120);
    rightEye.castShadow = this.headOptions.castShadow;
    headGroup.add(rightEye);
  }

  /**
   * Add beard for warrior head type
   */
  private addBeard(headGroup: THREE.Group): void {
    const beardMaterialKey = `beard_material_${this.headOptions.beardColor}`;
    const beardMaterial = resourceManager.getMaterial(beardMaterialKey, {
      type: 'standard',
      color: this.headOptions.beardColor,
      roughness: 0.9
    });

    const beardGeometry = resourceManager.getGeometry('beard_geometry', () => {
      return new THREE.BoxGeometry(200, 100, 80);
    });

    const beard = new THREE.Mesh(beardGeometry, beardMaterial);
    beard.name = 'beard';
    beard.position.set(0, -200, 100);
    beard.castShadow = this.headOptions.castShadow;
    headGroup.add(beard);
  }

  /**
   * Create helmet based on helmet type
   */
  private createHelmet(): THREE.Object3D {
    const helmetGeometry = resourceManager.getGeometry(`helmet_${this.headOptions.helmetType}`, () => {
      return this.createHelmetGeometry();
    });

    const helmetMaterialKey = `helmet_material_${this.headOptions.helmetColor}`;
    const helmetMaterial = resourceManager.getMaterial(helmetMaterialKey, {
      type: 'standard',
      color: this.headOptions.helmetColor,
      metalness: 0.3,
      roughness: 0.4
    });

    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.name = 'helmet';
    helmet.position.set(0, 200, 0);
    helmet.castShadow = this.headOptions.castShadow;
    helmet.receiveShadow = this.headOptions.receiveShadow;

    return helmet;
  }

  /**
   * Create helmet geometry based on type
   */
  private createHelmetGeometry(): THREE.BufferGeometry {
    switch (this.headOptions.helmetType) {
      case HelmetType.FullFace:
        return new THREE.SphereGeometry(200, 16, 12);
      case HelmetType.WithHorns:
        return new THREE.ConeGeometry(180, 150, 8);
      case HelmetType.Winged:
        return new THREE.BoxGeometry(350, 100, 320);
      case HelmetType.Default:
      default:
        return new THREE.SphereGeometry(180, 12, 8);
    }
  }

  /**
   * Create glasses based on glasses type
   */
  private createGlasses(): THREE.Object3D {
    const glassesGroup = new THREE.Group();
    glassesGroup.name = 'glasses';

    const glassesMaterialKey = `glasses_material_${this.headOptions.glassesColor}`;
    const glassesMaterial = resourceManager.getMaterial(glassesMaterialKey, {
      type: 'standard',
      color: this.headOptions.glassesColor,
      transparent: true,
      opacity: 0.8
    });

    const lensGeometry = resourceManager.getGeometry('glasses_lens', () => {
      return new THREE.RingGeometry(20, 40, 8);
    });

    // Left lens
    const leftLens = new THREE.Mesh(lensGeometry, glassesMaterial);
    leftLens.position.set(-50, 50, 130);
    leftLens.castShadow = this.headOptions.castShadow;
    glassesGroup.add(leftLens);

    // Right lens
    const rightLens = new THREE.Mesh(lensGeometry, glassesMaterial);
    rightLens.position.set(50, 50, 130);
    rightLens.castShadow = this.headOptions.castShadow;
    glassesGroup.add(rightLens);

    // Bridge
    const bridgeGeometry = resourceManager.getGeometry('glasses_bridge', () => {
      return new THREE.BoxGeometry(30, 5, 5);
    });

    const bridge = new THREE.Mesh(bridgeGeometry, glassesMaterial);
    bridge.position.set(0, 50, 130);
    bridge.castShadow = this.headOptions.castShadow;
    glassesGroup.add(bridge);

    return glassesGroup;
  }

  /**
   * Override geometry key to account for head-specific parameters
   */
  protected override getGeometryKey(): string {
    return `pilot_head_${this.headOptions.headType}_${this.headOptions.helmetType}_${this.headOptions.glassesType}`;
  }

  /**
   * Override material key for composite materials
   */
  protected override getMaterialKey(): string {
    return `pilot_head_composite_${this.headOptions.skinColor}_${this.headOptions.helmetColor}`;
  }

  /**
   * Override dispose to release all head-specific resources
   */
  override dispose(): void {
    // Release all shared resources
    const resourceKeys = [
      `head_${this.headOptions.headType}`,
      `skin_material_${this.headOptions.skinColor}`,
      `helmet_${this.headOptions.helmetType}`,
      `helmet_material_${this.headOptions.helmetColor}`,
      `glasses_material_${this.headOptions.glassesColor}`,
      `eye_material_${this.headOptions.eyeColor}`,
      `beard_material_${this.headOptions.beardColor}`,
      'mouth_geometry',
      'lip_geometry',
      'eye_geometry',
      'beard_geometry',
      'glasses_lens',
      'glasses_bridge'
    ];

    resourceKeys.forEach(key => {
      resourceManager.releaseResource(key);
    });

    super.dispose();
  }

  /**
   * Create clone with same head configuration
   */
  protected override createClone(options: ComponentOptions): PilotHead {
    return new PilotHead({ ...this.headOptions, ...options as PilotHeadOptions });
  }

  /**
   * Validate head-specific requirements
   */
  protected override validateComponent(): string[] {
    const issues = super.validateComponent();

    if (!Object.values(PilotHeadType).includes(this.headOptions.headType!)) {
      issues.push(`Invalid head type: ${this.headOptions.headType}`);
    }

    if (!Object.values(HelmetType).includes(this.headOptions.helmetType!)) {
      issues.push(`Invalid helmet type: ${this.headOptions.helmetType}`);
    }

    if (!Object.values(GlassesType).includes(this.headOptions.glassesType!)) {
      issues.push(`Invalid glasses type: ${this.headOptions.glassesType}`);
    }

    return issues;
  }

  /**
   * Export head-specific serialization
   */
  protected override serializeComponent(): any {
    return {
      headOptions: this.headOptions
    };
  }
}

// Legacy export for backward compatibility
export const PilotHeadComponent = PilotHead;