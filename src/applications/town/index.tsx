import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { HouseGroupCreator } from '../../shared/env/house-group-creator';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { createLabel } from './label-utils';
import { TOWN_NEIGHBORHOODS, NeighborhoodConfig } from './neighborhoods-data';
import { PerformanceUI, PerformanceSettings, PolygonBreakdown } from './performance-ui';
import { disposeObject3D, disposeObjects } from './disposal-utils';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';
import { Park, TownSquare } from '../../foundation/components/scenery';

/**
 * Town Workshop - Showcase of neighborhood generation using HouseGroupCreator
 * Demonstrates different neighborhood formations and house distributions
 */
class TownWorkshop extends WorkshopDemoBase {
  private neighborhoodMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Mesh[] = [];
  private roadMeshes: THREE.Object3D[] = []; // Track roads separately
  private parkMeshes: THREE.Object3D[] = []; // Track parks separately
  private squareMeshes: THREE.Object3D[] = []; // Track town squares separately
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

      // Define exclusion zones for town squares and parks to prevent building overlap
      const exclusionZones = [
        // Central Square - 120x120 size, so radius ~85 (diagonal/2 + buffer)
        { center: new THREE.Vector3(0, 0, 0), radius: 100 },
        // West Square - 120x120 size
        { center: new THREE.Vector3(-600, 0, 0), radius: 100 },
        // Market Square - 120x120 size
        { center: new THREE.Vector3(600, 0, -300), radius: 100 },
        // North Central Park - 100x100 size
        { center: new THREE.Vector3(-200, 0, 300), radius: 85 },
        // South Central Park - 100x100 size
        { center: new THREE.Vector3(200, 0, -300), radius: 85 },
        // East Park - 100x100 size
        { center: new THREE.Vector3(600, 0, 300), radius: 85 },
      ];

      // Set exclusion zones before creating neighborhoods
      this.houseGroupCreator.setExclusionZones(exclusionZones);

      // Setup performance controls
      this.setupPerformanceControls(gui);

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
   * Setup performance controls and monitoring
   */
  private setupPerformanceControls(gui: GUI): void {
    logger.debug('🐛 Setting up performance controls, GUI:', gui);

    if (!gui) {
      logger.warn('⚠️ No GUI provided to setupPerformanceControls');
      return;
    }

    const performanceFolder = gui.addFolder('Performance Settings');
    performanceFolder.open();

    logger.debug('✅ Performance folder created successfully');

    // Low-poly toggle
    performanceFolder
      .add(this.performanceSettings, 'lowPoly')
      .name('Low-Poly Mode')
      .onChange(async (value: boolean) => {
        this.isLowPoly = value;
        logger.info(`🔄 Switching to ${value ? 'Low-Poly' : 'High-Detail'} mode...`);
        await this.recreateNeighborhoods();
        this.updatePolygonCount();
      });

    // Polygon count display (read-only)
    performanceFolder
      .add(this.performanceSettings, 'polygonCount')
      .name('Total Polygons')
      .listen();

    // Render time display (read-only)
    performanceFolder
      .add(this.performanceSettings, 'lastRenderTime')
      .name('Last Frame (ms)')
      .listen();
  }

