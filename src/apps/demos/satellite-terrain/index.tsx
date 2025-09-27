import * as THREE from 'three';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import SatelliteThemes from '../../../foundation/utils/satellite-themes';

/**
 * Satellite Terrain Demo - Showcases realistic terrain with satellite imagery
 *
 * Features:
 * - Real satellite imagery textures overlaid on 3D terrain
 * - Multiple satellite theme variations (basic, enhanced, hybrid)
 * - Interactive theme switching via keyboard controls
 * - Proper UV mapping for geographic accuracy
 * - Performance-optimized static tile system
 *
 * Controls:
 * - 1, 2, 3, 4: Switch between different satellite themes
 * - 5: Toggle back to default wireframe theme
 * - Mouse: Orbit, zoom, pan controls
 */
class SatelliteTerrainApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private currentThemeIndex = 0;
  private availableThemes: any[] = [];
  private uiContainer: HTMLElement | undefined;

  constructor() {
    const appConfig = getAppConfig('satellite-terrain');
    super({
      name: appConfig?.name || 'Satellite Terrain',
      description: appConfig?.description || 'Interactive demonstration of satellite imagery on 3D terrain with real-time theme switching',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Clear visibility for satellite imagery
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000,
      },
    });

    // Initialize available satellite themes
    this.availableThemes = [
      {
        name: 'Basic Satellite',
        theme: SatelliteThemes.createLanzaroteSatelliteTheme(),
        description: 'Standard satellite imagery'
      },
      {
        name: 'Enhanced Satellite',
        theme: SatelliteThemes.createEnhancedSatelliteTheme(),
        description: 'High-contrast enhanced imagery'
      },
      {
        name: 'Hybrid Satellite',
        theme: SatelliteThemes.createHybridSatelliteTheme(),
        description: 'Blended satellite with custom materials'
      },
      {
        name: 'Test Satellite',
        theme: SatelliteThemes.createTestSatelliteTheme(),
        description: 'Development/testing theme'
      },
      {
        name: 'Default Wireframe',
        theme: getDefaultTheme(),
        description: 'Original wireframe terrain'
      }
    ];
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      controls.enabled = true;

      // Set optimal camera position for satellite terrain viewing
      const initialPos = new THREE.Vector3(8000, 4000, 2000);
      const lookAtPos = new THREE.Vector3(0, 0, 0); // Center of terrain

      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Configure controls for terrain exploration
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, {
        ...ORBIT_CONTROLS_PRESETS['aerial'],
        maxDistance: 15000,
        minDistance: 500,
        maxPolarAngle: Math.PI * 0.48, // Limit to prevent underground viewing
      });

      // Apply initial satellite theme
      const initialTheme = this.availableThemes[0].theme;
      await this.applyThemeWithIslandSupport(options, initialTheme);

      // Initial render
      renderer.render(scene, camera);

      // Set up minimal environment for better satellite imagery visibility
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(initialTheme);

      // Add minimal environment elements to not distract from terrain
      this.environment.addTrees(terrain); // Trees for context
      this.environment.addHouses(terrain); // Houses for scale reference

      options.environment = this.environment;

      // Create UI for theme switching
      this.createThemeUI();

      // Set up keyboard controls
      this.setupControls(options);

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
      console.log('🎮 Controls: Press 1-5 to switch themes, mouse to navigate');
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async applyThemeWithIslandSupport(options: StoryOptions, theme: any): Promise<void> {
    // Apply theme with special handling for satellite imagery
    await ThemeEngine.apply(options, theme);

    // Additional handling for Island component if needed
    if (theme.style === 'satellite' && options.terrainInstance) {
      try {
        await options.terrainInstance.applyTheme(theme.terrain || theme);
      } catch (error) {
        console.warn('Failed to apply satellite theme to terrain, using fallback:', error);
      }
    }
  }

  private createThemeUI(): void {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-width: 300px;
      line-height: 1.4;
    `;

    this.updateThemeUI();
    document.body.appendChild(this.uiContainer);
  }

  private updateThemeUI(): void {
    if (!this.uiContainer) return;

    const currentTheme = this.availableThemes[this.currentThemeIndex];

    this.uiContainer.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #4fc3f7;">🛰️ Satellite Terrain Demo</h3>
      <div style="margin-bottom: 10px;">
        <strong>Current Theme:</strong> ${currentTheme.name}<br>
        <em>${currentTheme.description}</em>
      </div>
      <div style="margin-bottom: 10px; border-top: 1px solid #555; padding-top: 10px;">
        <strong>Controls:</strong><br>
        ${this.availableThemes.map((theme, index) =>
          `${index + 1}: ${theme.name}${index === this.currentThemeIndex ? ' ★' : ''}`
        ).join('<br>')}
      </div>
      <div style="border-top: 1px solid #555; padding-top: 10px; font-size: 11px; color: #ccc;">
        Mouse: Orbit/Zoom/Pan<br>
        Satellite imagery demonstrates real-world terrain texturing
      </div>
    `;
  }

  private setupControls(options: StoryOptions): void {
    const onKeyDown = async (event: KeyboardEvent) => {
      const key = event.key;
      const themeIndex = parseInt(key) - 1;

      if (themeIndex >= 0 && themeIndex < this.availableThemes.length) {
        this.currentThemeIndex = themeIndex;
        const selectedTheme = this.availableThemes[themeIndex];

        console.log(`🎨 Switching to theme: ${selectedTheme.name}`);

        try {
          await this.applyThemeWithIslandSupport(options, selectedTheme.theme);
          this.updateThemeUI();
          console.log(`✅ Theme applied: ${selectedTheme.name}`);
        } catch (error) {
          console.error(`❌ Failed to apply theme ${selectedTheme.name}:`, error);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any
  ): void {
    const animate = () => {
      try {
        this.updatePerformance();
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

    // Remove UI
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
      this.uiContainer = undefined;
    }

    // Dispose environment
    if (this.environment) {
      this.environment = undefined;
    }

    super.dispose();
  }
}

// Create singleton instance
const satelliteTerrainApp = new SatelliteTerrainApp();

// Export in the expected format for the Stories system
const SatelliteTerrain = {
  load: async (options: StoryOptions) => {
    return satelliteTerrainApp.load(options);
  },
  dispose: () => {
    return satelliteTerrainApp.dispose();
  },
  getAppInfo: () => {
    return satelliteTerrainApp.getAppInfo();
  },
};

export default SatelliteTerrain;