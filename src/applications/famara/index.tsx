import * as THREE from 'three';
import Environment from '../../shared/env/environment';
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

/**
 * Famara Demo - Based on PhotoBooth but without paragliders
 * Focuses on the natural beauty of Famara beach area
 *
 * First app to use the new AppBase architecture!
 */
class FamaraApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;

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
      // Initialize core systems from DemoBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from DemoBase
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      controls.enabled = true;

      // Apply theme to scene
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Position camera to showcase Famara beach area (no paragliders to focus on)
      const initialPos = new THREE.Vector3(4000, 1400, 3000);
      const lookAtPos = new THREE.Vector3(6500, 900, -400); // Look towards Famara beach

      // Set camera position and look at target
      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Apply landscape viewing controls for Famara beach exploration
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, ORBIT_CONTROLS_PRESETS['landscape']);

      // must render before adding env
      renderer.render(scene, camera);

      // Set up environment using theme
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0);

      // Add environment elements using theme
      await this.environment.addCloudsFromTheme(thermals, theme);
      this.environment.addTrees(terrain);
      this.environment.addHouses(terrain);
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

      // Add hang glider for variety (different from paragliders)
      // const hangGliderPath = [
      //   new THREE.Vector3(6000, 1500, -200),
      //   new THREE.Vector3(6200, 1400, -400),
      //   new THREE.Vector3(6400, 1300, -600),
      //   new THREE.Vector3(6600, 1200, -400),
      //   new THREE.Vector3(6400, 1100, -200),
      // ];
      // await this.environment.addHangGlider(hangGliderPath);

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
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
