import * as THREE from 'three';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';
import { ComponentBenchmark } from '../../../../../foundation/systems/ComponentBenchmark';
import { WingComponent } from '../../../../../foundation/components/vehicles/WingComponent';
import { ParagliderComponent } from '../../../../../foundation/components/vehicles/ParagliderComponent';
import { BoatComponent } from '../../../../../foundation/components/vehicles/BoatComponent';
import Wing from '../../../../../foundation/components/vehicles/Wing';
import ParagliderVoxel from '../../../../../foundation/components/vehicles/ParagliderVoxel';
import SpeedBoat from '../../../../../foundation/components/scenery/SpeedBoat';

/**
 * Component Benchmark Workshop Demo
 *
 * Demonstrates the performance differences between legacy and modern Three.js components.
 * Shows memory usage, creation time, and resource sharing benefits.
 */
class ComponentBenchmarkWorkshopApp extends WorkshopDemoBase {
  private benchmark: ComponentBenchmark | null = null;
  private benchmarkResults: any[] = [];

  constructor() {
    super({
      name: 'Component Performance Benchmark',
      description: 'Compare legacy vs modern Three.js component performance',
      ground: {
        create: false,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: false,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, gui } = options;

      console.log('🎯 Initializing Component Benchmark Demo...');

      this.benchmark = new ComponentBenchmark();

      // Create benchmark UI
      this.createBenchmarkUI(gui, scene, camera);

      // Position camera
      camera.position.set(50, 30, 50);
      camera.lookAt(0, 0, 0);

      this.startAnimationLoop(renderer, scene, camera, options.controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private createBenchmarkUI(gui: any, scene: THREE.Scene, camera: THREE.Camera): void {
    if (!gui) return;

    const benchmarkFolder = gui.addFolder('Performance Benchmarks');
    benchmarkFolder.open();

    const controls = {
      iterations: 25,
      runWingBenchmark: () => this.runWingBenchmark(controls.iterations),
      runParagliderBenchmark: () => this.runParagliderBenchmark(controls.iterations),
      runBoatBenchmark: () => this.runBoatBenchmark(controls.iterations),
      runFullSuite: () => this.runFullBenchmarkSuite(controls.iterations),
      clearResults: () => this.clearBenchmarkResults(),
      showResults: () => this.displayResults(),
    };

    benchmarkFolder.add(controls, 'iterations', 5, 100, 5).name('Test Iterations');
    benchmarkFolder.add(controls, 'runWingBenchmark').name('🪶 Benchmark Wings');
    benchmarkFolder.add(controls, 'runParagliderBenchmark').name('🪂 Benchmark Paragliders');
    benchmarkFolder.add(controls, 'runBoatBenchmark').name('⛵ Benchmark Boats');
    benchmarkFolder.add(controls, 'runFullSuite').name('🚀 Run Full Suite');
    benchmarkFolder.add(controls, 'clearResults').name('🗑️ Clear Results');
    benchmarkFolder.add(controls, 'showResults').name('📊 Show Results');

    // Info panel
    const infoFolder = gui.addFolder('Benchmark Info');
    const info = {
      description: 'Click benchmarks above to test performance',
      memoryInfo: 'Modern components use shared resources',
      resourceSharing: 'Geometries and materials are reused',
      cleanup: 'Proper disposal prevents memory leaks'
    };

    infoFolder.add(info, 'description').name('Instructions');
    infoFolder.add(info, 'memoryInfo').name('Memory Optimization');
    infoFolder.add(info, 'resourceSharing').name('Resource Sharing');
    infoFolder.add(info, 'cleanup').name('Memory Management');
  }

  private async runWingBenchmark(iterations: number): Promise<void> {
    if (!this.benchmark) return;

    console.log('🪶 Running Wing Component Benchmark...');

    try {
      const modernResult = await this.benchmark.benchmarkModernComponent(
        WingComponent,
        { wingType: 'hangglider', numeroCajones: 16 },
        iterations
      );

      const legacyResult = await this.benchmark.benchmarkLegacyComponent(
        Wing,
        {},
        iterations
      );

      this.benchmark.compareResults(modernResult, legacyResult);
      this.benchmarkResults.push({ modern: modernResult, legacy: legacyResult });

      console.log('✅ Wing benchmark completed!');

    } catch (error) {
      console.error('❌ Wing benchmark failed:', error);
    }
  }

  private async runParagliderBenchmark(iterations: number): Promise<void> {
    if (!this.benchmark) return;

    console.log('🪂 Running Paraglider Component Benchmark...');

    try {
      const modernResult = await this.benchmark.benchmarkModernComponent(
        ParagliderComponent,
        { numeroCajones: 30, showAxesHelper: false },
        iterations
      );

      const legacyResult = await this.benchmark.benchmarkLegacyComponent(
        ParagliderVoxel,
        {
          glider: { wingColor1: '#ff4444', wingColor2: '#44ff44' },
          pilot: { objFile: null, textureFile: null }
        },
        iterations
      );

      this.benchmark.compareResults(modernResult, legacyResult);
      this.benchmarkResults.push({ modern: modernResult, legacy: legacyResult });

      console.log('✅ Paraglider benchmark completed!');

    } catch (error) {
      console.error('❌ Paraglider benchmark failed:', error);
    }
  }

  private async runBoatBenchmark(iterations: number): Promise<void> {
    if (!this.benchmark) return;

    console.log('⛵ Running Boat Component Benchmark...');

    try {
      const modernResult = await this.benchmark.benchmarkModernComponent(
        BoatComponent,
        { boatType: 'speedboat', enableFloating: false },
        iterations
      );

      const legacyResult = await this.benchmark.benchmarkLegacyComponent(
        SpeedBoat,
        {},
        iterations
      );

      this.benchmark.compareResults(modernResult, legacyResult);
      this.benchmarkResults.push({ modern: modernResult, legacy: legacyResult });

      console.log('✅ Boat benchmark completed!');

    } catch (error) {
      console.error('❌ Boat benchmark failed:', error);
    }
  }

  private async runFullBenchmarkSuite(iterations: number): Promise<void> {
    if (!this.benchmark) return;

    console.log('🚀 Running Full Benchmark Suite...');

    await this.runWingBenchmark(iterations);
    await this.runBoatBenchmark(iterations);
    // Note: Paraglider benchmark is complex due to async model loading
    // await this.runParagliderBenchmark(iterations);

    this.displayResults();
  }

  private clearBenchmarkResults(): void {
    this.benchmarkResults = [];
    console.log('🗑️ Benchmark results cleared');
  }

  private displayResults(): void {
    if (this.benchmarkResults.length === 0) {
      console.log('📊 No benchmark results to display');
      return;
    }

    console.log('\n📈 BENCHMARK SUMMARY REPORT');
    console.log('===========================\n');

    let totalModernTime = 0;
    let totalLegacyTime = 0;
    let totalModernMemory = 0;
    let totalLegacyMemory = 0;
    let totalResourcesShared = 0;

    this.benchmarkResults.forEach((result, index) => {
      const { modern, legacy } = result;

      console.log(`\n${index + 1}. ${modern.componentName} vs ${legacy.componentName}`);
      console.log(`   Creation: ${modern.avgCreationTime.toFixed(2)}ms vs ${legacy.avgCreationTime.toFixed(2)}ms`);
      console.log(`   Memory: ${(modern.memoryUsed / 1024 / 1024).toFixed(2)}MB vs ${(legacy.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Resources Shared: ${modern.resourcesShared}`);

      totalModernTime += modern.avgCreationTime;
      totalLegacyTime += legacy.avgCreationTime;
      totalModernMemory += modern.memoryUsed;
      totalLegacyMemory += legacy.memoryUsed;
      totalResourcesShared += modern.resourcesShared;
    });

    console.log('\n🎯 OVERALL PERFORMANCE GAINS:');

    const timeImprovement = ((totalLegacyTime - totalModernTime) / totalLegacyTime) * 100;
    console.log(`   ⚡ Creation Speed: ${timeImprovement.toFixed(1)}% faster`);

    const memoryImprovement = ((totalLegacyMemory - totalModernMemory) / totalLegacyMemory) * 100;
    console.log(`   🧠 Memory Usage: ${memoryImprovement.toFixed(1)}% less memory`);

    console.log(`   ♻️ Total Resources Shared: ${totalResourcesShared}`);

    console.log('\n💡 Modern components provide:');
    console.log('   • Better performance through resource sharing');
    console.log('   • Lower memory usage');
    console.log('   • Consistent lifecycle management');
    console.log('   • Built-in validation and error handling');
    console.log('   • Unified API across all components');
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    if (this.benchmark) {
      this.benchmark.dispose();
      this.benchmark = null;
    }

    this.benchmarkResults = [];
    super.dispose();
  }
}

const componentBenchmarkWorkshopApp = new ComponentBenchmarkWorkshopApp();

const ComponentBenchmarkWorkshop = {
  load: async (options: StoryOptions) => {
    return componentBenchmarkWorkshopApp.load(options);
  },
  dispose: () => {
    return componentBenchmarkWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return componentBenchmarkWorkshopApp.getAppInfo();
  },
};

export default ComponentBenchmarkWorkshop;