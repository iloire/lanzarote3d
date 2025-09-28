import * as THREE from 'three';
import { TreeComponent, TreeOptions } from '../scenery/TreeComponent';
import { componentFactory, ComponentRegistry } from '../factory/ComponentFactory';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Example demonstrating the new Three.js component architecture
 *
 * This file shows:
 * 1. How to register components with the factory
 * 2. How to create components using the factory
 * 3. How to use resource management
 * 4. Best practices for component lifecycle
 */

/**
 * Initialize the component system
 */
export function initializeComponentSystem() {
  console.log('🚀 Initializing Three.js Component Architecture');

  // Register the TreeComponent
  componentFactory.register('tree', {
    constructor: TreeComponent,
    metadata: {
      name: 'Tree',
      version: '2.0.0',
      description: 'Procedural tree component with multiple styles',
      author: 'Lanzarote3D',
      tags: ['scenery', 'vegetation', 'procedural']
    },
    defaultOptions: {
      trunkHeight: 50,
      trunkRadius: 3,
      crownSize: 25,
      style: 'default'
    },
    category: 'scenery'
  });

  console.log('✅ Component system initialized');
}

/**
 * Example: Creating trees using the factory
 */
export async function createTreesExample(scene: THREE.Scene) {
  console.log('🌳 Creating trees using component factory');

  // Create different tree styles
  const treeConfigs: { position: THREE.Vector3; options: TreeOptions }[] = [
    {
      position: new THREE.Vector3(0, 0, 0),
      options: { style: 'default', crownColor: 0x228B22 }
    },
    {
      position: new THREE.Vector3(50, 0, 0),
      options: { style: 'pine', crownColor: 0x006400, trunkHeight: 80 }
    },
    {
      position: new THREE.Vector3(-50, 0, 0),
      options: { style: 'palm', crownColor: 0x32CD32, trunkHeight: 120, crownSize: 35 }
    }
  ];

  const trees: TreeComponent[] = [];

  for (const config of treeConfigs) {
    try {
      // Create tree using factory
      const result = await componentFactory.create<TreeComponent>('tree', {
        ...config.options,
        position: config.position
      });

      const tree = result.component;

      // Load the tree (creates Three.js objects)
      const treeObject = await tree.load();

      // Add to scene
      scene.add(treeObject);

      // Store reference for cleanup
      trees.push(tree);

      console.log(`✅ Created ${config.options.style} tree at`, config.position);
    } catch (error) {
      console.error('❌ Failed to create tree:', error);
    }
  }

  return trees;
}

/**
 * Example: Resource management demonstration
 */
export function demonstrateResourceManagement() {
  console.log('📊 Resource Management Statistics:');

  const stats = resourceManager.getStats();
  console.log(`  Total items: ${stats.totalItems}`);
  console.log(`  Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Geometries: ${stats.geometries}`);
  console.log(`  Materials: ${stats.materials}`);
  console.log(`  Textures: ${stats.textures}`);

  console.log('Memory usage breakdown:');
  console.log(`  Geometries: ${(stats.memoryUsage.geometries / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Materials: ${(stats.memoryUsage.materials / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Textures: ${(stats.memoryUsage.textures / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Example: Component lifecycle management
 */
export function demonstrateComponentLifecycle(trees: TreeComponent[]) {
  console.log('🔄 Component Lifecycle Demonstration');

  trees.forEach((tree, index) => {
    // Get component information
    console.log(`Tree ${index}:`, {
      isLoaded: tree.isLoaded,
      isVisible: tree.isVisible,
      metadata: tree.metadata,
      metrics: tree.metrics
    });

    // Validate component
    const issues = tree.validate();
    if (issues.length > 0) {
      console.warn(`⚠️ Tree ${index} validation issues:`, issues);
    }

    // Test visibility toggle
    tree.setVisible(index % 2 === 0);

    // Serialize component state
    const serialized = tree.serialize();
    console.log(`Tree ${index} serialized:`, serialized);
  });
}

/**
 * Example: Performance monitoring
 */
export function demonstratePerformanceMonitoring(trees: TreeComponent[]) {
  console.log('📈 Performance Monitoring');

  let frameCount = 0;
  const maxFrames = 60; // Monitor for 60 frames

  const updateLoop = () => {
    const deltaTime = 16; // Assume 60 FPS

    // Update all trees
    trees.forEach(tree => {
      tree.update(deltaTime);
    });

    frameCount++;

    if (frameCount < maxFrames) {
      requestAnimationFrame(updateLoop);
    } else {
      // Show final metrics
      trees.forEach((tree, index) => {
        console.log(`Tree ${index} final metrics:`, tree.metrics);
      });
    }
  };

  updateLoop();
}

/**
 * Example: Proper cleanup
 */
export function cleanupExample(trees: TreeComponent[]) {
  console.log('🧹 Cleaning up components');

  // Dispose of all trees
  trees.forEach((tree, index) => {
    console.log(`Disposing tree ${index}`);
    tree.dispose();
  });

  // Show resource statistics after cleanup
  console.log('Resource stats after cleanup:');
  demonstrateResourceManagement();

  // Force resource cleanup
  resourceManager.cleanup(true);

  console.log('Final resource stats:');
  demonstrateResourceManagement();
}

/**
 * Complete example workflow
 */
export async function runCompleteExample(scene: THREE.Scene) {
  try {
    // 1. Initialize system
    initializeComponentSystem();

    // 2. Create components
    const trees = await createTreesExample(scene);

    // 3. Demonstrate features
    demonstrateResourceManagement();
    demonstrateComponentLifecycle(trees);
    demonstratePerformanceMonitoring(trees);

    // 4. Cleanup (would typically be called when app closes)
    setTimeout(() => {
      cleanupExample(trees);
    }, 5000);

    return trees;
  } catch (error) {
    console.error('❌ Example failed:', error);
    return [];
  }
}

/**
 * Example: Component discovery and registration
 */
export function demonstrateComponentDiscovery() {
  console.log('🔍 Component Discovery');

  // List all registered components
  const components = componentFactory.getRegisteredComponents();
  console.log('Registered components:', components);

  // Get components by category
  const sceneryComponents = componentFactory.getComponentsByCategory('scenery');
  console.log('Scenery components:', sceneryComponents);

  // Get component metadata
  components.forEach(name => {
    const metadata = componentFactory.getComponentMetadata(name);
    console.log(`${name}:`, metadata);
  });
}

/**
 * Example usage in a Three.js application
 */
export class ComponentArchitectureDemo {
  private scene: THREE.Scene;
  private trees: TreeComponent[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    initializeComponentSystem();
    this.trees = await createTreesExample(this.scene);
    demonstrateComponentDiscovery();
  }

  update(deltaTime: number) {
    this.trees.forEach(tree => {
      tree.update(deltaTime);
    });
  }

  dispose() {
    cleanupExample(this.trees);
    componentFactory.dispose();
    resourceManager.dispose();
  }
}