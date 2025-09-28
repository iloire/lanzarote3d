import * as THREE from 'three';
import { PilotVoxelComponent } from '../characters/PilotVoxelComponent';
import { CharacterType } from '../characters/CharacterRegistry';
import { LoadProgress } from '../base/AsyncThreeComponent';

/**
 * Example demonstrating the two main characters: Adri vs Ivan
 *
 * This example shows:
 * 1. How to create both Adri and Ivan characters
 * 2. Side-by-side comparison of both character models
 * 3. Character switching demonstration
 * 4. Material and scaling differences
 */

/**
 * Create both Adri and Ivan characters for comparison
 */
export async function createAdriVsIvanShowcase(scene: THREE.Scene) {
  console.log('🎭 Creating Adri vs Ivan character showcase');

  const pilots: PilotVoxelComponent[] = [];

  // Create Adri character (original)
  console.log('📦 Creating Adri character...');
  const adri = new PilotVoxelComponent({
    characterType: CharacterType.ADRI,
    position: new THREE.Vector3(-150, 0, 0),
    scale: 0.012,
    materialOptions: {
      roughness: 0.8,
      metalness: 0.1
    }
  }, {
    onProgress: (progress: LoadProgress) => {
      console.log(`📈 Adri: ${(progress.progress * 100).toFixed(1)}% loaded`);
    },
    onResourceLoaded: (resource) => {
      console.log(`✅ Adri: Loaded ${resource.type}`);
    }
  });

  // Create Ivan character (new)
  console.log('📦 Creating Ivan character...');
  const ivan = new PilotVoxelComponent({
    characterType: CharacterType.IVAN,
    position: new THREE.Vector3(150, 0, 0),
    scale: 0.012,
    materialOptions: {
      roughness: 0.7,
      metalness: 0.15
    }
  }, {
    onProgress: (progress: LoadProgress) => {
      console.log(`📈 Ivan: ${(progress.progress * 100).toFixed(1)}% loaded`);
    },
    onResourceLoaded: (resource) => {
      console.log(`✅ Ivan: Loaded ${resource.type}`);
    }
  });

  // Load both characters
  const [adriObject, ivanObject] = await Promise.all([
    adri.load(),
    ivan.load()
  ]);

  // Add to scene
  scene.add(adriObject);
  scene.add(ivanObject);

  pilots.push(adri, ivan);

  // Create character labels
  createCharacterLabel('Adri\n(Original)', new THREE.Vector3(-150, -25, 0), scene);
  createCharacterLabel('Ivan\n(New)', new THREE.Vector3(150, -25, 0), scene);

  console.log('🎉 Adri vs Ivan showcase completed!');

  return { adri, ivan, pilots };
}

/**
 * Demonstrate character switching between Adri and Ivan
 */
export async function demonstrateCharacterSwitching(scene: THREE.Scene) {
  console.log('🔄 Demonstrating Adri ↔ Ivan character switching');

  // Start with Adri
  const switchingPilot = new PilotVoxelComponent({
    characterType: CharacterType.ADRI,
    position: new THREE.Vector3(0, 0, 300),
    scale: 0.015
  });

  let pilotObject = await switchingPilot.load();
  scene.add(pilotObject);

  // Create status label
  const statusLabel = createCharacterLabel('Current: Adri', new THREE.Vector3(0, -30, 300), scene);

  let isAdri = true;
  let switchCount = 0;

  const switchInterval = setInterval(async () => {
    switchCount++;
    const nextCharacter = isAdri ? CharacterType.IVAN : CharacterType.ADRI;
    const nextName = isAdri ? 'Ivan' : 'Adri';

    console.log(`🔄 Switch ${switchCount}: Changing to ${nextName}`);

    try {
      // Remove old object
      scene.remove(pilotObject);

      // Switch character
      pilotObject = await switchingPilot.switchCharacter(nextCharacter);
      scene.add(pilotObject);

      // Update label
      updateCharacterLabel(statusLabel, `Current: ${nextName}`);

      isAdri = !isAdri;
      console.log(`✅ Successfully switched to ${nextName}`);
    } catch (error) {
      console.error(`❌ Failed to switch to ${nextName}:`, error);
    }
  }, 4000); // Switch every 4 seconds

  // Stop after 10 switches
  setTimeout(() => {
    clearInterval(switchInterval);
    console.log('🛑 Character switching demonstration completed');
  }, 40000);

  return { pilot: switchingPilot, stopSwitching: () => clearInterval(switchInterval) };
}

/**
 * Compare character information
 */
