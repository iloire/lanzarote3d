import * as THREE from 'three';
import {
  PilotVoxelComponent,
  PilotVoxelOptions
} from '../characters/PilotVoxelComponent';
import { CharacterType, characterRegistry } from '../characters/CharacterRegistry';
import { componentFactory } from '../factory/ComponentFactory';
import { LoadProgress } from '../base/AsyncThreeComponent';

/**
 * Advanced example demonstrating multi-character PilotVoxel system
 *
 * This file shows:
 * 1. How to create different character types using the registry
 * 2. Character switching and alternative texture/model selection
 * 3. Character showcase and comparison
 * 4. Dynamic character creation and management
 * 5. Character asset validation and organization
 */

/**
 * Register the enhanced PilotVoxel component with character support
 */
export function registerMultiCharacterPilotVoxel() {
  console.log('🎭 Registering Multi-Character PilotVoxel component');

  componentFactory.register('pilotVoxelMulti', {
    constructor: PilotVoxelComponent,
    metadata: {
      name: 'Multi-Character PilotVoxel',
      version: '3.0.0',
      description: 'Advanced voxel pilot component with multi-character support',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'voxel', 'multi-character', 'registry']
    },
    defaultOptions: {
      characterType: CharacterType.ADRI,
      scale: 0.01
    },
    category: 'characters'
  });

  console.log('✅ Multi-Character PilotVoxel component registered');
}

/**
 * Example: Creating pilots with different character types
 */
export async function createCharacterShowcase(scene: THREE.Scene) {
  console.log('🎭 Creating character showcase with multiple character types');

  const availableCharacters = characterRegistry.getAllCharacters();
  const pilots: PilotVoxelComponent[] = [];
  const loadingPromises: Promise<void>[] = [];

  // Create a grid layout for character showcase
  const gridSize = Math.ceil(Math.sqrt(availableCharacters.length));
  const spacing = 250;

  for (let i = 0; i < availableCharacters.length; i++) {
    const character = availableCharacters[i];
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    const position = new THREE.Vector3(
      (col - gridSize / 2) * spacing,
      0,
      (row - gridSize / 2) * spacing
    );

    try {
      console.log(`📦 Creating character: ${character.name} (${character.id})`);

      const pilot = new PilotVoxelComponent({
        characterType: character.id,
        position: position,
        scale: 0.015 // Slightly larger for showcase
      }, {
        onProgress: (progress: LoadProgress) => {
          console.log(`📈 ${character.name}: ${(progress.progress * 100).toFixed(1)}% loaded`);
        },
        onResourceLoaded: (resource) => {
          console.log(`✅ ${character.name}: Loaded ${resource.type}`);
        }
      });

      const loadPromise = pilot.load().then((pilotObject) => {
        scene.add(pilotObject);
        console.log(`🎉 ${character.name} added to showcase`);

        // Add character name label
        createCharacterLabel(character.name, position, scene);
      });

      pilots.push(pilot);
      loadingPromises.push(loadPromise);

    } catch (error) {
      console.error(`❌ Failed to create ${character.name}:`, error);
    }
  }

  // Wait for all characters to load
  console.log('⏳ Waiting for all characters to load...');
  await Promise.all(loadingPromises);
  console.log(`🎊 Character showcase completed with ${pilots.length} characters!`);

  return pilots;
}

/**
 * Example: Character switching demonstration
 */
export async function demonstrateCharacterSwitching(scene: THREE.Scene) {
  console.log('🔄 Demonstrating character switching capabilities');

  // Create a pilot that will switch between characters
  const switchingPilot = new PilotVoxelComponent({
    characterType: CharacterType.ADRI,
    position: new THREE.Vector3(0, 0, 500),
    scale: 0.02
  });

  let pilotObject = await switchingPilot.load();
  scene.add(pilotObject);

  // Get all character types for switching
  const characterTypes = characterRegistry.getCharacterTypes();
  let currentCharacterIndex = 0;

  const switchInterval = setInterval(async () => {
    currentCharacterIndex = (currentCharacterIndex + 1) % characterTypes.length;
    const nextCharacter = characterTypes[currentCharacterIndex];

    console.log(`🔄 Switching to: ${nextCharacter}`);

    try {
      // Remove old object
      scene.remove(pilotObject);

      // Switch character
      pilotObject = await switchingPilot.switchCharacter(nextCharacter);
      scene.add(pilotObject);

      console.log(`✅ Successfully switched to ${nextCharacter}`);
    } catch (error) {
      console.error(`❌ Failed to switch to ${nextCharacter}:`, error);
    }
  }, 3000); // Switch every 3 seconds

  // Stop switching after 30 seconds
  setTimeout(() => {
    clearInterval(switchInterval);
    console.log('🛑 Character switching demonstration completed');
  }, 30000);

  return { pilot: switchingPilot, stopSwitching: () => clearInterval(switchInterval) };
}

