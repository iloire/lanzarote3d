import * as THREE from 'three';
import {
  PilotHeadComponent,
  PilotHeadOptions,
  PilotHeadType,
  HelmetType,
  GlassesType
} from '../characters/PilotHeadComponent';
import { componentFactory } from '../factory/ComponentFactory';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Example demonstrating the new PilotHead component architecture
 *
 * This file shows:
 * 1. How to register the PilotHead component
 * 2. How to create different pilot head configurations
 * 3. How to use the component factory for head creation
 * 4. Resource management and performance benefits
 */

/**
 * Register the PilotHead component with the factory
 */
export function registerPilotHeadComponent() {
  console.log('🎭 Registering PilotHead component');

  componentFactory.register('pilotHead', {
    constructor: PilotHeadComponent,
    metadata: {
      name: 'PilotHead',
      version: '2.0.0',
      description: 'Configurable pilot head with helmet and glasses options',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'head', 'customizable']
    },
    defaultOptions: {
      headType: PilotHeadType.Default,
      helmetType: HelmetType.Default,
      glassesType: GlassesType.Default,
      skinColor: 0xe0bea5,
      helmetColor: 0xffff00
    },
    category: 'characters'
  });

  console.log('✅ PilotHead component registered');
}

/**
 * Example: Creating different pilot head types
 */
export async function createPilotHeadsExample(scene: THREE.Scene) {
  console.log('👨‍✈️ Creating different pilot heads using component factory');

  const headConfigs: { position: THREE.Vector3; options: PilotHeadOptions }[] = [
    {
      position: new THREE.Vector3(-300, 0, 0),
      options: {
        headType: PilotHeadType.Default,
        helmetType: HelmetType.Default,
        glassesType: GlassesType.Default,
        skinColor: 0xe0bea5,
        helmetColor: 0x00ff00
      }
    },
    {
      position: new THREE.Vector3(0, 0, 0),
      options: {
        headType: PilotHeadType.Warrior,
        helmetType: HelmetType.WithHorns,
        glassesType: GlassesType.Sunglasses,
        skinColor: 0xd4a574,
        helmetColor: 0xff0000,
        beardColor: 0x8b4513
      }
    },
    {
      position: new THREE.Vector3(300, 0, 0),
      options: {
        headType: PilotHeadType.Skeleton,
        helmetType: HelmetType.FullFace,
        glassesType: GlassesType.None,
        skinColor: 0xf5f5dc,
        helmetColor: 0x333333
      }
    },
    {
      position: new THREE.Vector3(600, 0, 0),
      options: {
        headType: PilotHeadType.Devil,
        helmetType: HelmetType.Winged,
        glassesType: GlassesType.Default,
        skinColor: 0x8b0000,
        helmetColor: 0x800080,
        glassesColor: 0xff0000
      }
    }
  ];

  const heads: PilotHeadComponent[] = [];

  for (const config of headConfigs) {
    try {
      // Create head using factory
      const result = await componentFactory.create<PilotHeadComponent>('pilotHead', {
        ...config.options,
        position: config.position,
        scale: 0.01 // Scale down to reasonable size
      });

      const head = result.component;

      // Load the head (creates Three.js objects)
      const headObject = await head.load();

      // Add to scene
      scene.add(headObject);

      // Store reference for cleanup
      heads.push(head);

      console.log(`✅ Created ${config.options.headType} head with ${config.options.helmetType} helmet`);
    } catch (error) {
      console.error('❌ Failed to create pilot head:', error);
    }
  }

  return heads;
}

/**
 * Example: Resource sharing demonstration
 */
