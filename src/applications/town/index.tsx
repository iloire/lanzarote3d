import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { HouseGroupCreator } from '../../shared/env/house-group-creator';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { createLabel } from './label-utils';
import { PerformanceUI, PerformanceSettings, PolygonBreakdown } from './performance-ui';
import { disposeObjects } from './disposal-utils';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';

/**
 * Town Workshop - Showcase of neighborhood generation using HouseGroupCreator
 * Demonstrates different neighborhood formations and house distributions
 */
class TownWorkshop extends WorkshopDemoBase {
  private neighborhoodMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Mesh[] = [];
  private houseGroupCreator!: HouseGroupCreator;
  private componentRegistry!: ComponentRegistry;
  private currentScene!: THREE.Scene;
  private currentGui: GUI | undefined;
  private isLowPoly: boolean = true; // Start in low-poly mode by default
  private performanceUI!: PerformanceUI;
  private performanceSettings: PerformanceSettings = {
    lowPoly: true, // Start in low-poly mode by default
    polygonCount: 0,
    lastRenderTime: 0,
  };
  private neighborhoodSettings = {
    formation: 'suburban' as 'street' | 'cul-de-sac' | 'grid' | 'suburban' | 'rural' | 'random',
    houseCount: 20,
  };

  constructor() {
    super({
      name: 'Town Workshop',
      description: 'Neighborhood generation showcase displaying various residential formations',
      ground: {
        create: true,
        size: { width: 2400, height: 2000 },
        color: 0xD2B48C, // Sandy brown for desert town ground
        opacity: 0.4,
      },
      lighting: {
        sunPosition: 10,
        
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, gui, controls } = options;

      logger.debug('🐛 Town demo received options:', {
        hasCamera: !!camera,
        hasScene: !!scene,
        hasRenderer: !!renderer,
        hasGui: !!gui,
        hasControls: !!controls,
        guiType: typeof gui,
        gui
      });

      // Store references for reconstruction
      this.currentScene = scene;
      this.currentGui = gui;

      // Initialize component registry and house group creator
      this.componentRegistry = new ComponentRegistry();
      this.houseGroupCreator = new HouseGroupCreator(scene, this.componentRegistry);

      // Set initial low-poly mode
      this.houseGroupCreator.setLowPolyMode(this.isLowPoly);

      // Setup neighborhood and performance controls
      this.setupControls(gui);

      // Setup on-screen HTML controls
      this.performanceUI = new PerformanceUI(
        this.performanceSettings,
        () => this.neighborhoodMeshes.length
      );
      this.performanceUI.initialize(() => this.toggleLowPolyMode());

      // Load all neighborhoods with proper tracking
      await this.loadNeighborhoods(scene);

      // Setup camera and animation
      this.setupCamera(camera);
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        // Keep labels facing the camera
        this.labelMeshes.forEach(label => {
          label.quaternion.copy(camera.quaternion);
        });
      });

      this.isLoaded = true;
      logger.info(
        `✅ ${this.config.name} loaded successfully with ${this.neighborhoodMeshes.length} houses`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }


  /**
   * Toggle between low-poly and high-detail modes
   */
  private async toggleLowPolyMode(): Promise<void> {
    const startTime = performance.now();

    this.isLowPoly = !this.isLowPoly;
    this.performanceSettings.lowPoly = this.isLowPoly;

    logger.info(`🔄 Switching to ${this.isLowPoly ? 'Low-Poly' : 'High-Detail'} mode...`);

    // Update UI to show loading state
    this.performanceUI.setLoading(true);

    try {
      // Force garbage collection hint (if available)
      if ((window as any).gc) {
        (window as any).gc();
      }

      await this.recreateNeighborhoods();
      this.updatePolygonCount();

      const endTime = performance.now();
      const switchTime = Math.round(endTime - startTime);

      logger.info(`✅ Mode switch completed in ${switchTime}ms`);

    } catch (error) {
      logger.error('❌ Error toggling low-poly mode:', error);
    } finally {
      // Re-enable button and update display
      this.performanceUI.setLoading(false);
    }
  }


  /**
   * Setup neighborhood and performance controls
   */
  private setupControls(gui: GUI): void {
    if (!gui) {
      logger.warn('⚠️ No GUI provided to setupControls');
      return;
    }

    // Neighborhood Settings
    const neighborhoodFolder = gui.addFolder('Neighborhood Settings');
    neighborhoodFolder.open();

    neighborhoodFolder
      .add(this.neighborhoodSettings, 'formation', [
        'suburban',
        'rural',
        'grid',
        'street',
        'cul-de-sac',
        'random',
      ])
      .name('Formation Type')
      .onChange(async () => {
        logger.info(`🏘️ Changing formation to ${this.neighborhoodSettings.formation}...`);
        await this.recreateNeighborhoods();
        this.updatePolygonCount();
      });

    neighborhoodFolder
      .add(this.neighborhoodSettings, 'houseCount', 1, 100, 1)
      .name('House Count')
      .onChange(async () => {
        logger.info(`🏘️ Changing house count to ${this.neighborhoodSettings.houseCount}...`);
        await this.recreateNeighborhoods();
        this.updatePolygonCount();
      });

    // Performance Settings
    const performanceFolder = gui.addFolder('Performance Settings');
    performanceFolder.open();

    performanceFolder
      .add(this.performanceSettings, 'lowPoly')
      .name('Low-Poly Mode')
      .onChange(async (value: boolean) => {
        this.isLowPoly = value;
        logger.info(`🔄 Switching to ${value ? 'Low-Poly' : 'High-Detail'} mode...`);
        await this.recreateNeighborhoods();
        this.updatePolygonCount();
      });

    performanceFolder
      .add(this.performanceSettings, 'polygonCount')
      .name('Total Polygons')
      .listen();

    performanceFolder
      .add(this.performanceSettings, 'lastRenderTime')
      .name('Last Frame (ms)')
      .listen();
  }

  /**
   * Count total polygons in all neighborhood meshes with detailed breakdown
   */
  private updatePolygonCount(): void {
    const polygonCounts = {
      houses: 0,
      cacti: 0,
      stones: 0,
      pools: 0,
      other: 0
    };

    // Count neighborhood polygons with detailed breakdown by component type
    this.neighborhoodMeshes.forEach(obj => {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry;
          let childPolygons = 0;

          if (geometry.index !== null) {
            childPolygons = geometry.index.count / 3;
          } else {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
              childPolygons = positionAttribute.count / 3;
            }
          }

          // Categorize by mesh/object name - check entire hierarchy
          const name = (child.name || '').toLowerCase();
          const parentName = (child.parent?.name || '').toLowerCase();
          const grandParentName = (child.parent?.parent?.name || '').toLowerCase();
          const greatGrandParentName = (child.parent?.parent?.parent?.name || '').toLowerCase();

          // Combine all names for easier checking
          const allNames = `${name} ${parentName} ${grandParentName} ${greatGrandParentName}`;

          // House-related patterns (most common, check first)
          if (allNames.includes('house') || allNames.includes('villa') ||
              allNames.includes('barn') || allNames.includes('townhouse') ||
              allNames.includes('desert')) {
            polygonCounts.houses += childPolygons;
          }
          // Cactus patterns
          else if (allNames.includes('cactus') || allNames.includes('saguaro') ||
                   allNames.includes('barrel') || allNames.includes('prickly') ||
                   allNames.includes('organ')) {
            polygonCounts.cacti += childPolygons;
          }
          // Stone patterns
          else if (allNames.includes('stone') || allNames.includes('rock')) {
            polygonCounts.stones += childPolygons;
          }
          // Pool patterns
          else if (allNames.includes('pool') || allNames.includes('water')) {
            polygonCounts.pools += childPolygons;
          }
          // Everything else
          else {
            polygonCounts.other += childPolygons;
          }
        }
      });
    });

    const totalPolygons = Object.values(polygonCounts).reduce((sum, count) => sum + count, 0);
    this.performanceSettings.polygonCount = Math.floor(totalPolygons);

    // Calculate percentages
    const percentages = {
      houses: ((polygonCounts.houses / totalPolygons) * 100).toFixed(1),
      cacti: ((polygonCounts.cacti / totalPolygons) * 100).toFixed(1),
      stones: ((polygonCounts.stones / totalPolygons) * 100).toFixed(1),
      pools: ((polygonCounts.pools / totalPolygons) * 100).toFixed(1),
      other: ((polygonCounts.other / totalPolygons) * 100).toFixed(1)
    };

    logger.info(`📊 Detailed Polygon Breakdown (LowPoly: ${this.isLowPoly}):`);
    logger.info(`  🏠 Houses: ${Math.floor(polygonCounts.houses).toLocaleString()} (${percentages.houses}%)`);
    logger.info(`  🌵 Cacti: ${Math.floor(polygonCounts.cacti).toLocaleString()} (${percentages.cacti}%)`);
    logger.info(`  🪨 Stones: ${Math.floor(polygonCounts.stones).toLocaleString()} (${percentages.stones}%)`);
    logger.info(`  🏊 Pools: ${Math.floor(polygonCounts.pools).toLocaleString()} (${percentages.pools}%)`);
    logger.info(`  ❓ Other: ${Math.floor(polygonCounts.other).toLocaleString()} (${percentages.other}%)`);
    logger.info(`  📊 TOTAL: ${this.performanceSettings.polygonCount.toLocaleString()} polygons`);

    // Update on-screen display if available
    if (this.performanceUI) {
      this.performanceUI.updateDisplay(polygonCounts as PolygonBreakdown);
    }
  }

  /**
   * Recreate all neighborhoods with current settings
   */
  private async recreateNeighborhoods(): Promise<void> {
    // Clear existing neighborhoods from TownWorkshop tracking
    this.clearNeighborhoods();

    // IMPORTANT: Clear all objects from HouseGroupCreator
    if (this.houseGroupCreator) {
      this.houseGroupCreator.clearAll();
    }

    // Update house group creator with current low-poly setting
    logger.debug(`🐛 Setting HouseGroupCreator to lowPoly: ${this.isLowPoly}`);
    this.houseGroupCreator.setLowPolyMode(this.isLowPoly);

    // Recreate with current low-poly setting
    await this.loadNeighborhoods(this.currentScene);

    logger.info(`✅ Neighborhoods recreated in ${this.isLowPoly ? 'Low-Poly' : 'High-Detail'} mode`);
  }

  /**
   * Clear all existing neighborhood meshes and labels with proper memory cleanup
   */
  private clearNeighborhoods(): void {
    logger.debug(
      `🧹 Clearing ${this.neighborhoodMeshes.length} neighborhood objects and ${this.labelMeshes.length} labels`
    );

    // Properly dispose neighborhood meshes using imported utility
    disposeObjects(this.neighborhoodMeshes);

    // Properly dispose label meshes using imported utility
    disposeObjects(this.labelMeshes);

    // Clear arrays
    this.neighborhoodMeshes.length = 0;
    this.labelMeshes.length = 0;

    logger.debug('✅ Neighborhood cleanup completed');
  }


  private async loadNeighborhoods(scene: THREE.Scene): Promise<void> {
    try {
      // Create a single neighborhood at the center with current settings
      const center = new THREE.Vector3(0, 0, 0);
      const houses = await this.houseGroupCreator.createMixedNeighborhood(
        center,
        this.neighborhoodSettings.houseCount,
        this.neighborhoodSettings.formation
      );

      // Track all house meshes
      this.neighborhoodMeshes.push(...houses);

      // Create label
      const label = createLabel(
        `${this.neighborhoodSettings.formation} (${this.neighborhoodSettings.houseCount} houses)`,
        new THREE.Vector3(0, 50, 0)
      );
      scene.add(label);
      this.labelMeshes.push(label);

      logger.info(
        `✅ Created ${this.neighborhoodSettings.formation} neighborhood with ${houses.length} houses`
      );
    } catch (error) {
      this.handleError(error as Error, 'loading neighborhood');
    }

    // Update polygon count
    this.updatePolygonCount();
  }


  private setupCamera(camera: THREE.Camera): void {
    const lookAt = new THREE.Vector3(0, 0, 0); // Center of town
    camera.position.set(0, 600, 800); // High aerial view for town overview
    camera.lookAt(lookAt);
  }

  public override dispose(): void {
    logger.debug(`🧹 Disposing ${this.config.name}`);

    // Remove on-screen controls using PerformanceUI
    if (this.performanceUI) {
      this.performanceUI.dispose();
    }

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Use proper cleanup method for neighborhood meshes
    this.clearNeighborhoods();

    // Dispose component registry
    if (this.componentRegistry) {
      this.componentRegistry.dispose();
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const townWorkshop = new TownWorkshop();

// Export in the expected format for the Stories system
const TownDemo = {
  load: async (options: StoryOptions) => {
    return townWorkshop.load(options);
  },
  dispose: () => {
    return townWorkshop.dispose();
  },
  getAppInfo: () => {
    return townWorkshop.getAppInfo();
  },
};

export default TownDemo;