/**
 * Example: Alternative texture demonstration
 */
export async function demonstrateAlternativeTextures(scene: THREE.Scene) {
  console.log('🎨 Demonstrating alternative texture switching');

  // Find characters with alternative textures
  const charactersWithAlts = characterRegistry.getAllCharacters().filter(
    char => char.assets.alternativeTextures && char.assets.alternativeTextures.length > 0
  );

  if (charactersWithAlts.length === 0) {
    console.log('ℹ️ No characters with alternative textures found');
    return [];
  }

  const pilots: PilotVoxelComponent[] = [];

  for (let i = 0; i < charactersWithAlts.length; i++) {
    const character = charactersWithAlts[i];
    const altTextures = character.assets.alternativeTextures!;

    console.log(`🎨 Creating texture variants for ${character.name}`);

    // Create main character + all texture variants
    for (let textureIndex = -1; textureIndex < altTextures.length; textureIndex++) {
      const pilot = new PilotVoxelComponent({
        characterType: character.id,
        useAlternativeTexture: textureIndex >= 0 ? textureIndex : undefined,
        position: new THREE.Vector3(
          i * 300,
          0,
          (textureIndex + 1) * 150 + 800
        ),
        scale: 0.01
      });

      const pilotObject = await pilot.load();
      scene.add(pilotObject);
      pilots.push(pilot);

      const textureName = textureIndex >= 0 ? `Alt ${textureIndex + 1}` : 'Default';
      console.log(`✅ Created ${character.name} with ${textureName} texture`);
    }
  }

  return pilots;
}

/**
 * Example: Random character generation
 */
export async function createRandomCharacterArmy(scene: THREE.Scene, count: number = 20) {
  console.log(`🎲 Creating army of ${count} random characters`);

  const pilots: PilotVoxelComponent[] = [];
  const loadingPromises: Promise<void>[] = [];

  // Create characters in a circular formation
  const radius = 600;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );

    // Create random character
    const pilot = PilotVoxelComponent.createRandomCharacter({
      position: position,
      scale: 0.008 + Math.random() * 0.004, // Random scale variation
      rotation: new THREE.Euler(0, angle + Math.PI, 0) // Face outward
    });

    const loadPromise = pilot.load().then((pilotObject) => {
      scene.add(pilotObject);

      const info = pilot.getCharacterInfo();
      console.log(`🎲 Random character ${i + 1}: ${info.characterName}`);
    });

    pilots.push(pilot);
    loadingPromises.push(loadPromise);
  }

  await Promise.all(loadingPromises);
  console.log(`🎊 Random character army completed with ${count} characters!`);

  return pilots;
}

/**
 * Example: Character asset validation
 */
export async function validateAllCharacterAssets() {
  console.log('🔍 Validating all character assets');

  const allCharacters = characterRegistry.getAllCharacters();
  const validationResults: { [key: string]: any } = {};

  for (const character of allCharacters) {
    console.log(`🔍 Validating ${character.name}...`);

    const validation = await characterRegistry.validateCharacterAssets(character.id);
    validationResults[character.id] = {
      name: character.name,
      valid: validation.valid,
      missingAssets: validation.missingAssets
    };

    if (validation.valid) {
      console.log(`✅ ${character.name}: All assets valid`);
    } else {
      console.warn(`⚠️ ${character.name}: Missing assets:`, validation.missingAssets);
    }
  }

  console.log('📊 Asset validation summary:', validationResults);
  return validationResults;
}

/**
 * Example: Character registry exploration
 */
