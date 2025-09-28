import { componentFactory, ComponentRegistry } from '../factory/ComponentFactory';
import { TreeComponent } from '../scenery/TreeComponent';
import { PilotHeadComponent } from '../characters/PilotHeadComponent';

/**
 * Central component registration system
 *
 * This file manages registration of all modern components with the factory
 * and provides utilities for component discovery and management.
 */

/**
 * Register all modern scenery components
 */
export function registerSceneryComponents() {
  console.log('🌲 Registering scenery components');

  // Register TreeComponent
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
      style: 'default',
      trunkColor: 0xf3f2f7,
      crownColor: 0xb2d2a4
    },
    category: 'scenery'
  });

  console.log('✅ Scenery components registered');
}

/**
 * Register all modern character components
 */
export function registerCharacterComponents() {
  console.log('👨‍✈️ Registering character components');

  // Register PilotHeadComponent
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
      headType: 'default',
      helmetType: 'default',
      glassesType: 'default',
      skinColor: 0xe0bea5,
      helmetColor: 0xffff00,
      castShadow: true,
      receiveShadow: true
    },
    category: 'characters'
  });

  console.log('✅ Character components registered');
}

/**
 * Register all modern vehicle components
 */
export function registerVehicleComponents() {
  console.log('🚁 Registering vehicle components');

  // TODO: Add modern vehicle components here when they're created
  // Example:
  // componentFactory.register('modernParaglider', { ... });
  // componentFactory.register('modernBoat', { ... });

  console.log('✅ Vehicle components registered (placeholder)');
}

/**
 * Register all modern environment components
 */
export function registerEnvironmentComponents() {
  console.log('🌤️ Registering environment components');

  // TODO: Add modern environment components here when they're created
  // Example:
  // componentFactory.register('modernCloud', { ... });
  // componentFactory.register('modernSky', { ... });

  console.log('✅ Environment components registered (placeholder)');
}

/**
 * Register all modern UI components
 */
export function registerUIComponents() {
  console.log('🎛️ Registering UI components');

  // TODO: Add modern UI components here when they're created
  // Example:
  // componentFactory.register('modernTrajectory', { ... });
  // componentFactory.register('modernWindIndicator', { ... });

  console.log('✅ UI components registered (placeholder)');
}

/**
 * Register all available modern components
 */
export function registerAllComponents() {
  console.log('🚀 Registering all modern Three.js components');

  registerSceneryComponents();
  registerCharacterComponents();
  registerVehicleComponents();
  registerEnvironmentComponents();
  registerUIComponents();

  // Show registration summary
  const registeredComponents = componentFactory.getRegisteredComponents();
  console.log(`✅ Successfully registered ${registeredComponents.length} components:`);

  registeredComponents.forEach(name => {
    const metadata = componentFactory.getComponentMetadata(name);
    console.log(`  - ${name}: ${metadata?.description || 'No description'}`);
  });

  // Show component categories
  const categories = ['scenery', 'characters', 'vehicles', 'environment', 'ui'];
  categories.forEach(category => {
    const components = componentFactory.getComponentsByCategory(category);
    if (components.length > 0) {
      console.log(`📂 ${category}: ${components.join(', ')}`);
    }
  });
}

/**
 * Get component registration status
 */
export function getRegistrationStatus() {
  const registeredComponents = componentFactory.getRegisteredComponents();

  return {
    totalComponents: registeredComponents.length,
    components: registeredComponents,
    byCategory: {
      scenery: componentFactory.getComponentsByCategory('scenery'),
      characters: componentFactory.getComponentsByCategory('characters'),
      vehicles: componentFactory.getComponentsByCategory('vehicles'),
      environment: componentFactory.getComponentsByCategory('environment'),
      ui: componentFactory.getComponentsByCategory('ui')
    }
  };
}

/**
 * Validate all registered components
 */
export async function validateRegisteredComponents() {
  console.log('🔍 Validating registered components');

  const components = componentFactory.getRegisteredComponents();
  const results: { [key: string]: { success: boolean; error?: string } } = {};

  for (const componentName of components) {
    try {
      // Try to create a minimal instance
      const result = await componentFactory.create(componentName, {});
      const component = result.component;

      // Validate the component
      const issues = component.validate();
      if (issues.length > 0) {
        results[componentName] = {
          success: false,
          error: `Validation issues: ${issues.join(', ')}`
        };
      } else {
        results[componentName] = { success: true };
      }

      // Clean up
      component.dispose();
    } catch (error) {
      results[componentName] = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Report results
  const successful = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success).length;

  console.log(`✅ Component validation complete: ${successful} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('❌ Failed components:');
    Object.entries(results).forEach(([name, result]) => {
      if (!result.success) {
        console.log(`  - ${name}: ${result.error}`);
      }
    });
  }

  return results;
}

/**
 * Development utilities for component management
 */
export class ComponentDevelopmentUtils {
  /**
   * Hot-reload a component (for development)
   */
  static async hotReloadComponent(componentName: string) {
    console.log(`🔄 Hot-reloading component: ${componentName}`);

    // Unregister existing component
    componentFactory.unregister(componentName);

    // Clear related resources
    // Note: In a real implementation, this would trigger a module reload
    console.log(`♻️ Component ${componentName} ready for re-registration`);
  }

  /**
   * Performance test for component creation
   */
  static async performanceTest(componentName: string, iterations: number = 100) {
    console.log(`⚡ Performance testing component: ${componentName} (${iterations} iterations)`);

    const startTime = performance.now();
    const components: any[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await componentFactory.create(componentName, {
        position: { x: i * 10, y: 0, z: 0 }
      });
      components.push(result.component);
      await result.component.load();
    }

    const creationTime = performance.now() - startTime;

    // Cleanup
    const cleanupStart = performance.now();
    components.forEach(component => component.dispose());
    const cleanupTime = performance.now() - cleanupStart;

    console.log(`📊 Performance results for ${componentName}:`);
    console.log(`  Creation time: ${creationTime.toFixed(2)}ms (${(creationTime / iterations).toFixed(2)}ms per component)`);
    console.log(`  Cleanup time: ${cleanupTime.toFixed(2)}ms (${(cleanupTime / iterations).toFixed(2)}ms per component)`);
    console.log(`  Total time: ${(creationTime + cleanupTime).toFixed(2)}ms`);

    return {
      componentName,
      iterations,
      creationTime,
      cleanupTime,
      avgCreationTime: creationTime / iterations,
      avgCleanupTime: cleanupTime / iterations
    };
  }

  /**
   * Memory usage analysis
   */
  static analyzeMemoryUsage() {
    console.log('🧠 Memory usage analysis');

    // This would integrate with browser memory APIs in a real implementation
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`  JS Heap Size: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  JS Heap Limit: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }

    // Resource manager statistics
    const resourceStats = require('../../systems/ResourceManager').resourceManager.getStats();
    console.log(`  Resource Manager: ${(resourceStats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    Geometries: ${resourceStats.geometries} items`);
    console.log(`    Materials: ${resourceStats.materials} items`);
    console.log(`    Textures: ${resourceStats.textures} items`);
  }
}

/**
 * Initialize the component system
 * Call this once at application startup
 */
export function initializeComponentSystem() {
  console.log('🏗️ Initializing Three.js Component System');

  // Register all components
  registerAllComponents();

  // Validate in development mode
  if (process.env.NODE_ENV === 'development') {
    validateRegisteredComponents().then(results => {
      console.log('🔍 Component validation completed');
    });
  }

  console.log('✅ Component system initialized successfully');
}