  /**
   * Count total polygons in all neighborhood meshes, parks, squares, and roads with detailed breakdown
   */
  private updatePolygonCount(): void {
    const polygonCounts = {
      houses: 0,
      cacti: 0,
      stones: 0,
      pools: 0,
      roads: 0,
      parks: 0,
      squares: 0,
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

    // Count road polygons (infrastructure that doesn't change)
    this.roadMeshes.forEach(obj => {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry;
          if (geometry.index !== null) {
            polygonCounts.roads += geometry.index.count / 3;
          } else {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
              polygonCounts.roads += positionAttribute.count / 3;
            }
          }
        }
      });
    });

    // Count park polygons
    this.parkMeshes.forEach(obj => {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry;
          if (geometry.index !== null) {
            polygonCounts.parks += geometry.index.count / 3;
          } else {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
              polygonCounts.parks += positionAttribute.count / 3;
            }
          }
        }
      });
    });

    // Count town square polygons
    this.squareMeshes.forEach(obj => {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry;
          if (geometry.index !== null) {
            polygonCounts.squares += geometry.index.count / 3;
          } else {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
              polygonCounts.squares += positionAttribute.count / 3;
            }
          }
        }
      });
    });

    const totalPolygons = Object.values(polygonCounts).reduce((sum, count) => sum + count, 0);
    this.performanceSettings.polygonCount = Math.floor(totalPolygons);

    // Debug: Log array sizes to diagnose zero counts
    logger.debug(`📊 Array sizes: neighborhoods=${this.neighborhoodMeshes.length}, parks=${this.parkMeshes.length}, squares=${this.squareMeshes.length}, roads=${this.roadMeshes.length}`);

    // Calculate percentages
    const percentages = {
      houses: ((polygonCounts.houses / totalPolygons) * 100).toFixed(1),
      cacti: ((polygonCounts.cacti / totalPolygons) * 100).toFixed(1),
      stones: ((polygonCounts.stones / totalPolygons) * 100).toFixed(1),
      pools: ((polygonCounts.pools / totalPolygons) * 100).toFixed(1),
      roads: ((polygonCounts.roads / totalPolygons) * 100).toFixed(1),
      parks: ((polygonCounts.parks / totalPolygons) * 100).toFixed(1),
      squares: ((polygonCounts.squares / totalPolygons) * 100).toFixed(1),
      other: ((polygonCounts.other / totalPolygons) * 100).toFixed(1)
    };

    logger.info(`📊 Detailed Polygon Breakdown (LowPoly: ${this.isLowPoly}):`);
    logger.info(`  🏠 Houses: ${Math.floor(polygonCounts.houses).toLocaleString()} (${percentages.houses}%)`);
    logger.info(`  🌵 Cacti: ${Math.floor(polygonCounts.cacti).toLocaleString()} (${percentages.cacti}%)`);
    logger.info(`  🪨 Stones: ${Math.floor(polygonCounts.stones).toLocaleString()} (${percentages.stones}%)`);
    logger.info(`  🏊 Pools: ${Math.floor(polygonCounts.pools).toLocaleString()} (${percentages.pools}%)`);
    logger.info(`  🛣️ Roads: ${Math.floor(polygonCounts.roads).toLocaleString()} (${percentages.roads}%)`);
    logger.info(`  🌳 Parks: ${Math.floor(polygonCounts.parks).toLocaleString()} (${percentages.parks}%) [${this.parkMeshes.length} parks]`);
    logger.info(`  🏛️ Squares: ${Math.floor(polygonCounts.squares).toLocaleString()} (${percentages.squares}%) [${this.squareMeshes.length} squares]`);
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
   * Clear all existing neighborhood meshes, parks, squares, and labels with proper memory cleanup
   */
  private clearNeighborhoods(): void {
    logger.debug(`🧹 Clearing ${this.neighborhoodMeshes.length} neighborhood objects, ${this.labelMeshes.length} labels, ${this.roadMeshes.length} roads, ${this.parkMeshes.length} parks, and ${this.squareMeshes.length} squares`);

    // Properly dispose neighborhood meshes using imported utility
    disposeObjects(this.neighborhoodMeshes);

    // Properly dispose label meshes using imported utility
    disposeObjects(this.labelMeshes);

    // Properly dispose road meshes using imported utility
    disposeObjects(this.roadMeshes);

    // Properly dispose park meshes using imported utility
    disposeObjects(this.parkMeshes);

    // Properly dispose square meshes using imported utility
    disposeObjects(this.squareMeshes);

    // Clear arrays
    this.neighborhoodMeshes.length = 0;
    this.labelMeshes.length = 0;
    this.roadMeshes.length = 0;
    this.parkMeshes.length = 0;
    this.squareMeshes.length = 0;

    logger.debug('✅ Neighborhood cleanup completed');
  }


  private async loadNeighborhoods(scene: THREE.Scene): Promise<void> {
    // Create each neighborhood using imported configuration
    for (const config of TOWN_NEIGHBORHOODS) {
      try {
        let houses: THREE.Object3D[] = [];

        switch (config.type) {
          case 'suburban':
            houses = await this.houseGroupCreator.createSuburbanNeighborhood(
              config.center,
              config.size || 'medium',
              config.variation
            );
            break;

          case 'urban':
            houses = await this.houseGroupCreator.createUrbanNeighborhood(
              config.center,
              config.density || 'dense',
              config.variation
            );
            break;

          case 'rural':
            houses = await this.houseGroupCreator.createRuralNeighborhood(
              config.center,
              config.style || 'village',
              config.variation
            );
            break;

          case 'cul-de-sac':
            const culDeSacHouses = this.generateMixedHouses(config.houses || 8);
            houses = await this.houseGroupCreator.createCulDeSac(
              config.center,
              culDeSacHouses
            );
            break;

          case 'street':
            const streetHouses = this.generateMixedHouses(config.houses || 12);
            houses = await this.houseGroupCreator.createStreetNeighborhood(
              config.center,
              streetHouses
            );
            break;

          case 'grid':
            const gridHouses = this.generateMixedHouses(config.houses || 15);
            houses = await this.houseGroupCreator.createGridNeighborhood(
              config.center,
              gridHouses,
              80,
              3
            );
            break;

          case 'luxury':
            houses = await this.houseGroupCreator.createMixedNeighborhood(
              config.center,
              12,
              'suburban',
              {
                'Villa': 0.4,
                'DesertHouseWithPool': 0.3,
                'House': 0.2,
                'Townhouse': 0.1,
              },
              config.variation
            );
            break;

          case 'random':
            const randomHouses = this.generateMixedHouses(config.houses || 18);
            houses = await this.houseGroupCreator.createRandomNeighborhood(
              config.center,
              randomHouses,
              250
            );
            break;

          default:
            logger.warn(`Unknown neighborhood type: ${config.type}`);
            continue;
        }

        // Track all house meshes
        this.neighborhoodMeshes.push(...houses);

        // Create label for this neighborhood
        const label = createLabel(config.name, config.center);
        scene.add(label);
        this.labelMeshes.push(label);

        logger.info(`✅ Created ${config.name} with ${houses.length} houses`);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.name}`);
      }
    }

    // Add roads and infrastructure
    this.createRoads(scene);

    // Add parks to the town
    this.createParks(scene);

    // Add town squares to the town
    this.createTownSquares(scene);

    // Update polygon count after loading all neighborhoods
    this.updatePolygonCount();
  }

  /**
   * Generate a land plot for a house based on type and scale
   */
  private generateLandPlot(houseType: string, scale: number) {
    const baseWidths: Record<string, number> = {
      'House': 60,
      'Villa': 100,
      'Townhouse': 50,
      'Barn': 80,
      'DesertHouse': 70,
      'DesertHouseWithPool': 90,
    };

    const baseDepths: Record<string, number> = {
      'House': 60,
      'Villa': 90,
      'Townhouse': 70,
      'Barn': 100,
      'DesertHouse': 80,
      'DesertHouseWithPool': 100,
    };

    const landColors = ['#7CFC00', '#90EE90', '#98FB98', '#ADFF2F', '#9ACD32'];

    // Add some random variation to land plot size
    const widthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
    const depthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation

    return {
      width: Math.max(40, (baseWidths[houseType] || 60) * scale * widthVariation),
      depth: Math.max(40, (baseDepths[houseType] || 60) * scale * depthVariation),
      color: landColors[Math.floor(Math.random() * landColors.length)],
    };
  }

  /**
   * Generate a mixed set of houses for custom neighborhoods
   */
  private generateMixedHouses(count: number) {
    const houses = [];
    const houseTypes = [
      { type: 'House' as const, weight: 0.4 },
      { type: 'Villa' as const, weight: 0.15 },
      { type: 'Townhouse' as const, weight: 0.15 },
      { type: 'Barn' as const, weight: 0.1 },
      { type: 'DesertHouse' as const, weight: 0.1 },
      { type: 'DesertHouseWithPool' as const, weight: 0.05 },
    ];

    for (let i = 0; i < count; i++) {
      const totalWeight = houseTypes.reduce((sum, t) => sum + t.weight, 0);
      const random = Math.random() * totalWeight;
      let accumulated = 0;
      let selectedType = houseTypes[0].type;

      for (const typeOption of houseTypes) {
        accumulated += typeOption.weight;
        if (random <= accumulated) {
          selectedType = typeOption.type;
          break;
        }
      }

      // Generate 90-degree increment rotation
      const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];

      const scale = 0.8 + Math.random() * 0.4;

      // Generate land plot based on house type and scale
      const landPlot = this.generateLandPlot(selectedType, scale);

      houses.push({
        type: selectedType,
        scale,
        includePool: Math.random() < 0.3,
        rotation,
        landPlot,
      });
    }

    return houses;
  }

  /**
   * Create roads and pathways between neighborhoods
   */
  private createRoads(scene: THREE.Scene): void {
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });

    // Main horizontal road
    const mainRoadGeometry = new THREE.PlaneGeometry(1600, 40);
    const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.1, 0);
    scene.add(mainRoad);

    // Vertical connecting roads
    const verticalRoadGeometry = new THREE.PlaneGeometry(40, 600);

    const leftRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-400, 0.1, 0);
    scene.add(leftRoad);

    const centerRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    centerRoad.rotation.x = -Math.PI / 2;
    centerRoad.position.set(0, 0.1, 0);
    scene.add(centerRoad);

    const rightRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(400, 0.1, 0);
    scene.add(rightRoad);

    // Road markings
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
    });

    // Road markings are now handled above with proper tracking

    // Track roads separately so they can be properly disposed
    this.roadMeshes.push(mainRoad, leftRoad, centerRoad, rightRoad);

    // Also add road markings to tracking
    const markings: THREE.Mesh[] = [];

    // Dashed lines for main road
    for (let i = -15; i <= 15; i++) {
      if (i % 2 === 0) continue; // Create dashed effect
      const marking = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 2),
        markingMaterial
      );
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(i * 50, 0.11, 0);
      scene.add(marking);
      markings.push(marking);
    }

    // Add markings to road tracking
    this.roadMeshes.push(...markings);
  }

  /**
   * Create parks throughout the town
   */
  private async createParks(scene: THREE.Scene): Promise<void> {
    // Strategic park positions across the town
    const parkLocations = [
      { position: new THREE.Vector3(-200, 0, 300), name: 'North Central Park' },
      { position: new THREE.Vector3(200, 0, -300), name: 'South Central Park' },
      { position: new THREE.Vector3(600, 0, 300), name: 'East Park' },
    ];

    for (const location of parkLocations) {
      try {
        const park = new Park({
          size: { width: 100, depth: 100 },
          grassColor: '#4A7C59',
          pathColor: '#8B7355',
          treeCount: 10,
          benchCount: 6,
          hasFountain: true,
          scale: 1,
        });

        const parkMesh = await park.load();
        parkMesh.position.copy(location.position);
        scene.add(parkMesh);
        this.parkMeshes.push(parkMesh);

        logger.info(`✅ Created ${location.name}`);
      } catch (error) {
        this.handleError(error as Error, `creating park at ${location.position.toArray()}`);
      }
    }
  }

  /**
   * Create town squares throughout the town
   */
  private async createTownSquares(scene: THREE.Scene): Promise<void> {
    // Strategic town square positions
    const squareLocations = [
      { position: new THREE.Vector3(0, 0, 0), name: 'Central Square', monument: 'fountain' as const },
      { position: new THREE.Vector3(-600, 0, 0), name: 'West Square', monument: 'obelisk' as const },
      { position: new THREE.Vector3(600, 0, -300), name: 'Market Square', monument: 'statue' as const },
    ];

    for (const location of squareLocations) {
      try {
        const square = new TownSquare({
          size: { width: 120, depth: 120 },
          pavingColor: '#A8A8A8',
          monumentType: location.monument,
          benchCount: 8,
          hasFlowerBeds: true,
          hasLampPosts: true,
          scale: 1,
        });

        const squareMesh = await square.load();
        squareMesh.position.copy(location.position);
        scene.add(squareMesh);
        this.squareMeshes.push(squareMesh);

        logger.info(`✅ Created ${location.name} with ${location.monument}`);
      } catch (error) {
        this.handleError(error as Error, `creating town square at ${location.position.toArray()}`);
      }
    }
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