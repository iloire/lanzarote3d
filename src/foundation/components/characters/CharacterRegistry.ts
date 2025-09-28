import * as THREE from 'three';

/**
 * Character types available in the system
 */
export enum CharacterType {
  ADRI = 'adri',
  IVAN = 'ivan',
  PILOT_CLASSIC = 'pilot-classic',
  PILOT_MODERN = 'pilot-modern',
  WARRIOR = 'warrior',
  EXPLORER = 'explorer',
  SCIENTIST = 'scientist',
  ADVENTURER = 'adventurer'
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
          '/assets/foundation/models/characters/adri/adri_summer.png'
        ]
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      },
      tags: ['pilot', 'original', 'voxel'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    // Ivan character
    this.registerCharacter({
      id: CharacterType.IVAN,
      name: 'Ivan',
      description: 'Personal voxel character - Ivan variant',
      assets: {
        objFile: '/assets/foundation/models/characters/ivan/ivan.obj',
        textureFile: '/assets/foundation/models/characters/ivan/ivan.png',
        thumbnailFile: '/assets/foundation/models/characters/ivan/ivan.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.7,
        metalness: 0.15,
        side: THREE.DoubleSide
      },
      tags: ['pilot', 'personal', 'ivan', 'voxel'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    // Additional character types with placeholder assets
    this.registerCharacter({
      id: CharacterType.PILOT_CLASSIC,
      name: 'Classic Pilot',
      description: 'Traditional aviator with vintage gear',
      assets: {
        objFile: '/assets/foundation/models/characters/pilot-classic/model.obj',
        textureFile: '/assets/foundation/models/characters/pilot-classic/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/pilot-classic/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.7,
        metalness: 0.2
      },
      tags: ['pilot', 'classic', 'aviator'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    this.registerCharacter({
      id: CharacterType.PILOT_MODERN,
      name: 'Modern Pilot',
      description: 'Contemporary pilot with advanced equipment',
      assets: {
        objFile: '/assets/foundation/models/characters/pilot-modern/model.obj',
        textureFile: '/assets/foundation/models/characters/pilot-modern/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/pilot-modern/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.5,
        metalness: 0.4
      },
      tags: ['pilot', 'modern', 'technology'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    this.registerCharacter({
      id: CharacterType.WARRIOR,
      name: 'Sky Warrior',
      description: 'Battle-hardened aerial combatant',
      assets: {
        objFile: '/assets/foundation/models/characters/warrior/model.obj',
        textureFile: '/assets/foundation/models/characters/warrior/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/warrior/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.9,
        metalness: 0.7
      },
      tags: ['warrior', 'combat', 'armor'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    this.registerCharacter({
      id: CharacterType.EXPLORER,
      name: 'Sky Explorer',
      description: 'Adventurous explorer of aerial territories',
      assets: {
        objFile: '/assets/foundation/models/characters/explorer/model.obj',
        textureFile: '/assets/foundation/models/characters/explorer/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/explorer/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.6,
        metalness: 0.3
      },
      tags: ['explorer', 'adventure', 'gear'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    this.registerCharacter({
      id: CharacterType.SCIENTIST,
      name: 'Aerial Scientist',
      description: 'Research specialist for atmospheric studies',
      assets: {
        objFile: '/assets/foundation/models/characters/scientist/model.obj',
        textureFile: '/assets/foundation/models/characters/scientist/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/scientist/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.4,
        metalness: 0.5
      },
      tags: ['scientist', 'research', 'instruments'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    this.registerCharacter({
      id: CharacterType.ADVENTURER,
      name: 'Free Spirit',
      description: 'Carefree adventurer exploring the skies',
      assets: {
        objFile: '/assets/foundation/models/characters/adventurer/model.obj',
        textureFile: '/assets/foundation/models/characters/adventurer/texture.png',
        thumbnailFile: '/assets/foundation/models/characters/adventurer/thumbnail.png'
      },
      defaultScale: 0.01,
      defaultMaterialOptions: {
        roughness: 0.7,
        metalness: 0.1
      },
      tags: ['adventurer', 'freedom', 'spirit'],
      author: 'Lanzarote3D',
      version: '1.0.0'
    });

    console.log(`📚 Character Registry initialized with ${this.characters.size} characters`);
  }

  /**
   * Register a new character type
   */
  public registerCharacter(character: CharacterDefinition): void {
    this.characters.set(character.id, character);
    console.log(`✅ Registered character: ${character.name} (${character.id})`);
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
    return this.getAllCharacters().filter(char =>
      char.tags.includes(tag)
    );
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
    return this.getAllCharacters().filter(char =>
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
      { path: assets.textureFile, name: 'Texture' }
    ];

    if (assets.thumbnailFile) {
      assetsToCheck.push({ path: assets.thumbnailFile, name: 'Thumbnail' });
    }

    // Note: In a real implementation, you'd use fetch or file system checks
    // For now, we assume assets exist
    console.log(`🔍 Validating assets for ${character.name}...`);

    return {
      valid: missingAssets.length === 0,
      missingAssets
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
      authors: this.getAllAuthors()
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

// Export utility functions
export function getCharacterAssetPath(type: CharacterType, assetType: 'obj' | 'texture' | 'thumbnail'): string {
  const character = characterRegistry.getCharacter(type);
  if (!character) {
    throw new Error(`Character type ${type} not found in registry`);
  }

  switch (assetType) {
    case 'obj':
      return character.assets.objFile;
    case 'texture':
      return character.assets.textureFile;
    case 'thumbnail':
      return character.assets.thumbnailFile || character.assets.textureFile;
    default:
      throw new Error(`Unknown asset type: ${assetType}`);
  }
}

export function createCharacterFolder(type: CharacterType): string {
  return `/assets/foundation/models/characters/${type}`;
}