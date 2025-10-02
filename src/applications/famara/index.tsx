import * as THREE from 'three';
import Environment, { LANZAROTE_TOWNS } from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Cessna } from '../../foundation/components/vehicles';
import { EngineFlyingBehavior } from '../../foundation/systems/behaviors/EngineFlyingBehavior';

/**
 * Famara Demo - Based on PhotoBooth but without paragliders
 * Focuses on the natural beauty of Famara beach area
 *
 * First app to use the new AppBase architecture!
 */
class FamaraApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private cessnaFlyingBehavior: EngineFlyingBehavior | undefined;

  constructor() {
    const appConfig = getAppConfig('famara');
    if (!appConfig) {
      throw new Error('Famara app not found in registry');
    }
    super({
      // Use metadata from app registry
      name: appConfig.name,
      description: appConfig.description,
      // App-specific configuration
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Fog handled by theme system
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 10000, // Log performance every 10 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      const { camera, scene, renderer, controls } = options;

      // Apply theme BEFORE loading environment to ensure visual consistency
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Position camera to showcase Famara beach area (no paragliders to focus on)
      const initialPos = new THREE.Vector3(4000, 1400, 3000);
      const lookAtPos = new THREE.Vector3(6500, 900, -400); // Look towards Famara beach

      // Set camera position and look at target
      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Initialize core systems from DemoBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from DemoBase
      await this.initializeEnvironment(options);

      const { terrain, water } = options;

      controls.enabled = true;

      // Apply landscape viewing controls for Famara beach exploration
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, ORBIT_CONTROLS_PRESETS['landscape']);

      // Hide canvas during loading to prevent visual pop-in
      const canvas = renderer.domElement;
      const originalOpacity = canvas.style.opacity;
      canvas.style.opacity = '0';

      // Render once with theme applied for terrain height calculations
      renderer.render(scene, camera);

      // Set up environment using theme
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0);

      // Add environment elements using theme
      await this.environment.addCloudsFromTheme(thermals, theme);


      // Create Lanzarote towns using the predefined configuration
      await this.environment.addTownsFromConfig(LANZAROTE_TOWNS, terrain);

      this.environment.addBoats(water);

      // Make environment available for theme switching
      options.environment = this.environment;

      // Add birds for more natural ambiance
      const birdPath = [
        new THREE.Vector3(5000, 1000, 0),
        new THREE.Vector3(6000, 1100, -500),
        new THREE.Vector3(7000, 1200, -1000),
        new THREE.Vector3(8000, 1000, -500),
        new THREE.Vector3(7000, 900, 0),
      ];
      await this.environment.addBirds(birdPath);

      // Add Cessna with engine-powered flight behavior
      await this.addCessna(scene, terrain);

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      // Restore canvas visibility after everything is loaded
      canvas.style.opacity = originalOpacity || '1';

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Add Cessna aircraft with autonomous flight behavior around the island
   */
  private async addCessna(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    try {
      // Create Cessna component
      const cessna = new Cessna({
        bodyColor: '#FFFACD', // Lemon chiffon (classic small plane color)
        scale: 3, // Scale up for visibility
        castShadow: true,
      });

      const cessnaMesh = await cessna.load();

      // Position Cessna at a nice starting point over Famara beach
      const startPosition = new THREE.Vector3(6000, 300, -500);
      cessnaMesh.position.copy(startPosition);

      // Add to scene
      scene.add(cessnaMesh);

      // Create engine flying behavior with terrain avoidance
      this.cessnaFlyingBehavior = new EngineFlyingBehavior({
        speed: 8.0, // Moderate cruise speed
        turnSpeed: 0.6,
        flightRadius: 2000, // Large radius for island tours
        cruiseAltitude: 250, // Fly at 250 units altitude
        minHeight: 150, // Don't go below 150
        maxHeight: 400, // Don't go above 400
        terrainClearance: 100, // Stay 100 units above terrain
        lookAheadDistance: 200, // Look ahead 200 units
        centerPoint: new THREE.Vector3(6500, 0, -400), // Center around Famara area
        obstacleAvoidanceDistance: 80,
        autoStart: true,
        faceDirection: true,
        forwardAxis: 'x', // Cessna points forward on X axis
        debugVectors: false,
      });

      // Attach behavior to Cessna
      this.cessnaFlyingBehavior.attachTo(cessnaMesh);
      this.cessnaFlyingBehavior.setTerrain(terrain);

      console.log('✈️  Cessna added with engine-powered flight behavior');
    } catch (error) {
      console.error('Failed to add Cessna:', error);
    }
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
        OrbitControlsHelper.update(controls);

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

    // Dispose Cessna flying behavior
    if (this.cessnaFlyingBehavior) {
      this.cessnaFlyingBehavior.dispose();
      this.cessnaFlyingBehavior = undefined;
    }

    // Dispose environment resources
    if (this.environment) {
      // Environment cleanup would go here if Environment had a dispose method
      this.environment = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const famaraApp = new FamaraApp();

// Export in the expected format for the Stories system
const Famara = {
  load: async (options: StoryOptions) => {
    return famaraApp.load(options);
  },
  dispose: () => {
    return famaraApp.dispose();
  },
  getAppInfo: () => {
    return famaraApp.getAppInfo();
  },
};

export default Famara;
