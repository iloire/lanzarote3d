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
import SatelliteThemes from '../../foundation/utils/satellite-themes';
import { Theme } from '../../foundation/types/Theme';

interface ThemeOption {
  name: string;
  theme: Theme;
  description: string;
}

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
  private availableThemes: ThemeOption[] = [];
  private uiContainer: HTMLElement | undefined;
  private debugUI: HTMLElement | undefined;

  // Debug parameters for texture alignment
  private debugParams = {
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
  };

  constructor() {
    const appConfig = getAppConfig('satellite-terrain');
    super({
      name: appConfig?.name || 'Satellite Terrain',
      description:
        appConfig?.description ||
        'Interactive demonstration of satellite imagery on 3D terrain with real-time theme switching',
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
      ...SatelliteThemes.getAllThemes(),
      {
        name: 'Default Wireframe',
        theme: getDefaultTheme(),
        description: 'Original wireframe terrain',
      },
    ];
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      controls.enabled = true;

      // Set perfect top-down north-facing view for satellite mapping
      // Position camera VERY high above terrain center, looking straight down
      const initialPos = new THREE.Vector3(0, 50000, 0); // VERY high altitude for full island overview
      const lookAtPos = new THREE.Vector3(0, 0, 0); // Look at terrain center

      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Configure controls with NO BOUNDARIES for free navigation
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, {
        ...ORBIT_CONTROLS_PRESETS['aerial'],
        maxDistance: Infinity, // No maximum zoom out limit
        minDistance: 100, // Keep minimum to prevent going underground
        maxPolarAngle: Math.PI, // Allow full rotation
        minPolarAngle: 0, // Allow full rotation
      });

      console.log('📍 Satellite Terrain: Perfect top-down north-facing view');
      console.log(`  Camera position: (${initialPos.x}, ${initialPos.y}, ${initialPos.z})`);
      console.log(`  Looking at: (${lookAtPos.x}, ${lookAtPos.y}, ${lookAtPos.z})`);
      console.log('🧭 North = +Z direction, perfect for satellite texture mapping');

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

      // Create debug UI for texture alignment
      this.createDebugUI();

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

  private async applyThemeWithIslandSupport(options: StoryOptions, theme: Theme): Promise<void> {
    // Apply theme with special handling for satellite imagery
    await ThemeEngine.apply(options, theme);

    // Additional handling for Island component if needed
    if (theme.terrain?.style === 'satellite' && options.terrainInstance) {
      try {
        await options.terrainInstance.applyTheme(theme.terrain);
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
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 900;
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
        ${this.availableThemes
          .map(
            (theme, index) =>
              `${index + 1}: ${theme.name}${index === this.currentThemeIndex ? ' ★' : ''}`
          )
          .join('<br>')}
      </div>
      <div style="border-top: 1px solid #555; padding-top: 10px; font-size: 11px; color: #ccc;">
        Mouse: Orbit/Zoom/Pan<br>
        Satellite imagery demonstrates real-world terrain texturing
      </div>
    `;
  }

  private setupControls(options: StoryOptions): void {
    const onKeyDown = async (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const themeIndex = parseInt(event.key) - 1;

      // Handle theme switching
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
        return;
      }

      // Handle debug controls
      const step = 0.1;
      let updated = false;

      switch (key) {
        case 'w': // Move North
          this.debugParams.offsetY += step;
          updated = true;
          console.log('🔧 Moved texture North');
          break;
        case 's': // Move South
          this.debugParams.offsetY -= step;
          updated = true;
          console.log('🔧 Moved texture South');
          break;
        case 'a': // Move West
          this.debugParams.offsetX -= step;
          updated = true;
          console.log('🔧 Moved texture West');
          break;
        case 'd': // Move East
          this.debugParams.offsetX += step;
          updated = true;
          console.log('🔧 Moved texture East');
          break;
        case 'q': // Scale up
          this.debugParams.scaleX += 0.1;
          this.debugParams.scaleY += 0.1;
          updated = true;
          console.log('🔧 Scaled texture up');
          break;
        case 'e': // Scale down
          this.debugParams.scaleX = Math.max(0.1, this.debugParams.scaleX - 0.1);
          this.debugParams.scaleY = Math.max(0.1, this.debugParams.scaleY - 0.1);
          updated = true;
          console.log('🔧 Scaled texture down');
          break;
        case 'z': // Rotate left
          this.debugParams.rotation -= 15;
          updated = true;
          console.log('🔧 Rotated texture left');
          break;
        case 'x': // Rotate right
          this.debugParams.rotation += 15;
          updated = true;
          console.log('🔧 Rotated texture right');
          break;
        case 'f': // Flip horizontally
          this.debugParams.flipX = !this.debugParams.flipX;
          updated = true;
          console.log(`🔧 Flipped texture horizontally: ${this.debugParams.flipX ? 'ON' : 'OFF'}`);
          break;
        case 'g': // Flip vertically
          this.debugParams.flipY = !this.debugParams.flipY;
          updated = true;
          console.log(`🔧 Flipped texture vertically: ${this.debugParams.flipY ? 'ON' : 'OFF'}`);
          break;
        case 'r': // Reset
          this.debugParams = {
            offsetX: 0,
            offsetY: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            flipX: false,
            flipY: false,
          };
          updated = true;
          console.log('🔧 Reset all texture adjustments');
          break;
      }

      if (updated) {
        this.updateDebugUI();
        await this.reapplyCurrentTexture(options);
      }
    };

    window.addEventListener('keydown', onKeyDown);
  }

  private createDebugUI(): void {
    this.debugUI = document.createElement('div');
    this.debugUI.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-width: 300px;
    `;

    this.debugUI.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">🔧 TEXTURE DEBUG CONTROLS</div>
      <div style="font-size: 11px; color: #ccc; margin-bottom: 15px;">
        Use these keys to fix texture alignment:
      </div>

      <div style="margin-bottom: 8px;"><strong>MOVEMENT:</strong></div>
      <div style="margin-bottom: 8px; font-size: 11px;">
        W/S: Move North/South<br>
        A/D: Move West/East<br>
        Q/E: Scale up/down<br>
        R: Reset all adjustments
      </div>

      <div style="margin-bottom: 8px;"><strong>ROTATION:</strong></div>
      <div style="margin-bottom: 8px; font-size: 11px;">
        Z/X: Rotate left/right<br>
        F: Flip horizontally<br>
        G: Flip vertically
      </div>

      <div style="border-top: 1px solid #555; padding-top: 8px; margin-top: 10px;">
        <div id="debug-values" style="font-size: 10px; color: #aaa;">
          Offset: (0, 0)<br>
          Scale: (1, 1)<br>
          Rotation: 0°<br>
          Flips: None
        </div>
      </div>

      <div style="margin-top: 10px; font-size: 10px; color: #888;">
        Tell me which adjustments work and I'll hardcode the fix!
      </div>
    `;

    document.body.appendChild(this.debugUI);
    console.log('🔧 Debug UI created - use WASD, QE, ZX, FG, R keys to adjust texture');
  }

  private updateDebugUI(): void {
    const debugValues = document.getElementById('debug-values');
    if (debugValues) {
      const flips = [];
      if (this.debugParams.flipX) flips.push('H');
      if (this.debugParams.flipY) flips.push('V');
      const flipText = flips.length > 0 ? flips.join('+') : 'None';

      debugValues.innerHTML = `
        Offset: (${this.debugParams.offsetX.toFixed(2)}, ${this.debugParams.offsetY.toFixed(2)})<br>
        Scale: (${this.debugParams.scaleX.toFixed(2)}, ${this.debugParams.scaleY.toFixed(2)})<br>
        Rotation: ${this.debugParams.rotation}°<br>
        Flips: ${flipText}
      `;
    }
  }

  private async reapplyCurrentTexture(options: StoryOptions): Promise<void> {
    if (this.currentThemeIndex >= 0 && this.currentThemeIndex < this.availableThemes.length) {
      const currentTheme = this.availableThemes[this.currentThemeIndex];
      try {
        await this.applyThemeWithIslandSupport(options, currentTheme.theme);
        console.log(
          `🔧 Reapplied texture with debug params: offset(${this.debugParams.offsetX.toFixed(2)}, ${this.debugParams.offsetY.toFixed(2)}) scale(${this.debugParams.scaleX.toFixed(2)}, ${this.debugParams.scaleY.toFixed(2)}) rotation(${this.debugParams.rotation}°)`
        );
      } catch (error) {
        console.error('❌ Failed to reapply texture:', error);
      }
    }
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
