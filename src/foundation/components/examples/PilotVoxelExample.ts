import * as THREE from 'three';
import {
  PilotVoxelComponent,
  PilotVoxelOptions
} from '../characters/PilotVoxelComponent';
import { componentFactory } from '../factory/ComponentFactory';
import { resourceManager } from '../../systems/ResourceManager';
import { LoadProgress } from '../base/AsyncThreeComponent';

/**
 * Example demonstrating the modern PilotVoxel component with async loading
 *
 * This file shows:
 * 1. How to register and use the PilotVoxel component
 * 2. Async loading with progress tracking and error handling
 * 3. Resource sharing and performance benefits
 * 4. Runtime material and texture updates
 * 5. Fallback handling for failed loads
 */

/**
 * Register the PilotVoxel component with the factory
 */
export function registerPilotVoxelComponent() {
  console.log('🧙‍♂️ Registering PilotVoxel component');

  componentFactory.register('pilotVoxel', {
    constructor: PilotVoxelComponent,
    metadata: {
      name: 'PilotVoxel',
      version: '2.0.0',
      description: 'Voxel-style pilot character component with OBJ model loading',
      author: 'Lanzarote3D',
      tags: ['character', 'pilot', 'voxel', 'model', 'async']
    },
    defaultOptions: {
      objFile: '/assets/models/pilot.obj',
      textureFile: '/assets/textures/pilot.png',
      materialOptions: {
        roughness: 0.8,
        metalness: 0.1
      },
      scale: 0.01
    },
    category: 'characters'
  });

  console.log('✅ PilotVoxel component registered');
}

/**
 * Example: Creating pilot voxels with different configurations
 */
export async function createPilotVoxelsExample(scene: THREE.Scene) {
  console.log('🧙‍♂️ Creating pilot voxels with async loading');

  const pilotConfigs: { position: THREE.Vector3; options: PilotVoxelOptions; description: string }[] = [
    {
      position: new THREE.Vector3(-200, 0, 0),
      description: 'Default Pilot',
      options: {
        objFile: '/assets/foundation/models/characters/adri/adri.obj',
        textureFile: '/assets/foundation/models/characters/adri/adri.png',
        scale: 0.01
      }
    },
    {
      position: new THREE.Vector3(0, 0, 0),
      description: 'Shiny Pilot',
      options: {
        objFile: '/assets/foundation/models/characters/adri/adri.obj',
        textureFile: '/assets/foundation/models/characters/adri/adri.png',
        materialOptions: {
          roughness: 0.2,
          metalness: 0.8
        },
        scale: 0.01
      }
    },
    {
      position: new THREE.Vector3(200, 0, 0),
      description: 'Transparent Pilot',
      options: {
        objFile: '/assets/foundation/models/characters/adri/adri.obj',
        textureFile: '/assets/foundation/models/characters/adri/adri.png',
        materialOptions: {
          transparent: true,
          roughness: 0.5,
          metalness: 0.3
        },
        scale: 0.01
      }
    }
  ];

  const pilots: PilotVoxelComponent[] = [];
  const loadingPromises: Promise<void>[] = [];

  for (const config of pilotConfigs) {
    try {
      console.log(`📦 Starting to load: ${config.description}`);

      // Create pilot with progress tracking
      const pilot = new PilotVoxelComponent({
        ...config.options,
        position: config.position
      }, {
        onProgress: (progress: LoadProgress) => {
          console.log(`📈 ${config.description}: ${(progress.progress * 100).toFixed(1)}% loaded`);
          if (progress.currentResource) {
            console.log(`  Loading: ${progress.currentResource}`);
          }
        },
        onResourceLoaded: (resource) => {
          console.log(`✅ ${config.description}: Loaded ${resource.type} (${resource.loadTime.toFixed(2)}ms)`);
        },
        onResourceError: (resourceId, error) => {
          console.warn(`⚠️ ${config.description}: Failed to load ${resourceId}:`, error.message);
        }
      });

      // Start loading (returns a promise)
      const loadPromise = pilot.load().then((pilotObject) => {
        scene.add(pilotObject);
        console.log(`🎉 ${config.description} fully loaded and added to scene`);
      });

      pilots.push(pilot);
      loadingPromises.push(loadPromise);

    } catch (error) {
      console.error(`❌ Failed to create ${config.description}:`, error);
    }
  }

  // Wait for all pilots to load
  console.log('⏳ Waiting for all pilots to load...');
  await Promise.all(loadingPromises);
  console.log('🎊 All pilots loaded successfully!');

  return pilots;
}

/**
 * Example: Progress tracking and loading states
 */
