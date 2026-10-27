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
  PILOT_CLASSIC = 'pilot-classic',
  PILOT_MODERN = 'pilot-modern',
  WARRIOR = 'warrior',
  EXPLORER = 'explorer',
  SCIENTIST = 'scientist',
  ADVENTURER = 'adventurer',
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
        description: 'Black Charly helmet, black clothes with red stripes, black cocoon harness',
      },
      {
        id: CharacterType.FRANZ,
        name: 'Franz',
        description: 'Sky-blue helmet with clown and shark stickers, red jacket, open harness',
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
        description: 'Full-face helmet, plum jacket, open harness',
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

  /**
   * Get all available characters
   */
  public getAllCharacters(): CharacterDefinition[] {
    return Array.from(this.characters.values());
  }

  /**
   * Get characters by tag
   */
  public getCharactersByTag(tag: string): CharacterDefinition[] {
    return this.getAllCharacters().filter(char => char.tags.includes(tag));
  }

  /**
   * Check if character type exists
   */
  public hasCharacter(type: CharacterType): boolean {
    return this.characters.has(type);
  }

  /**
   * Get character types only
   */
  public getCharacterTypes(): CharacterType[] {
    return Array.from(this.characters.keys());
  }

  /**
   * Search characters by name or description
   */
  public searchCharacters(query: string): CharacterDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCharacters().filter(
      char =>
        char.name.toLowerCase().includes(lowerQuery) ||
        char.description.toLowerCase().includes(lowerQuery) ||
        char.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get random character
   */
  public getRandomCharacter(): CharacterDefinition {
    const characters = this.getAllCharacters();
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  /**
   * Validate character assets exist
   */
  public async validateCharacterAssets(type: CharacterType): Promise<{
    valid: boolean;
    missingAssets: string[];
  }> {
    const character = this.getCharacter(type);
    if (!character) {
      return { valid: false, missingAssets: ['Character definition not found'] };
    }

    const missingAssets: string[] = [];
    const { assets } = character;

    // Check main assets (in real implementation, you'd check if files exist)
    const assetsToCheck = [
      { path: assets.objFile, name: 'OBJ Model' },
      { path: assets.textureFile, name: 'Texture' },
    ];

    if (assets.thumbnailFile) {
      assetsToCheck.push({ path: assets.thumbnailFile, name: 'Thumbnail' });
    }

    // Note: In a real implementation, you'd use fetch or file system checks
    // For now, we assume assets exist
    logger.debug(`Validating assets for ${character.name}...`);

    return {
      valid: missingAssets.length === 0,
      missingAssets,
    };
  }

  /**
   * Export character registry for debugging
   */
  public exportRegistry(): any {
    return {
      totalCharacters: this.characters.size,
      characters: Object.fromEntries(this.characters),
      tags: this.getAllTags(),
      authors: this.getAllAuthors(),
    };
  }

  /**
   * Get all unique tags from all characters
   */
  public getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAllCharacters().forEach(char => {
      char.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get all unique authors
   */
  public getAllAuthors(): string[] {
    const authors = new Set<string>();
    this.getAllCharacters().forEach(char => {
      if (char.author) {
        authors.add(char.author);
      }
    });
    return Array.from(authors).sort();
  }
}

// Export singleton instance
export const characterRegistry = CharacterRegistry.getInstance();
