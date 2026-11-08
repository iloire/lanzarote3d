import * as THREE from 'three';
import { SimpleThreeComponent } from '../base/SimpleThreeComponent';
import { ComponentOptions } from '../base/IThreeComponent';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { CharacterType, characterRegistry } from './CharacterRegistry';

/**
 * Options for pilot voxel component
 */
export interface PilotVoxelOptions extends ComponentOptions {
  // Character selection - either specify character type or manual asset paths
  characterType?: CharacterType;
  objFile?: string;
  textureFile?: string;
  rigFile?: string;

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

/** The joints of a pilot exported in parts: each part's parent and where it hinges on it */
export interface PilotRig {
  parts: Record<string, { parent: string; joint: [number, number, number] }>;
}

/**
 * Hangs each part of `model` named in `rig` on a pivot at its joint, named after the part,
 * inside its parent's pivot, so rotating a pivot turns the part, and the parts it carries,
 * about its joint. The model looks the same until a pivot turns.
 */
function hingeParts(model: THREE.Object3D, rig: PilotRig): void {
  const pivots = new Map<string, THREE.Object3D>([['body', model]]);
  const jointOf = (name: string) => new THREE.Vector3(...(rig.parts[name]?.joint ?? [0, 0, 0]));
  const pivotFor = (name: string): THREE.Object3D => {
    const existing = pivots.get(name);
    if (existing) return existing;
    const part = rig.parts[name];
    if (!part) throw new Error(`Rig has no part ${name}`);
    const pivot = new THREE.Object3D();
    pivot.name = name;
    const parent = pivotFor(part.parent);
    pivot.position
      .copy(jointOf(name))
      .sub(parent === model ? new THREE.Vector3() : jointOf(part.parent));
    parent.add(pivot);
    pivots.set(name, pivot);
    return pivot;
  };
  [...model.children].forEach(mesh => {
    if (!rig.parts[mesh.name]) return;
    const pivot = pivotFor(mesh.name);
    mesh.name = `${mesh.name}-mesh`;
    mesh.position.copy(jointOf(pivot.name)).negate();
    pivot.add(mesh);
  });
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
  constructor(options: PilotVoxelOptions = {}) {
    // Get character or default to ADRI
    const charType = options.characterType || CharacterType.ADRI;
    const character = characterRegistry.getCharacter(charType);

    if (!character) {
      throw new Error(`Character type ${charType} not found in registry`);
    }

    // Get model and texture paths (with alternative support)
    const objFile =
      options.useAlternativeModel !== undefined && character.assets.alternativeModels
        ? character.assets.alternativeModels[options.useAlternativeModel]
        : character.assets.objFile;

    const textureFile =
      options.useAlternativeTexture !== undefined && character.assets.alternativeTextures
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
        // Only the character's own model is cut into parts
        rigFile: options.useAlternativeModel === undefined ? character.assets.rigFile : undefined,
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
    const [model, texture, rig] = await Promise.all([
      this.loadOBJ(opts.objFile!),
      this.loadTexture(opts.textureFile!),
      opts.rigFile ? this.loadRig(opts.rigFile) : undefined,
    ]);
    if (rig) hingeParts(model, rig);

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

  private async loadRig(url: string): Promise<PilotRig> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load rig from ${url}: ${response.status}`);
    return (await response.json()) as PilotRig;
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
}

export default PilotVoxel;
