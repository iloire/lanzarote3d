import * as THREE from 'three';
import {
  AsyncThreeComponent,
  ResourceDescriptor,
  LoadedResource,
  AsyncLoadCallbacks,
} from '../base/AsyncThreeComponent';
import { ComponentOptions } from '../base/IThreeComponent';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { CharacterType, characterRegistry, CharacterDefinition, CharacterAssets } from './CharacterRegistry';
import { logger } from '../../utils/logger';

/**
 * Options for pilot voxel component
 */
export interface PilotVoxelOptions extends ComponentOptions {
  // Character selection - either specify character type or manual asset paths
  characterType?: CharacterType;
  objFile?: string;
  textureFile?: string;

  // Material customization
  materialOptions?: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    side?: THREE.Side;
  };

  // Texture customization
  textureOptions?: {
    colorSpace?: THREE.ColorSpace;
    magFilter?: THREE.TextureFilter;
    minFilter?: THREE.TextureFilter;
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
  };

  // Character-specific overrides
  useAlternativeTexture?: number; // Index of alternative texture to use
  useAlternativeModel?: number; // Index of alternative model to use
}

/**
 * Modern PilotVoxel component using the new architecture
 *
 * Features:
 * - Async loading of OBJ models and textures with progress tracking
 * - Resource sharing through ResourceManager for textures
 * - Configurable material and texture properties
 * - Proper error handling and fallback support
 * - Performance monitoring and validation
 * - Complete lifecycle management
 */
export class PilotVoxel extends AsyncThreeComponent {
  protected pilotOptions: PilotVoxelOptions;
  protected characterDefinition?: CharacterDefinition;

  constructor(options: PilotVoxelOptions, callbacks?: AsyncLoadCallbacks) {
    const metadata = {
      name: 'PilotVoxel',
      version: '2.0.0',
      description: 'Voxel-style pilot character component with multi-character support',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'voxel', 'model', 'async', 'multi-character'],
    };

    super(metadata, options, callbacks);

    // Set default options first
    this.pilotOptions = {
      characterType: CharacterType.ADRI, // Default character
      materialOptions: {
        roughness: 0.8,
        metalness: 0.1,
        transparent: false,
        side: THREE.DoubleSide,
      },
      textureOptions: {
        colorSpace: THREE.SRGBColorSpace,
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      },
      castShadow: true,
      receiveShadow: true,
      ...options,
    };

    // Resolve character definition and assets (this will update pilotOptions with objFile/textureFile)
    this.resolveCharacterAssets(this.pilotOptions);

    // Apply character-specific defaults if available
    if (this.characterDefinition) {
      this.applyCharacterDefaults();
    }