export function demonstratePilotHeadResourceSharing() {
  console.log('📊 PilotHead Resource Sharing Statistics:');

  const stats = resourceManager.getStats();
  console.log(`  Total shared resources: ${stats.totalItems}`);
  console.log(`  Memory usage: ${(stats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);

  // Show resource breakdown
  console.log('Shared resources breakdown:');
  console.log(`  Geometries: ${stats.geometries} (${(stats.memoryUsage.geometries / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  Materials: ${stats.materials} (${(stats.memoryUsage.materials / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  Textures: ${stats.textures} (${(stats.memoryUsage.textures / 1024 / 1024).toFixed(2)} MB)`);

  console.log('💡 Benefits of resource sharing:');
  console.log('  - Multiple heads can share the same geometries (eyes, mouth, etc.)');
  console.log('  - Materials are reused based on color configurations');
  console.log('  - Memory usage scales sub-linearly with number of heads');
  console.log('  - Faster instantiation after first head is created');
}

/**
 * Example: Component customization and validation
 */
export async function demonstratePilotHeadCustomization() {
  console.log('🎨 PilotHead Customization Examples');

  // Create a highly customized head
  const customHead = new PilotHeadComponent({
    headType: PilotHeadType.Warrior,
    helmetType: HelmetType.Crown,
    glassesType: GlassesType.Sunglasses,
    skinColor: 0xf4a460,  // Sandy brown
    beardColor: 0x654321,  // Dark brown
    eyeColor: 0x00ff00,   // Green eyes
    glassesColor: 0x000000, // Black glasses
    helmetColor: 0xffd700,  // Gold crown
    helmetColor2: 0xff0000, // Red accents
    scale: 0.015,
    position: new THREE.Vector3(0, 100, 0)
  });

  // Validate configuration
  const issues = customHead.validate();
  if (issues.length > 0) {
    console.warn('⚠️ Validation issues:', issues);
  } else {
    console.log('✅ Custom head configuration is valid');
  }

  // Show component metadata
  console.log('Component metadata:', customHead.metadata);

  // Load and get performance metrics
  const headObject = await customHead.load();
  console.log('Performance metrics:', customHead.metrics);

  // Serialize configuration for saving/loading
  const serialized = customHead.serialize();
  console.log('Serialized configuration:', JSON.stringify(serialized, null, 2));

  return { component: customHead, object: headObject };
}

/**
 * Example: Animation and interaction
 */
export function demonstratePilotHeadAnimation(heads: PilotHeadComponent[]) {
  console.log('🎬 PilotHead Animation Example');

  let time = 0;

  const animateHeads = () => {
    time += 0.016; // Assume 60 FPS

    heads.forEach((head, index) => {
      // Update component
      head.update(16); // 16ms delta time

      // Get the Three.js object for animation
      const headObject = head.getObject();
      if (headObject) {
        // Rotate heads
        headObject.rotation.y = Math.sin(time + index) * 0.5;

        // Bob up and down
        headObject.position.y = Math.sin(time * 2 + index) * 20;
      }
    });

    requestAnimationFrame(animateHeads);
  };

  animateHeads();
}

/**
 * Example: Proper cleanup
 */
export function cleanupPilotHeadsExample(heads: PilotHeadComponent[]) {
  console.log('🧹 Cleaning up pilot heads');

  heads.forEach((head, index) => {
    console.log(`Disposing head ${index}`);
    head.dispose();
  });

  // Show resource statistics after cleanup
  console.log('Resource stats after cleanup:');
  demonstratePilotHeadResourceSharing();
}

/**
 * Complete pilot head example workflow
 */
export async function runPilotHeadExample(scene: THREE.Scene) {
  try {
    // 1. Register component
    registerPilotHeadComponent();

    // 2. Create multiple heads
    const heads = await createPilotHeadsExample(scene);

    // 3. Demonstrate customization
    const customResult = await demonstratePilotHeadCustomization();
    scene.add(customResult.object);
    heads.push(customResult.component);

    // 4. Show resource sharing benefits
    demonstratePilotHeadResourceSharing();

    // 5. Start animation
    demonstratePilotHeadAnimation(heads);

    // 6. Cleanup after delay (for demo purposes)
    setTimeout(() => {
      cleanupPilotHeadsExample(heads);
    }, 10000);

    return heads;
  } catch (error) {
    console.error('❌ PilotHead example failed:', error);
    return [];
  }
}

/**
 * Comparison with old architecture
 */
export function showArchitectureComparison() {
  console.log('📈 Architecture Comparison: Old vs New');

  console.log('\nOld Architecture:');
  console.log('  ❌ Manual resource management');
  console.log('  ❌ No component lifecycle');
  console.log('  ❌ Hard to customize');
  console.log('  ❌ No performance tracking');
  console.log('  ❌ Inconsistent patterns');
  console.log('  ❌ Memory leaks possible');

  console.log('\nNew Architecture:');
  console.log('  ✅ Automatic resource sharing');
  console.log('  ✅ Complete lifecycle management');
  console.log('  ✅ Easy customization through options');
  console.log('  ✅ Built-in performance metrics');
  console.log('  ✅ Consistent component interface');
  console.log('  ✅ Automatic cleanup prevention');
  console.log('  ✅ Factory pattern with registration');
  console.log('  ✅ Validation and error handling');
  console.log('  ✅ Serialization support');

  console.log('\nMemory Usage Comparison:');
  console.log('  Old: O(n) memory per head instance');
  console.log('  New: O(1) + shared resources (much more efficient)');

  console.log('\nDevelopment Benefits:');
  console.log('  - Type safety with TypeScript');
  console.log('  - Self-documenting component metadata');
  console.log('  - Easy testing with validation hooks');
  console.log('  - Hot-reloading support');
  console.log('  - Consistent debugging experience');
}

/**
 * Usage in a Three.js application
 */
export class PilotHeadDemo {
  private scene: THREE.Scene;
  private heads: PilotHeadComponent[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    registerPilotHeadComponent();
    this.heads = await runPilotHeadExample(this.scene);
    showArchitectureComparison();
  }

  update(deltaTime: number) {
    this.heads.forEach(head => {
      head.update(deltaTime);
    });
  }

  dispose() {
    cleanupPilotHeadsExample(this.heads);
  }
}