export function compareCharacters() {
  console.log('📊 Comparing Adri vs Ivan characters');

  // Create both characters to compare
  const adri = new PilotVoxelComponent({ characterType: CharacterType.ADRI });
  const ivan = new PilotVoxelComponent({ characterType: CharacterType.IVAN });

  const adriInfo = adri.getCharacterInfo();
  const ivanInfo = ivan.getCharacterInfo();

  console.log('👨‍✈️ Character Comparison:');
  console.log('├── Adri:');
  console.log(`│   ├── Name: ${adriInfo.characterName}`);
  console.log(`│   ├── Type: ${adriInfo.characterType}`);
  console.log(`│   └── Alternatives: ${adriInfo.availableAlternatives.textures} textures, ${adriInfo.availableAlternatives.models} models`);
  console.log('└── Ivan:');
  console.log(`    ├── Name: ${ivanInfo.characterName}`);
  console.log(`    ├── Type: ${ivanInfo.characterType}`);
  console.log(`    └── Alternatives: ${ivanInfo.availableAlternatives.textures} textures, ${ivanInfo.availableAlternatives.models} models`);

  // Clean up
  adri.dispose();
  ivan.dispose();

  return { adriInfo, ivanInfo };
}

/**
 * Create character formation with both types
 */
export async function createMixedCharacterFormation(scene: THREE.Scene, count: number = 10) {
  console.log(`🎲 Creating mixed formation with ${count} characters (Adri + Ivan)`);

  const pilots: PilotVoxelComponent[] = [];
  const loadingPromises: Promise<void>[] = [];

  // Create characters in a line formation, alternating between Adri and Ivan
  for (let i = 0; i < count; i++) {
    const characterType = i % 2 === 0 ? CharacterType.ADRI : CharacterType.IVAN;
    const characterName = characterType === CharacterType.ADRI ? 'Adri' : 'Ivan';

    const position = new THREE.Vector3(
      (i - count / 2) * 80,
      0,
      400
    );

    const pilot = new PilotVoxelComponent({
      characterType,
      position: position,
      scale: 0.01,
      rotation: new THREE.Euler(0, Math.PI, 0) // Face forward
    });

    const loadPromise = pilot.load().then((pilotObject) => {
      scene.add(pilotObject);
      console.log(`✅ Formation member ${i + 1}: ${characterName} added`);
    });

    pilots.push(pilot);
    loadingPromises.push(loadPromise);
  }

  await Promise.all(loadingPromises);
  console.log(`🎊 Mixed character formation completed with ${count} pilots!`);

  return pilots;
}

/**
 * Helper function to create character labels
 */
function createCharacterLabel(text: string, position: THREE.Vector3, scene: THREE.Scene): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 24px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';

    const lines = text.split('\n');
    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, 40 + (index * 30));
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });

  const geometry = new THREE.PlaneGeometry(20, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  scene.add(mesh);

  return mesh;
}

/**
 * Helper function to update character labels
 */
function updateCharacterLabel(labelMesh: THREE.Mesh, newText: string): void {
  const material = labelMesh.material as THREE.MeshBasicMaterial;
  const texture = material.map as THREE.CanvasTexture;
  const canvas = texture.image;
  const context = canvas.getContext('2d');

  if (context) {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw new text
    context.font = 'bold 24px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(newText, canvas.width / 2, canvas.height / 2 + 8);

    // Update texture
    texture.needsUpdate = true;
  }
}

/**
 * Complete Adri vs Ivan example workflow
 */
export async function runAdriVsIvanExample(scene: THREE.Scene) {
  try {
    console.log('🎭 Starting Adri vs Ivan Character Example');

    // 1. Compare character information
    const comparison = compareCharacters();

    // 2. Create side-by-side showcase
    const showcase = await createAdriVsIvanShowcase(scene);

    // 3. Demonstrate character switching
    const switchingDemo = await demonstrateCharacterSwitching(scene);

    // 4. Create mixed formation
    const formation = await createMixedCharacterFormation(scene, 8);

    console.log('🎊 Adri vs Ivan example completed successfully!');

    return {
      showcase,
      switchingDemo,
      formation,
      comparison,
      totalCharacters: showcase.pilots.length + formation.length + 1
    };
  } catch (error) {
    console.error('❌ Adri vs Ivan example failed:', error);
    return null;
  }
}

/**
 * Usage class for easy integration
 */
export class AdriVsIvanDemo {
  private scene: THREE.Scene;
  private pilots: PilotVoxelComponent[] = [];
  private switchingDemo?: any;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    const result = await runAdriVsIvanExample(this.scene);
    if (result) {
      this.pilots = [
        ...result.showcase.pilots,
        ...result.formation
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
    this.pilots.forEach(pilot => pilot.dispose());
  }

  // Get character statistics
  getStats() {
    const adriCount = this.pilots.filter(p => p.getCharacterInfo().characterType === CharacterType.ADRI).length;
    const ivanCount = this.pilots.filter(p => p.getCharacterInfo().characterType === CharacterType.IVAN).length;

    return {
      totalPilots: this.pilots.length,
      adriCount,
      ivanCount,
      ratio: `${adriCount}:${ivanCount}`
    };
  }
}