export async function demonstrateLoadingProgress() {
  console.log('📊 Demonstrating advanced loading progress tracking');

  let totalResources = 0;
  let loadedResources = 0;
  const resourceTimes: { [key: string]: number } = {};

  const pilot = new PilotVoxelComponent({
    objFile: '/assets/foundation/models/characters/adri/adri.obj',
    textureFile: '/assets/foundation/models/characters/adri/adri.png',
    scale: 0.01
  }, {
    onProgress: (progress: LoadProgress) => {
      totalResources = progress.totalResources;
      loadedResources = progress.loadedResources;

      console.log(`📈 Overall Progress: ${(progress.progress * 100).toFixed(1)}%`);
      console.log(`📦 Resources: ${loadedResources}/${totalResources}`);

      if (progress.currentResource) {
        console.log(`🔄 Currently loading: ${progress.currentResource}`);
      }

      if (progress.bytesLoaded && progress.bytesTotal) {
        const mbLoaded = (progress.bytesLoaded / 1024 / 1024).toFixed(2);
        const mbTotal = (progress.bytesTotal / 1024 / 1024).toFixed(2);
        console.log(`💾 Data: ${mbLoaded}MB / ${mbTotal}MB`);
      }
    },
    onResourceLoaded: (resource) => {
      resourceTimes[resource.id] = resource.loadTime;
      console.log(`✅ Loaded ${resource.id}: ${resource.loadTime.toFixed(2)}ms`);
    },
    onResourceError: (resourceId, error) => {
      console.error(`❌ Failed to load ${resourceId}:`, error);
    }
  });

  const startTime = performance.now();

  try {
    const pilotObject = await pilot.load();
    const totalTime = performance.now() - startTime;

    console.log('🎯 Loading Summary:');
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Resources loaded: ${Object.keys(resourceTimes).length}`);
    console.log(`  Resource breakdown:`);
    Object.entries(resourceTimes).forEach(([id, time]) => {
      console.log(`    ${id}: ${time.toFixed(2)}ms`);
    });

    // Show component metrics
    console.log('📊 Component Metrics:', pilot.metrics);

    return { pilot, pilotObject, loadTime: totalTime };
  } catch (error) {
    console.error('❌ Loading failed:', error);
    throw error;
  }
}

/**
 * Example: Resource sharing demonstration
 */
export async function demonstratePilotVoxelResourceSharing(scene: THREE.Scene) {
  console.log('🔄 Demonstrating resource sharing with multiple pilots');

  const positions = [
    new THREE.Vector3(-400, 0, 0),
    new THREE.Vector3(-200, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(200, 0, 0),
    new THREE.Vector3(400, 0, 0)
  ];

  const pilots: PilotVoxelComponent[] = [];

  // Create multiple pilots with the same resources
  for (let i = 0; i < positions.length; i++) {
    const pilot = new PilotVoxelComponent({
      objFile: '/assets/foundation/models/characters/adri/adri.obj',
      textureFile: '/assets/foundation/models/characters/adri/adri.png',
      position: positions[i],
      scale: 0.01,
      // Vary material properties to show they can be different while sharing geometry
      materialOptions: {
        roughness: 0.2 + (i * 0.2),
        metalness: i * 0.2
      }
    });

    const pilotObject = await pilot.load();
    scene.add(pilotObject);
    pilots.push(pilot);

    console.log(`👨‍✈️ Created pilot ${i + 1} with roughness: ${(0.2 + i * 0.2).toFixed(1)}`);
  }

  // Show resource sharing statistics
  const stats = resourceManager.getStats();
  console.log('📊 Resource Sharing Benefits:');
  console.log(`  Total resources cached: ${stats.totalItems}`);
  console.log(`  Memory usage: ${(stats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Models: ${stats.geometries} (shared geometry instances)`);
  console.log(`  Textures: ${stats.textures} (shared texture instances)`);
  console.log('💡 All 5 pilots share the same model and texture data!');

  return pilots;
}

/**
 * Example: Runtime updates and customization
 */
export async function demonstrateRuntimeUpdates(pilots: PilotVoxelComponent[]) {
  console.log('🎨 Demonstrating runtime material and texture updates');

  if (pilots.length === 0) return;

  const pilot = pilots[0];

  // Animate material properties
  let time = 0;
  const animateProperties = () => {
    time += 0.01;

    // Animate roughness and metalness
    const roughness = 0.5 + Math.sin(time) * 0.3;
    const metalness = 0.5 + Math.cos(time * 0.7) * 0.3;

    pilot.updateMaterialProperties({
      roughness: Math.max(0, Math.min(1, roughness)),
      metalness: Math.max(0, Math.min(1, metalness))
    });

    // Continue animation
    requestAnimationFrame(animateProperties);
  };

  console.log('🎬 Starting material animation...');
  animateProperties();

  // Demonstrate texture property updates
  setTimeout(() => {
    console.log('🔄 Updating texture properties...');
    pilot.updateTextureProperties({
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter
    });
  }, 3000);
}

/**
 * Example: Error handling and fallbacks
 */
export async function demonstrateErrorHandling(scene: THREE.Scene) {
  console.log('🛡️ Demonstrating error handling and fallbacks');

  // Try to load with invalid URLs to test fallbacks
  const pilotWithFallback = new PilotVoxelComponent({
    objFile: '/invalid/path/model.obj',
    textureFile: '/invalid/path/texture.png',
    position: new THREE.Vector3(600, 0, 0),
    scale: 0.01
  }, {
    onResourceError: (resourceId, error) => {
      console.warn(`🔄 Using fallback for ${resourceId}: ${error.message}`);
    }
  });

  try {
    const fallbackObject = await pilotWithFallback.load();
    scene.add(fallbackObject);
    console.log('✅ Fallback pilot created successfully');
    return pilotWithFallback;
  } catch (error) {
    console.error('❌ Even fallback failed:', error);
    throw error;
  }
}

/**
 * Example: Performance benchmarking
 */
export async function performanceBenchmark() {
  console.log('⚡ Running PilotVoxel performance benchmark');

  const iterations = 10;
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    const pilot = new PilotVoxelComponent({
      objFile: '/assets/foundation/models/characters/adri/adri.obj',
      textureFile: '/assets/foundation/models/characters/adri/adri.png',
      scale: 0.01
    });

    await pilot.load();
    const loadTime = performance.now() - startTime;
    results.push(loadTime);

    // Clean up
    pilot.dispose();

    console.log(`  Iteration ${i + 1}: ${loadTime.toFixed(2)}ms`);
  }

  const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);

  console.log('📊 Benchmark Results:');
  console.log(`  Average load time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Fastest load: ${minTime.toFixed(2)}ms`);
  console.log(`  Slowest load: ${maxTime.toFixed(2)}ms`);
  console.log(`  Performance consistency: ${((1 - (maxTime - minTime) / avgTime) * 100).toFixed(1)}%`);

  return {
    average: avgTime,
    min: minTime,
    max: maxTime,
    results
  };
}

/**
 * Complete PilotVoxel example workflow
 */
export async function runPilotVoxelExample(scene: THREE.Scene) {
  try {
    // 1. Register component
    registerPilotVoxelComponent();

    // 2. Demonstrate basic loading
    const pilots = await createPilotVoxelsExample(scene);

    // 3. Show advanced progress tracking
    const progressResult = await demonstrateLoadingProgress();
    scene.add(progressResult.pilotObject);

    // 4. Demonstrate resource sharing
    const sharedPilots = await demonstratePilotVoxelResourceSharing(scene);

    // 5. Show runtime updates
    demonstrateRuntimeUpdates([...pilots, ...sharedPilots]);

    // 6. Test error handling
    const fallbackPilot = await demonstrateErrorHandling(scene);

    // 7. Run performance benchmark
    const benchmarkResults = await performanceBenchmark();

    console.log('🎊 PilotVoxel example completed successfully!');

    return {
      pilots: [...pilots, ...sharedPilots, fallbackPilot],
      benchmarkResults,
      progressResult
    };
  } catch (error) {
    console.error('❌ PilotVoxel example failed:', error);
    return null;
  }
}

/**
 * Cleanup function
 */
export function cleanupPilotVoxelExample(pilots: PilotVoxelComponent[]) {
  console.log('🧹 Cleaning up pilot voxels');

  pilots.forEach((pilot, index) => {
    console.log(`Disposing pilot ${index + 1}`);
    pilot.dispose();
  });

  // Show resource statistics after cleanup
  const stats = resourceManager.getStats();
  console.log('📊 Resource stats after cleanup:');
  console.log(`  Total items: ${stats.totalItems}`);
  console.log(`  Memory usage: ${(stats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Usage in a Three.js application
 */
export class PilotVoxelDemo {
  private scene: THREE.Scene;
  private pilots: PilotVoxelComponent[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    const result = await runPilotVoxelExample(this.scene);
    if (result) {
      this.pilots = result.pilots;
    }
  }

  update(deltaTime: number) {
    this.pilots.forEach(pilot => {
      pilot.update(deltaTime);
    });
  }

  dispose() {
    cleanupPilotVoxelExample(this.pilots);
  }
}