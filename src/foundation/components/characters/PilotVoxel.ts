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

    // Prepare options with resolved assets BEFORE calling super (which calls validateOptions)
    const preparedOptions = PilotVoxel.prepareOptions(options);

    // Now call super with the prepared options
    super(metadata, preparedOptions, callbacks);

    // Set pilot options after super
    this.pilotOptions = preparedOptions;

    // Resolve character definition for later use
    if (preparedOptions.characterType) {
      this.characterDefinition = characterRegistry.getCharacter(preparedOptions.characterType);
    }

    // Apply character-specific defaults if available
    if (this.characterDefinition) {
      this.applyCharacterDefaults();
    }
  }

  /**
   * Static method to prepare options before construction
   * This resolves character assets from the registry
   */
  private static prepareOptions(options: PilotVoxelOptions): PilotVoxelOptions {
    const preparedOptions: PilotVoxelOptions = {
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

    // Resolve character assets
    logger.info(`🔍 Resolving character assets. CharacterType: ${preparedOptions.characterType}`);

    if (preparedOptions.characterType) {
      const characterDefinition = characterRegistry.getCharacter(preparedOptions.characterType);

      if (characterDefinition) {
        logger.info(`🎭 Using character: ${characterDefinition.name} (${characterDefinition.id})`);

        const assets = characterDefinition.assets;
        logger.info(`🔍 Character assets: ${assets ? 'FOUND' : 'MISSING'}`);

        if (assets) {
          logger.info(`   - objFile: ${assets.objFile || 'MISSING'}`);
          logger.info(`   - textureFile: ${assets.textureFile || 'MISSING'}`);

          // Get selected model and texture
          const objFile = PilotVoxel.getSelectedModelStatic(
            assets,
            preparedOptions.useAlternativeModel
          );
          const textureFile = PilotVoxel.getSelectedTextureStatic(
            assets,
            preparedOptions.useAlternativeTexture
          );

          if (!objFile || !textureFile) {
            throw new Error(
              `Character ${characterDefinition.name} has incomplete assets (objFile: ${!!objFile}, textureFile: ${!!textureFile})`
            );
          }

          logger.info(`✅ Assets resolved - objFile: ${objFile}, textureFile: ${textureFile}`);

          preparedOptions.objFile = objFile;
          preparedOptions.textureFile = textureFile;
        }
      } else {
        console.warn(
          `Character type ${preparedOptions.characterType} not found in registry, falling back to manual assets`
        );
      }
    } else if (!preparedOptions.objFile || !preparedOptions.textureFile) {
      // No character type and no manual assets - use default
      logger.info('🎭 No character specified, using default character (Adri)');
      const defaultChar = characterRegistry.getCharacter(CharacterType.ADRI);
      if (defaultChar) {
        preparedOptions.characterType = CharacterType.ADRI;
        preparedOptions.objFile = defaultChar.assets.objFile;
        preparedOptions.textureFile = defaultChar.assets.textureFile;
      }
    }

    return preparedOptions;
  }

  /**
   * Static helper to get selected model
   */
  private static getSelectedModelStatic(
    assets: CharacterAssets,
    useAlternativeModel?: number
  ): string {
    if (useAlternativeModel !== undefined && assets.alternativeModels) {
      const altIndex = Math.min(useAlternativeModel, assets.alternativeModels.length - 1);
      return assets.alternativeModels[altIndex];
    }
    return assets.objFile;
  }

  /**
   * Static helper to get selected texture
   */
  private static getSelectedTextureStatic(
    assets: CharacterAssets,
    useAlternativeTexture?: number
  ): string {
    if (useAlternativeTexture !== undefined && assets.alternativeTextures) {
      const altIndex = Math.min(useAlternativeTexture, assets.alternativeTextures.length - 1);
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
    // Use _options from parent class since pilotOptions isn't set yet during super() call
    const options = (this.pilotOptions || this._options) as PilotVoxelOptions;

    if (!options) {
      throw new Error('PilotVoxel requires options');
    }
    if (!options.objFile) {
      throw new Error('PilotVoxel requires objFile option or characterType');
    }
    if (!options.textureFile) {
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

    // Dispose current object
    this.dispose();

    // Prepare new options with resolved assets
    const newOptions = PilotVoxel.prepareOptions({
      ...this.pilotOptions,
      characterType,
      ...options,
    });

    this.pilotOptions = newOptions;

    // Update character definition
    if (newOptions.characterType) {
      this.characterDefinition = characterRegistry.getCharacter(newOptions.characterType);
    }

    if (this.characterDefinition) {
      this.applyCharacterDefaults();
    }

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