    // Validate required options
    this.validateOptions();
  }

  /**
   * Resolve character assets from character type or manual paths
   */
  private resolveCharacterAssets(options: PilotVoxelOptions): void {
    logger.info(`🔍 Resolving character assets. CharacterType: ${options.characterType}`);
    logger.info(`🔍 Registry has ${characterRegistry ? 'INITIALIZED' : 'NOT INITIALIZED'}`);

    if (options.characterType) {
      // Use character registry
      this.characterDefinition = characterRegistry.getCharacter(options.characterType);

      logger.info(`🔍 Character definition found: ${this.characterDefinition ? 'YES' : 'NO'}`);

      if (!this.characterDefinition) {
        console.warn(
          `Character type ${options.characterType} not found in registry, falling back to manual assets`
        );
        return;
      }

      logger.info(
        `🎭 Using character: ${this.characterDefinition.name} (${this.characterDefinition.id})`
      );

      // Set asset paths from character definition
      const assets = this.characterDefinition.assets;
      this.pilotOptions = {
        ...options,
        objFile: this.getSelectedModel(assets),
        textureFile: this.getSelectedTexture(assets),
      };
    } else if (options.objFile && options.textureFile) {
      // Use manual asset paths
      logger.info('🎭 Using manual asset paths for PilotVoxel');
    } else {
      // No character specified, use default
      logger.info('🎭 No character specified, using default character (Adri)');
      this.characterDefinition = characterRegistry.getCharacter(CharacterType.ADRI);
      if (this.characterDefinition) {
        const assets = this.characterDefinition.assets;
        this.pilotOptions = {
          ...options,
          characterType: CharacterType.ADRI,
          objFile: assets.objFile,
          textureFile: assets.textureFile,
        };
      }
    }
  }

  /**
   * Get selected model based on options
   */
  private getSelectedModel(assets: CharacterAssets): string {
    if (this.pilotOptions.useAlternativeModel !== undefined && assets.alternativeModels) {
      const altIndex = Math.min(
        this.pilotOptions.useAlternativeModel,
        assets.alternativeModels.length - 1
      );
      return assets.alternativeModels[altIndex];
    }
    return assets.objFile;
  }

  /**
   * Get selected texture based on options
   */
  private getSelectedTexture(assets: CharacterAssets): string {
    if (this.pilotOptions.useAlternativeTexture !== undefined && assets.alternativeTextures) {
      const altIndex = Math.min(
        this.pilotOptions.useAlternativeTexture,
        assets.alternativeTextures.length - 1
      );
      return assets.alternativeTextures[altIndex];
    }
    return assets.textureFile;
  }

  /**
   * Apply character-specific defaults
   */
  private applyCharacterDefaults(): void {
    if (!this.characterDefinition) return;

    // Apply character's default scale
    if (!this.pilotOptions.scale && this.characterDefinition.defaultScale) {
      this.pilotOptions.scale = this.characterDefinition.defaultScale;
    }

    // Apply character's default material options
    if (this.characterDefinition.defaultMaterialOptions) {
      this.pilotOptions.materialOptions = {
        ...this.characterDefinition.defaultMaterialOptions,
        ...this.pilotOptions.materialOptions,
      };
    }
  }

  /**
   * Validate options and requirements
   */
  protected override validateOptions(): void {
    if (!this.pilotOptions.objFile) {
      throw new Error('PilotVoxel requires objFile option or characterType');
    }
    if (!this.pilotOptions.textureFile) {
      throw new Error('PilotVoxel requires textureFile option or characterType');
    }
  }

  /**
   * Define resources that need to be loaded
   */
  protected getResourceDescriptors(): ResourceDescriptor[] {
    return [
      {
        id: 'model',
        type: 'model',
        url: this.pilotOptions.objFile,
        options: this.pilotOptions.materialOptions,
      },
      {
        id: 'texture',
        type: 'texture',
        url: this.pilotOptions.textureFile,
        options: this.pilotOptions.textureOptions,
      },
    ];
  }

  /**
   * Create the pilot object from loaded resources
   */
  protected async createObjectFromResources(
    resources: Map<string, LoadedResource>
  ): Promise<THREE.Object3D> {
    const modelResource = resources.get('model');
    const textureResource = resources.get('texture');

    if (!modelResource || !textureResource) {
      throw new Error('Required resources not loaded');
    }

    const model = modelResource.data as THREE.Object3D;
    const texture = textureResource.data as THREE.Texture;

    // Clone the model to avoid modifying the cached version
    const pilotGroup = model.clone();
    pilotGroup.name = 'PilotVoxel';

    // Configure texture
    this.configureTexture(texture);

    // Create material with texture
    const material = this.createPilotMaterial(texture);

    // Apply material to all meshes in the model
    this.applyMaterialToModel(pilotGroup, material);

    // Configure shadows
    this.configureShadows(pilotGroup);

    // Apply transform options
    this.applyTransforms(pilotGroup);

    return pilotGroup;
  }

  /**
   * Override model loading to use OBJ loader
   */
  protected override async loadModel(url: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      loader.load(
        url,
        object => {
          resolve(object);
        },
        undefined,
        error => {
          reject(new Error(`Failed to load OBJ model: ${error}`));
        }
      );
    });
  }

  /**
   * Configure texture properties
   */
  private configureTexture(texture: THREE.Texture): void {
    const textureOptions = this.pilotOptions.textureOptions!;

    texture.colorSpace = textureOptions.colorSpace!;
    texture.magFilter = textureOptions.magFilter! as THREE.MagnificationTextureFilter;
    texture.minFilter = textureOptions.minFilter!;
    texture.wrapS = textureOptions.wrapS!;
    texture.wrapT = textureOptions.wrapT!;
    texture.needsUpdate = true;
  }

  /**
   * Create material for the pilot
   */
  private createPilotMaterial(texture: THREE.Texture): THREE.Material {
    const materialOptions = this.pilotOptions.materialOptions!;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: materialOptions.roughness,
      metalness: materialOptions.metalness,
      transparent: materialOptions.transparent,
      side: materialOptions.side,
    });
  }

  /**
   * Apply material to all meshes in the model
   */
  private applyMaterialToModel(object: THREE.Object3D, material: THREE.Material): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        // Dispose of old material if it exists
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }

        child.material = material;
      }
    });
  }

  /**
   * Configure shadows for the model
   */
  private configureShadows(object: THREE.Object3D): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = this.pilotOptions.castShadow;
        child.receiveShadow = this.pilotOptions.receiveShadow;
      }
    });
  }

  /**
   * Apply transform options to the object
   */
  private applyTransforms(object: THREE.Object3D): void {
    if (this.pilotOptions.position) {
      object.position.copy(this.pilotOptions.position);
    }

    if (this.pilotOptions.rotation) {
      object.rotation.copy(this.pilotOptions.rotation);
    }

    if (this.pilotOptions.scale) {
      if (typeof this.pilotOptions.scale === 'number') {
        object.scale.setScalar(this.pilotOptions.scale);
      } else {
        object.scale.copy(this.pilotOptions.scale);
      }
    }
  }

  /**
   * Provide fallback resources for failed loads
   */
  protected override getFallbackResources(): Partial<Record<string, THREE.Object3D | THREE.Texture>> {
    return {
      model: this.createFallbackModel(),
      texture: this.createFallbackTexture(),
    };
  }

  /**
   * Create a fallback model if OBJ loading fails
   */
  private createFallbackModel(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = 'FallbackPilot';

    // Create a simple box as fallback
    const geometry = new THREE.BoxGeometry(100, 200, 60);
    const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'fallbackBody';

    // Add a smaller box for head
    const headGeometry = new THREE.BoxGeometry(60, 60, 60);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 130, 0);
    head.name = 'fallbackHead';

    group.add(mesh);
    group.add(head);

    return group;
  }

  /**
   * Create a fallback texture if texture loading fails
   */
  private createFallbackTexture(): THREE.Texture {
    // Create a simple colored canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    // Create a simple pattern
    context.fillStyle = '#ff6b6b';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#ffffff';
    context.fillRect(16, 16, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    return texture;
  }

  /**
   * Validate pilot-specific requirements
   */
  protected override validateComponent(): string[] {
    const issues = super.validateComponent();

    if (!this.pilotOptions.objFile) {
      issues.push('objFile is required');
    }

    if (!this.pilotOptions.textureFile) {
      issues.push('textureFile is required');
    }

    // Check if URLs are valid
    try {
      new URL(this.pilotOptions.objFile, window.location.origin);
    } catch {
      // Check if it's a relative path
      if (
        !this.pilotOptions.objFile.startsWith('/') &&
        !this.pilotOptions.objFile.startsWith('./')
      ) {
        issues.push('objFile must be a valid URL or relative path');
      }
    }

    try {
      new URL(this.pilotOptions.textureFile, window.location.origin);
    } catch {
      // Check if it's a relative path
      if (
        !this.pilotOptions.textureFile.startsWith('/') &&
        !this.pilotOptions.textureFile.startsWith('./')
      ) {
        issues.push('textureFile must be a valid URL or relative path');
      }
    }

    return issues;
  }

  /**
   * Get the pilot model object (convenience method)
   */
  public getPilotModel(): THREE.Object3D | null {
    return this.getObject();
  }

  /**
   * Update material properties at runtime
   */
  public updateMaterialProperties(properties: Partial<PilotVoxelOptions['materialOptions']>): void {
    const object = this.getObject();
    if (!object) return;

    // Update stored options
    this.pilotOptions.materialOptions = {
      ...this.pilotOptions.materialOptions,
      ...properties,
    };

    // Apply to existing material
    object.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        Object.assign(child.material, properties);
        child.material.needsUpdate = true;
      }
    });
  }

  /**
   * Update texture properties at runtime
   */
  public updateTextureProperties(properties: Partial<PilotVoxelOptions['textureOptions']>): void {
    const object = this.getObject();
    if (!object) return;

    // Update stored options
    this.pilotOptions.textureOptions = {
      ...this.pilotOptions.textureOptions,
      ...properties,
    };

    // Apply to existing textures
    object.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const material = child.material;
        if (material.map) {
          Object.assign(material.map, properties);
          material.map.needsUpdate = true;
        }
      }
    });
  }

  /**
   * Switch to a different character type
   */
  public async switchCharacter(
    characterType: CharacterType,
    options?: Partial<PilotVoxelOptions>
  ): Promise<THREE.Object3D> {
    logger.info(`🔄 Switching character to: ${characterType}`);

    // Update options with new character
    const newOptions: PilotVoxelOptions = {
      ...this.pilotOptions,
      characterType,
      ...options,
    };

    // Dispose current object
    this.dispose();

    // Re-initialize with new character
    this.resolveCharacterAssets(newOptions);
    this.pilotOptions = newOptions;

    if (this.characterDefinition) {
      this.applyCharacterDefaults();
    }

    this.validateOptions();

    // Reload with new character
    return await this.load();
  }

  /**
   * Switch to alternative texture for current character
   */
  public async switchToAlternativeTexture(textureIndex: number): Promise<void> {
    if (!this.characterDefinition?.assets.alternativeTextures) {
      console.warn('No alternative textures available for current character');
      return;
    }

    const altTextures = this.characterDefinition.assets.alternativeTextures;
    if (textureIndex >= altTextures.length) {
      console.warn(`Texture index ${textureIndex} out of range (max: ${altTextures.length - 1})`);
      return;
    }

    logger.info(`🎨 Switching to alternative texture ${textureIndex}`);

    // Update options and reload
    this.pilotOptions.useAlternativeTexture = textureIndex;
    this.pilotOptions.textureFile = altTextures[textureIndex];

    // If component is already loaded, reload with new texture
    if (this.getObject()) {
      await this.load();
    }
  }

  /**
   * Get current character information
   */
  public getCharacterInfo(): {
    characterType?: CharacterType;
    characterName?: string;
    characterDefinition?: CharacterDefinition;
    availableAlternatives: {
      textures: number;
      models: number;
    };
  } {
    return {
      characterType: this.pilotOptions.characterType,
      characterName: this.characterDefinition?.name,
      characterDefinition: this.characterDefinition,
      availableAlternatives: {
        textures: this.characterDefinition?.assets.alternativeTextures?.length || 0,
        models: this.characterDefinition?.assets.alternativeModels?.length || 0,
      },
    };
  }

  /**
   * Get all available character types
   */
  public static getAvailableCharacters(): CharacterDefinition[] {
    return characterRegistry.getAllCharacters();
  }

  /**
   * Create a random character variant
   */
  public static createRandomCharacter(baseOptions?: Partial<PilotVoxelOptions>): PilotVoxel {
    const randomCharacter = characterRegistry.getRandomCharacter();

    const options: PilotVoxelOptions = {
      characterType: randomCharacter.id,
      ...baseOptions,
    };

    // Randomly select alternative textures if available
    if (randomCharacter.assets.alternativeTextures && Math.random() > 0.5) {
      options.useAlternativeTexture = Math.floor(
        Math.random() * randomCharacter.assets.alternativeTextures.length
      );
    }

    return new PilotVoxel(options);
  }

  /**
   * Clone with different character
   */
  protected override createClone(options: ComponentOptions): PilotVoxel {
    return new PilotVoxel(
      {
        ...this.pilotOptions,
        ...(options as PilotVoxelOptions),
      },
      this.callbacks
    );
  }

  /**
   * Export character-specific serialization
   */
  protected override serializeComponent(): Record<string, unknown> {
    return {
      pilotOptions: this.pilotOptions,
      characterInfo: this.getCharacterInfo(),
      resourceDescriptors: this.getResourceDescriptors(),
    };
  }
}

export default PilotVoxel;
