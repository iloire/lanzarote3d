import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { TerrainBase } from '../../shared/TerrainBase';
import { ProceduralRoad } from '../../foundation/components/scenery/ProceduralRoad';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';

/**
 * Roads Demo - Showcases ProceduralRoad component on island terrain
 */
class RoadsApp extends TerrainBase {
  private animationId: number | undefined;
  private roads: ProceduralRoad[] = [];
  private roadMeshes: THREE.Object3D[] = [];
  private gui?: GUI;

  // Road configuration
  private roadConfig = {
    roadWidth: 6,
    segments: 100,
    roadColor: '#2C2C2C',
    lineColor: '#FFFF00',
    showCenterLine: true,
    showEdgeLines: true,
    roughness: 0.9,
    heightOffset: 5, // Higher offset for visibility on scaled island
  };

  constructor() {
    super({
      name: 'Roads Demo',
      description: 'Procedural road generation showcase on island terrain',
      requiredComponents: ['sky', 'water', 'terrain'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      await this.initializeEnvironment(options);
      const { camera, scene, renderer, controls, gui } = options;

      this.gui = gui;

      // Wait for terrain to be available
      if (!options.terrain) {
        console.error('❌ Terrain not available for roads demo');
        throw new Error('Terrain is required for roads demo');
      }

      console.log('🛣️ Creating procedural roads on island terrain...');

      // Create multiple demo roads
      await this.createDemoRoads(scene, options.terrain);

      // Set camera to view the roads from above
      camera.position.set(-3000, 2000, 5000);

      // Enable orbit controls for navigation
      controls.enabled = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;

      // Set control boundaries
      controls.minDistance = 200;
      controls.maxDistance = 20000;
      controls.maxPolarAngle = Math.PI * 0.8;
      controls.minPolarAngle = Math.PI * 0.1;

      // Center view on road area
      controls.target.set(-2000, 0, 2000);
      controls.update();

      // Setup GUI controls
      this.setupGUI(scene, options.terrain);

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.roads.length} roads`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Create demo roads on the island terrain
   */
  private async createDemoRoads(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    // Road 1: Winding coastal road
    const coastalRoad = new ProceduralRoad({
      controlPoints: [
        new THREE.Vector3(-4000, 0, 1000),
        new THREE.Vector3(-3000, 0, 2000),
        new THREE.Vector3(-2000, 0, 2500),
        new THREE.Vector3(-1000, 0, 2300),
        new THREE.Vector3(0, 0, 2000),
        new THREE.Vector3(1000, 0, 1500),
      ],
      terrain,
      width: this.roadConfig.roadWidth,
      segments: this.roadConfig.segments,
      roadColor: this.roadConfig.roadColor,
      lineColor: this.roadConfig.lineColor,
      showCenterLine: this.roadConfig.showCenterLine,
      showEdgeLines: this.roadConfig.showEdgeLines,
      roughness: this.roadConfig.roughness,
      heightOffset: this.roadConfig.heightOffset,
    });

    const coastalRoadMesh = await coastalRoad.load();
    scene.add(coastalRoadMesh);
    this.roads.push(coastalRoad);
    this.roadMeshes.push(coastalRoadMesh);

    // Road 2: Mountain pass
    const mountainRoad = new ProceduralRoad({
      controlPoints: [
        new THREE.Vector3(-2000, 0, 3500),
        new THREE.Vector3(-1500, 0, 3000),
        new THREE.Vector3(-1000, 0, 2800),
        new THREE.Vector3(-500, 0, 3200),
        new THREE.Vector3(0, 0, 3500),
        new THREE.Vector3(500, 0, 3800),
      ],
      terrain,
      width: this.roadConfig.roadWidth * 0.8, // Narrower mountain road
      segments: this.roadConfig.segments,
      roadColor: this.roadConfig.roadColor,
      lineColor: this.roadConfig.lineColor,
      showCenterLine: this.roadConfig.showCenterLine,
      showEdgeLines: this.roadConfig.showEdgeLines,
      roughness: this.roadConfig.roughness,
      heightOffset: this.roadConfig.heightOffset,
    });

    const mountainRoadMesh = await mountainRoad.load();
    scene.add(mountainRoadMesh);
    this.roads.push(mountainRoad);
    this.roadMeshes.push(mountainRoadMesh);

    // Road 3: Straight highway
    const highway = new ProceduralRoad({
      controlPoints: [
        new THREE.Vector3(-3500, 0, 500),
        new THREE.Vector3(-2500, 0, 700),
        new THREE.Vector3(-1500, 0, 750),
        new THREE.Vector3(-500, 0, 800),
        new THREE.Vector3(500, 0, 750),
      ],
      terrain,
      width: this.roadConfig.roadWidth * 1.2, // Wider highway
      segments: this.roadConfig.segments,
      roadColor: this.roadConfig.roadColor,
      lineColor: '#FFFFFF', // White lines for highway
      showCenterLine: this.roadConfig.showCenterLine,
      showEdgeLines: this.roadConfig.showEdgeLines,
      roughness: this.roadConfig.roughness,
      heightOffset: this.roadConfig.heightOffset,
    });

    const highwayMesh = await highway.load();
    scene.add(highwayMesh);
    this.roads.push(highway);
    this.roadMeshes.push(highwayMesh);

    // Road 4: Serpentine descent
    const serpentineRoad = new ProceduralRoad({
      controlPoints: [
        new THREE.Vector3(-1000, 0, 4000),
        new THREE.Vector3(-800, 0, 3500),
        new THREE.Vector3(-1200, 0, 3000),
        new THREE.Vector3(-900, 0, 2500),
        new THREE.Vector3(-1300, 0, 2000),
        new THREE.Vector3(-1000, 0, 1500),
      ],
      terrain,
      width: this.roadConfig.roadWidth,
      segments: this.roadConfig.segments * 1.5, // More segments for tight curves
      roadColor: this.roadConfig.roadColor,
      lineColor: this.roadConfig.lineColor,
      showCenterLine: this.roadConfig.showCenterLine,
      showEdgeLines: this.roadConfig.showEdgeLines,
      roughness: this.roadConfig.roughness,
      heightOffset: this.roadConfig.heightOffset,
      tension: 0.3, // Tighter curves
    });

    const serpentineMesh = await serpentineRoad.load();
    scene.add(serpentineMesh);
    this.roads.push(serpentineRoad);
    this.roadMeshes.push(serpentineMesh);

    console.log(`✅ Created ${this.roads.length} demo roads on island terrain`);
  }

  /**
   * Setup GUI controls for road customization
   */
  private setupGUI(scene: THREE.Scene, terrain: THREE.Mesh): void {
    if (!this.gui) return;

    const roadFolder = this.gui.addFolder('Road Settings');

    roadFolder.add(this.roadConfig, 'roadWidth', 20, 15).name('Road Width').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.add(this.roadConfig, 'segments', 50, 300).step(10).name('Segments').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.addColor(this.roadConfig, 'roadColor').name('Road Color').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.addColor(this.roadConfig, 'lineColor').name('Line Color').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.add(this.roadConfig, 'showCenterLine').name('Center Line').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.add(this.roadConfig, 'showEdgeLines').name('Edge Lines').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.add(this.roadConfig, 'roughness', 0, 1).name('Roughness').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.add(this.roadConfig, 'heightOffset', 0, 2).name('Height Offset').onChange(() => {
      this.recreateRoads(scene, terrain);
    });

    roadFolder.open();

    // Info display
    const infoFolder = this.gui.addFolder('Road Info');
    const info = {
      totalRoads: this.roads.length,
      totalLength: this.getTotalRoadLength(),
    };

    infoFolder.add(info, 'totalRoads').name('Total Roads').listen();
    infoFolder.add(info, 'totalLength').name('Total Length (m)').listen();
    infoFolder.open();
  }

  /**
   * Recreate all roads with new settings
   */
  private async recreateRoads(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    // Remove existing roads
    this.roadMeshes.forEach(mesh => {
      scene.remove(mesh);
    });

    // Dispose roads
    this.roads.forEach(road => road.dispose());
    this.roads = [];
    this.roadMeshes = [];

    // Recreate with new settings
    await this.createDemoRoads(scene, terrain);
  }

  /**
   * Calculate total length of all roads
   */
  private getTotalRoadLength(): number {
    let total = 0;
    for (const road of this.roads) {
      const info = road.getInfo();
      total += info.roadLength || 0;
    }
    return Math.round(total);
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls
  ): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Update controls for damping
        controls.update();

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Dispose roads
    this.roads.forEach(road => road.dispose());
    this.roads = [];
    this.roadMeshes = [];

    super.dispose();
  }
}

const roadsApp = new RoadsApp();

const Roads = {
  load: async (options: StoryOptions) => {
    return roadsApp.load(options);
  },
  dispose: () => {
    return roadsApp.dispose();
  },
  getAppInfo: () => {
    return roadsApp.getAppInfo();
  },
};

export default Roads;