export function exploreCharacterRegistry() {
  console.log('📚 Exploring character registry');

  // Get registry statistics
  const registryData = characterRegistry.exportRegistry();
  console.log('📊 Registry Stats:', registryData);

  // Explore by tags
  const allTags = characterRegistry.getAllTags();
  console.log('🏷️ Available tags:', allTags);

  allTags.forEach(tag => {
    const charactersWithTag = characterRegistry.getCharactersByTag(tag);
    console.log(`🏷️ Tag "${tag}": ${charactersWithTag.map(c => c.name).join(', ')}`);
  });

  // Search functionality
  const searchTerms = ['pilot', 'warrior', 'explorer'];
  searchTerms.forEach(term => {
    const results = characterRegistry.searchCharacters(term);
    console.log(`🔍 Search "${term}": ${results.map(c => c.name).join(', ')}`);
  });

  return registryData;
}

/**
 * Create character label for showcase
 */
function createCharacterLabel(text: string, position: THREE.Vector3, scene: THREE.Scene): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 24px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });

  const geometry = new THREE.PlaneGeometry(15, 4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = -20;
  scene.add(mesh);

  return mesh;
}

/**
 * Complete multi-character example workflow
 */
export async function runMultiCharacterExample(scene: THREE.Scene) {
  try {
    console.log('🎭 Starting Multi-Character PilotVoxel Example');

    // 1. Register enhanced component
    registerMultiCharacterPilotVoxel();

    // 2. Explore character registry
    const registryData = exploreCharacterRegistry();

    // 3. Validate all character assets
    const validationResults = await validateAllCharacterAssets();

    // 4. Create character showcase
    const showcasePilots = await createCharacterShowcase(scene);

    // 5. Demonstrate character switching
    const switchingDemo = await demonstrateCharacterSwitching(scene);

    // 6. Show alternative textures
    const texturePilots = await demonstrateAlternativeTextures(scene);

    // 7. Create random character army
    const armyPilots = await createRandomCharacterArmy(scene, 15);

    console.log('🎊 Multi-Character PilotVoxel example completed successfully!');

    return {
      showcasePilots,
      switchingDemo,
      texturePilots,
      armyPilots,
      registryData,
      validationResults,
      totalCharacters: showcasePilots.length + texturePilots.length + armyPilots.length + 1
    };
  } catch (error) {
    console.error('❌ Multi-Character PilotVoxel example failed:', error);
    return null;
  }
}

/**
 * Cleanup function for all pilots
 */
export function cleanupMultiCharacterExample(pilots: PilotVoxelComponent[]) {
  console.log(`🧹 Cleaning up ${pilots.length} pilot characters`);

  pilots.forEach((pilot, index) => {
    console.log(`Disposing pilot ${index + 1}: ${pilot.getCharacterInfo().characterName}`);
    pilot.dispose();
  });
}

/**
 * Usage class for easy integration
 */
export class MultiCharacterPilotVoxelDemo {
  private scene: THREE.Scene;
  private pilots: PilotVoxelComponent[] = [];
  private switchingDemo?: any;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    const result = await runMultiCharacterExample(this.scene);
    if (result) {
      this.pilots = [
        ...result.showcasePilots,
        ...result.texturePilots,
        ...result.armyPilots
      ];
      this.switchingDemo = result.switchingDemo;
    }
  }

  update(deltaTime: number) {
    this.pilots.forEach(pilot => {
      pilot.update(deltaTime);
    });
  }

  dispose() {
    if (this.switchingDemo?.stopSwitching) {
      this.switchingDemo.stopSwitching();
    }
    cleanupMultiCharacterExample(this.pilots);
  }

  // Interactive methods
  async switchRandomCharacter() {
    if (this.pilots.length === 0) return;

    const randomPilot = this.pilots[Math.floor(Math.random() * this.pilots.length)];
    const randomCharacter = characterRegistry.getRandomCharacter();

    console.log(`🎲 Switching random pilot to ${randomCharacter.name}`);
    await randomPilot.switchCharacter(randomCharacter.id);
  }

  getCharacterStats() {
    return {
      totalPilots: this.pilots.length,
      characterTypes: [...new Set(this.pilots.map(p => p.getCharacterInfo().characterType))],
      registryStats: characterRegistry.exportRegistry()
    };
  }
}