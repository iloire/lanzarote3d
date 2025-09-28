import * as THREE from 'three';
import { resourceManager } from './ResourceManager';

export interface BenchmarkResult {
  componentName: string;
  iterations: number;
  creationTime: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryUsed: number;
  avgCreationTime: number;
  cleanupTime: number;
  avgCleanupTime: number;
  resourcesShared: number;
  errors: string[];
}

export interface ComponentConstructor {
  new (options?: any): any;
}

export interface LegacyComponent {
  load(gui?: any): Promise<THREE.Object3D> | THREE.Object3D;
}

export interface ModernComponent {
  load(): Promise<THREE.Object3D>;
  dispose(): void;
  getInfo(): Record<string, any>;
  getObject3D?(): THREE.Object3D | null;
}

export class ComponentBenchmark {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor() {
    // Create minimal Three.js environment for testing
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(100, 100); // Minimal size for testing
    this.renderer.domElement.style.display = 'none'; // Hide the canvas
    document.body.appendChild(this.renderer.domElement);
  }

  /**
   * Benchmark a modern component (uses base class architecture)
   */
  public async benchmarkModernComponent(
    ComponentClass: ComponentConstructor,
    options: any = {},
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const componentName = ComponentClass.name;
    console.log(`🚀 Benchmarking modern component: ${componentName} (${iterations} iterations)`);

    const result: BenchmarkResult = {
      componentName,
      iterations,
      creationTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
      memoryUsed: 0,
      avgCreationTime: 0,
      cleanupTime: 0,
      avgCleanupTime: 0,
      resourcesShared: 0,
      errors: [],
    };

    // Force garbage collection if available
    this.forceGarbageCollection();

    // Measure initial memory
    result.memoryBefore = this.getMemoryUsage();
    const initialResourceStats = resourceManager.getStats();

    const components: ModernComponent[] = [];
    const startTime = performance.now();

    try {
      // Create components
      for (let i = 0; i < iterations; i++) {
        const component = new ComponentClass(options);
        const mesh = await component.load();

        // Add to scene to simulate real usage
        this.scene.add(mesh);
        components.push(component);
      }

      result.creationTime = performance.now() - startTime;
      result.avgCreationTime = result.creationTime / iterations;

      // Force render to ensure all GPU resources are allocated
      this.renderer.render(this.scene, new THREE.PerspectiveCamera());

      // Measure memory after creation
      result.memoryAfter = this.getMemoryUsage();
      result.memoryUsed = result.memoryAfter - result.memoryBefore;

      // Calculate resource sharing benefits
      const finalResourceStats = resourceManager.getStats();
      result.resourcesShared =
        finalResourceStats.geometries -
        initialResourceStats.geometries +
        (finalResourceStats.materials - initialResourceStats.materials) +
        (finalResourceStats.textures - initialResourceStats.textures);

      // Cleanup
      const cleanupStart = performance.now();
      components.forEach((component, index) => {
        component.dispose();
        // Remove mesh from scene if it's still there
        if (this.scene.children.length > index) {
          const mesh = this.scene.children[index];
          this.scene.remove(mesh);
        }
      });

      result.cleanupTime = performance.now() - cleanupStart;
      result.avgCleanupTime = result.cleanupTime / iterations;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    // Clear scene
    this.clearScene();

    return result;
  }

  /**
   * Benchmark a legacy component (traditional approach)
   */
  public async benchmarkLegacyComponent(
    ComponentClass: ComponentConstructor,
    options: any = {},
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const componentName = ComponentClass.name;
    console.log(`🔧 Benchmarking legacy component: ${componentName} (${iterations} iterations)`);

    const result: BenchmarkResult = {
      componentName,
      iterations,
      creationTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
      memoryUsed: 0,
      avgCreationTime: 0,
      cleanupTime: 0,
      avgCleanupTime: 0,
      resourcesShared: 0,
      errors: [],
    };

    // Force garbage collection if available
    this.forceGarbageCollection();

    // Measure initial memory
    result.memoryBefore = this.getMemoryUsage();

    const components: LegacyComponent[] = [];
    const meshes: THREE.Object3D[] = [];
    const startTime = performance.now();

    try {
      // Create components
      for (let i = 0; i < iterations; i++) {
        const component = new ComponentClass(options);
        components.push(component);

        let mesh: THREE.Object3D;
        const loadResult = component.load();

        if (loadResult instanceof Promise) {
          mesh = await loadResult;
        } else {
          mesh = loadResult;
        }

        // Add to scene to simulate real usage
        this.scene.add(mesh);
        meshes.push(mesh);
      }

      result.creationTime = performance.now() - startTime;
      result.avgCreationTime = result.creationTime / iterations;

      // Force render to ensure all GPU resources are allocated
      this.renderer.render(this.scene, new THREE.PerspectiveCamera());

      // Measure memory after creation
      result.memoryAfter = this.getMemoryUsage();
      result.memoryUsed = result.memoryAfter - result.memoryBefore;

      // Legacy components don't have resource sharing, so this will be 0
      result.resourcesShared = 0;

      // Cleanup (legacy components don't have dispose methods)
      const cleanupStart = performance.now();
      meshes.forEach(mesh => {
        this.scene.remove(mesh);
        // Manual cleanup for legacy components
        this.disposeMesh(mesh);
      });

      result.cleanupTime = performance.now() - cleanupStart;
      result.avgCleanupTime = result.cleanupTime / iterations;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    // Clear scene
    this.clearScene();

    return result;
  }

  /**
   * Compare two benchmark results
   */
  public compareResults(modernResult: BenchmarkResult, legacyResult: BenchmarkResult): void {
    console.log(
      `\n📊 Performance Comparison: ${modernResult.componentName} vs ${legacyResult.componentName}`
    );
    console.log('='.repeat(80));

    console.log(`\n🏗️ Creation Performance:`);
    console.log(`  Modern: ${modernResult.avgCreationTime.toFixed(2)}ms per component`);
    console.log(`  Legacy: ${legacyResult.avgCreationTime.toFixed(2)}ms per component`);

    const creationImprovement =
      ((legacyResult.avgCreationTime - modernResult.avgCreationTime) /
        legacyResult.avgCreationTime) *
      100;
    console.log(
      `  Performance: ${creationImprovement > 0 ? '+' : ''}${creationImprovement.toFixed(1)}% ${creationImprovement > 0 ? 'faster' : 'slower'}`
    );

    console.log(`\n🧠 Memory Usage:`);
    console.log(`  Modern: ${(modernResult.memoryUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Legacy: ${(legacyResult.memoryUsed / 1024 / 1024).toFixed(2)} MB`);

    const memoryImprovement =
      ((legacyResult.memoryUsed - modernResult.memoryUsed) / legacyResult.memoryUsed) * 100;
    console.log(
      `  Memory savings: ${memoryImprovement > 0 ? '+' : ''}${memoryImprovement.toFixed(1)}%`
    );

    console.log(`\n🧹 Cleanup Performance:`);
    console.log(`  Modern: ${modernResult.avgCleanupTime.toFixed(2)}ms per component`);
    console.log(`  Legacy: ${legacyResult.avgCleanupTime.toFixed(2)}ms per component`);

    console.log(`\n♻️ Resource Efficiency:`);
    console.log(`  Modern: ${modernResult.resourcesShared} shared resources`);
    console.log(`  Legacy: ${legacyResult.resourcesShared} shared resources (none)`);

    if (modernResult.errors.length > 0 || legacyResult.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      console.log(`  Modern: ${modernResult.errors.length} errors`);
      console.log(`  Legacy: ${legacyResult.errors.length} errors`);
    }
  }

  /**
   * Run a comprehensive benchmark suite
   */
  public async runBenchmarkSuite(
    testCases: Array<{
      modern: ComponentConstructor;
      legacy: ComponentConstructor;
      options?: any;
      iterations?: number;
    }>
  ): Promise<void> {
    console.log('🎯 Starting Component Benchmark Suite');
    console.log('=====================================\n');

    for (const testCase of testCases) {
      const iterations = testCase.iterations || 50;
      const options = testCase.options || {};

      try {
        const modernResult = await this.benchmarkModernComponent(
          testCase.modern,
          options,
          iterations
        );

        const legacyResult = await this.benchmarkLegacyComponent(
          testCase.legacy,
          options,
          iterations
        );

        this.compareResults(modernResult, legacyResult);
      } catch (error) {
        console.error(`❌ Benchmark failed:`, error);
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Show overall resource manager statistics
    const resourceStats = resourceManager.getStats();
    console.log('📈 Overall Resource Manager Statistics:');
    console.log(`  Total Geometries: ${resourceStats.geometries}`);
    console.log(`  Total Materials: ${resourceStats.materials}`);
    console.log(`  Total Textures: ${resourceStats.textures}`);
    console.log(`  Memory Usage: ${(resourceStats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
  }

  private getMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }

    // Fallback: approximate memory usage
    return Date.now(); // Simple timestamp as placeholder
  }

  private forceGarbageCollection(): void {
    // Force garbage collection if available (Chrome with --js-flags="--expose-gc")
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  private clearScene(): void {
    // Remove all objects from scene
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      this.disposeMesh(child);
    }
  }

  private disposeMesh(object: THREE.Object3D): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  public dispose(): void {
    this.clearScene();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
