import * as THREE from 'three';
import { logger } from '../../utils/logger';

/**
 * Character types available in the system
 */
export enum CharacterType {
  ADRI = 'adri',
  BERNT = 'bernt',
  DAVID = 'david',
  FABIO = 'fabio',
  FRANZ = 'franz',
  IVAN = 'ivan',
  JEHOSUA = 'jehosua',
  LUC = 'luc',
  MAGNE = 'magne',
  MIGUEL = 'miguel',
  ROOS = 'roos',
}

/**
 * Asset types for character loading
 */
export interface CharacterAssets {
  objFile: string;
  textureFile: string;
  thumbnailFile?: string;
  alternativeTextures?: string[];
  alternativeModels?: string[];
}

/**
 * Character metadata and configuration
 */
export interface CharacterDefinition {
  id: CharacterType;
  name: string;
  description: string;
  assets: CharacterAssets;
  defaultScale: number;
  defaultMaterialOptions?: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    side?: THREE.Side;
  };
  tags: string[];
  author?: string;
  version?: string;
}

/**
 * Character registry managing all available voxel characters
 */
export class CharacterRegistry {
  private static instance: CharacterRegistry;
  private characters = new Map<CharacterType, CharacterDefinition>();

  private constructor() {
    this.initializeDefaultCharacters();
  }

  public static getInstance(): CharacterRegistry {
    if (!CharacterRegistry.instance) {
      CharacterRegistry.instance = new CharacterRegistry();
    }
    return CharacterRegistry.instance;
  }

  /**
   * Initialize default character definitions
   */
  private initializeDefaultCharacters(): void {
    // Current Adri character
    this.registerCharacter({
      id: CharacterType.ADRI,
      name: 'Adri',
      description: 'Original voxel pilot character',
      assets: {
        objFile: '/assets/foundation/models/characters/adri/adri.obj',
        textureFile: '/assets/foundation/models/characters/adri/adri.png',
        thumbnailFile: '/assets/foundation/models/characters/adri/thumbnail.png',
        alternativeTextures: [
          '/assets/foundation/models/characters/adri/adri_winter.png',
          '/assets/foundation/models/characters/adri/adri_summer.png',
        ],
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
      },
      tags: ['pilot', 'original', 'voxel'],
      author: 'Lanzarote3D',
      version: '1.0.0',
    });

    // Ivan character
    this.registerCharacter({
      id: CharacterType.IVAN,
      name: 'Ivan',
      // Exported in Adri's frame (3d-characters tools/vox-to-obj.mjs --frame), so the two
      // swap without moving the pilot in the harness.
      description: 'Personal voxel character - Ivan variant',
      assets: {
        objFile: '/assets/foundation/models/characters/ivan/ivan.obj',
        textureFile: '/assets/foundation/models/characters/ivan/ivan.png',
        thumbnailFile: '/assets/foundation/models/characters/ivan/ivan.png',
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.7,
        metalness: 0.15,
        side: THREE.DoubleSide,
      },
      tags: ['pilot', 'personal', 'ivan', 'voxel'],
      author: 'Lanzarote3D',
      version: '1.0.0',
    });

    // Built from Ivan by 3d-characters tools/pilots and exported in Adri's frame like him.
    const pilots: { id: CharacterType; name: string; description: string }[] = [
      {
        id: CharacterType.BERNT,
        name: 'Bernt',
        description: 'Blue Charly helmet, black top, dark green open harness with a lime line',
      },
      {
        id: CharacterType.DAVID,
        name: 'David',
        description: 'Black OZONE helmet, blue mirrored sunglasses, black puffer, cocoon harness',
      },
      {
        id: CharacterType.FABIO,
        name: 'Fabio',
        description:
          'Black Charly helmet visor down, black clothes with red stripes, 360 camera, cocoon',
      },
      {
        id: CharacterType.FRANZ,
        name: 'Franz',
        description:
          'Sky-blue helmet with clown and shark stickers, red T-shirt, shorts, open harness',
      },
      {
        id: CharacterType.JEHOSUA,
        name: 'Jehosua',
        description: 'Piratas Aéreos pilot - skull helmet, open harness',
      },
      {
        id: CharacterType.LUC,
        name: 'Luc',
        description: 'White open helmet, orange jacket, grey open harness, shorts',
      },
      {
        id: CharacterType.MAGNE,
        name: 'Magne',
        description: 'Navy carbon Charly helmet, gold aviators, blue jacket, black cocoon harness',
      },
      {
        id: CharacterType.MIGUEL,
        name: 'Miguel',
        description: 'Venturi pilot - orange helmet, cocoon harness',
      },
      {
        id: CharacterType.ROOS,
        name: 'Roos',
        description:
          'Black carbon Charly helmet, white sunglasses, dark jacket, olive trousers, bulky open harness, red front container',
      },
    ];
    pilots.forEach(({ id, name, description }) => {
      this.registerCharacter({
        id,
        name,
        description,
        assets: {
          objFile: `/assets/foundation/models/characters/${id}/${id}.obj`,
          textureFile: `/assets/foundation/models/characters/${id}/${id}.png`,
        },
        defaultScale: 0.01,
        defaultMaterialOptions: {
          roughness: 0.7,
          metalness: 0.15,
          side: THREE.DoubleSide,
        },
        tags: ['pilot', 'personal', id, 'voxel'],
        author: 'Lanzarote3D',
        version: '1.0.0',
      });
    });

    logger.debug(`Character Registry initialized with ${this.characters.size} characters`);
  }

  /**
   * Register a new character type
   */
  public registerCharacter(character: CharacterDefinition): void {
    this.characters.set(character.id, character);
    logger.debug(`Registered character: ${character.name} (${character.id})`);
  }

  /**
   * Get character definition by type
   */
  public getCharacter(type: CharacterType): CharacterDefinition | undefined {
    return this.characters.get(type);
  }
}

// Export singleton instance
export const characterRegistry = CharacterRegistry.getInstance();
