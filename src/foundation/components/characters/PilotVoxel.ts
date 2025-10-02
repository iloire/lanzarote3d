import * as THREE from 'three';
import { SimpleThreeComponent } from '../base/SimpleThreeComponent';
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
 * Simplified PilotVoxel component for loading OBJ models with textures
 *
 * Features:
 * - Async loading of OBJ models and textures
 * - Multi-character support via CharacterRegistry
 * - Configurable material and texture properties
 */
export class PilotVoxel extends SimpleThreeComponent {
  private characterType: CharacterType;

  constructor(options: PilotVoxelOptions = {}) {
    // Get character or default to ADRI
    const charType = options.characterType || CharacterType.ADRI;
    const character = characterRegistry.getCharacter(charType);

    if (!character) {
      throw new Error(`Character type ${charType} not found in registry`);
    }

    // Get model and texture paths (with alternative support)
    const objFile = options.useAlternativeModel !== undefined && character.assets.alternativeModels
      ? character.assets.alternativeModels[options.useAlternativeModel]
      : character.assets.objFile;

    const textureFile = options.useAlternativeTexture !== undefined && character.assets.alternativeTextures
      ? character.assets.alternativeTextures[options.useAlternativeTexture]
      : character.assets.textureFile;

    super(
      {
        name: 'PilotVoxel',
        version: '2.0.0',
      },
      {
        // Character defaults
        scale: character.defaultScale,
        castShadow: true,
        receiveShadow: true,
        // User overrides
        ...options,
        // Store paths
        objFile,
        textureFile,
        materialOptions: {
          roughness: 0.8,
          metalness: 0.1,
          transparent: false,
          side: THREE.DoubleSide,
          ...character.defaultMaterialOptions,
          ...options.materialOptions,
        },
        textureOptions: {
          colorSpace: THREE.SRGBColorSpace,
          magFilter: THREE.NearestFilter,
          minFilter: THREE.NearestFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          ...options.textureOptions,
        },
      }
    );

    this.characterType = charType;
  }

  // Required by SimpleThreeComponent but not used for loaded models
  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BufferGeometry(); // placeholder
  }

  /**
   * Override createObject to load OBJ model and texture
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const opts = this._options as PilotVoxelOptions;

    // Load model and texture in parallel
    const [model, texture] = await Promise.all([
      this.loadOBJ(opts.objFile!),
      this.loadTexture(opts.textureFile!),
    ]);

    // Configure texture
    const texOpts = opts.textureOptions!;
    texture.colorSpace = texOpts.colorSpace!;
    texture.magFilter = texOpts.magFilter! as THREE.MagnificationTextureFilter;
    texture.minFilter = texOpts.minFilter!;
    texture.wrapS = texOpts.wrapS!;
    texture.wrapT = texOpts.wrapT!;
    texture.needsUpdate = true;

    // Create material
    const matOpts = opts.materialOptions!;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: matOpts.roughness,
      metalness: matOpts.metalness,
      transparent: matOpts.transparent,
      side: matOpts.side,
    });

    // Apply material to all meshes
    model.traverse(child => {
      if (child instanceof THREE.Mesh) {
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

    // Apply transforms and shadows (inherited from SimpleThreeComponent)
    this.applyTransforms(model);
    this.applyShadows(model);

    return model;
  }

  /**
   * Load OBJ model
   */
  private async loadOBJ(url: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      loader.load(
        url,
        object => {
          object.name = 'PilotVoxel';
          resolve(object);
        },
        undefined,
        error => {
          reject(new Error(`Failed to load OBJ model from ${url}: ${error}`));
        }
      );
    });
  }

  /**
   * Load texture
   */
  private async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        texture => resolve(texture),
        undefined,
        error => {
          reject(new Error(`Failed to load texture from ${url}: ${error}`));
        }
      );
    });
  }



  /**
   * Get current character type
   */
  public getCharacterType(): CharacterType {
    return this.characterType;
  }

  /**
   * Get character information
   */
  public getCharacterInfo(): CharacterDefinition | undefined {
    return characterRegistry.getCharacter(this.characterType);
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

}

export default PilotVoxel;
