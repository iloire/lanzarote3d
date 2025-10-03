import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { AppBase } from '../../shared/AppBase';
import { ProceduralTerrainGenerator, getPresetNames, getPreset, getPresetDescription, createPresetMaterial, type NoiseMode } from '../../foundation/systems/terrain';
import Sky from '../../foundation/components/environment/Sky';
import Water from '../../foundation/components/environment/Water';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { logger } from '../../foundation/utils/logger';

/**
 * Procedural Terrain Demo
 * Interactive showcase of parametric terrain generation with various presets
 */
class ProceduralTerrainApp extends AppBase {
  private terrainGenerator: ProceduralTerrainGenerator | null = null;
  private currentPreset: string = 'mountains';
  private infoDiv: HTMLDivElement | null = null;
  private animationId: number | undefined;

  constructor() {
    const appConfig = getAppConfig('procedural-terrain');
    super({
      name: appConfig?.name || 'Procedural Terrain',
      description:
        appConfig?.description ||
        'Interactive demonstration of parametric terrain generation with noise-based displacement',
      requiredComponents: ['scene', 'camera', 'renderer', 'controls', 'gui'],
      scene: {
        environment: 'custom',
        lighting: 'dynamic',
        physics: false,

      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);

      const { camera, scene, renderer, controls, gui } = options;

      // Enable controls
      controls.enabled = true;

      // Set up lighting
      this.setupLighting(scene);

      // Set up sky and water for context
      await this.setupEnvironment(scene, gui);

      // Create initial terrain
      this.terrainGenerator = new ProceduralTerrainGenerator(getPreset(this.currentPreset));
      const terrain = this.terrainGenerator.generate();
      scene.add(terrain);

      // Position camera for good view
      camera.position.set(5000, 3000, 5000);
      camera.lookAt(0, 0, 0);

      // Configure orbit controls
      OrbitControlsHelper.focusOnTarget(controls, new THREE.Vector3(0, 0, 0), {
        ...ORBIT_CONTROLS_PRESETS['aerial'],
        maxDistance: 20000,
        minDistance: 100,
      });

      // Create GUI controls
      this.createGUI(options);

      // Create info display
      this.createInfoDisplay();

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      logger.info(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupLighting(scene: THREE.Scene): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5000, 5000, 5000);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -10000;
    directionalLight.shadow.camera.right = 10000;
    directionalLight.shadow.camera.top = 10000;
    directionalLight.shadow.camera.bottom = -10000;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 20000;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Hemisphere light for softer ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x5e5e5e, 0.3);
    scene.add(hemisphereLight);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async setupEnvironment(scene: THREE.Scene, gui: any): Promise<void> {
    // Add sky
    const sky = new Sky(14, 3);
    sky.addToScene(scene);
    if (gui) {
      sky.addGui(gui);
    }

    // Add water plane
    const water = new Water({ size: 100000 }).load(sky.getSunPosition());
    water.position.y = -1000; // Position below terrain
    scene.add(water);
  }

  private createGUI(options: StoryOptions): void {
    const { gui, scene } = options;
    if (!gui) return;

    const folder = gui.addFolder('🌍 Procedural Terrain Generator');

    // Preset selector
    const presetNames = getPresetNames();
    const controls = {
      preset: this.currentPreset,
      regenerate: () => this.regenerateTerrain(scene),
      randomSeed: () => this.randomizeSeed(scene),
      exportHeightmap: () => this.exportHeightmap(),
    };

    folder
      .add(controls, 'preset', presetNames)
      .name('Preset')
      .onChange((value: string) => {
        this.currentPreset = value;
        this.applyPreset(scene, value);
      });

    // Current configuration controls
    if (this.terrainGenerator) {
      const config = this.terrainGenerator.getConfig();

      const paramsFolder = folder.addFolder('⚙️ Parameters');

      paramsFolder
        .add(config, 'heightScale', 0, 5000, 50)
        .name('Height Scale')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'heightBias', -2000, 2000, 50)
        .name('Height Bias')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'octaves', 1, 10, 1)
        .name('Octaves (Detail)')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'persistence', 0, 1, 0.05)
        .name('Persistence')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'lacunarity', 1, 4, 0.1)
        .name('Lacunarity')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'scale', 0.0001, 0.002, 0.0001)
        .name('Scale')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'segments', 50, 500, 10)
        .name('Resolution')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'islandFalloff', 0, 1, 0.1)
        .name('Island Falloff')
        .onChange(() => this.updateAndRegenerate(scene));

      // Noise mode selector
      const noiseModes: NoiseMode[] = ['standard', 'ridge', 'turbulence', 'billow'];
      paramsFolder
        .add(config, 'noiseMode', noiseModes)
        .name('Noise Mode')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder
        .add(config, 'wireframe')
        .name('Wireframe')
        .onChange(() => this.updateAndRegenerate(scene));

      paramsFolder.open();
    }

    // Action buttons
    folder.add(controls, 'regenerate').name('🔄 Regenerate');
    folder.add(controls, 'randomSeed').name('🎲 Random Seed');
    folder.add(controls, 'exportHeightmap').name('💾 Export Heightmap');

    folder.open();
  }

  private applyPreset(scene: THREE.Scene, presetName: string): void {
    const preset = getPreset(presetName);
    if (!preset) return;

    // Update generator configuration
    if (this.terrainGenerator) {
      // Dispose old terrain
      const oldMesh = this.terrainGenerator.getMesh();
      if (oldMesh) {
        scene.remove(oldMesh);
      }
      this.terrainGenerator.dispose();
    }

    // Create new generator with preset
    this.terrainGenerator = new ProceduralTerrainGenerator({
      ...preset,
      material: createPresetMaterial(presetName),
    });

    const terrain = this.terrainGenerator.generate();
    scene.add(terrain);

    this.updateInfoDisplay();
    logger.info(`✅ Applied preset: ${presetName}`);
  }

  private updateAndRegenerate(scene: THREE.Scene): void {
    if (!this.terrainGenerator) return;

    const oldMesh = this.terrainGenerator.getMesh();
    if (oldMesh) {
      scene.remove(oldMesh);
    }

    const terrain = this.terrainGenerator.regenerate();
    scene.add(terrain);

    this.updateInfoDisplay();
  }

  private regenerateTerrain(scene: THREE.Scene): void {
    this.updateAndRegenerate(scene);
    logger.info('🔄 Terrain regenerated');
  }

  private randomizeSeed(scene: THREE.Scene): void {
    if (!this.terrainGenerator) return;

    const config = this.terrainGenerator.getConfig();
    config.seed = Math.random();
    this.terrainGenerator.updateConfig({ seed: config.seed });

    this.updateAndRegenerate(scene);
    logger.info('🎲 New random seed applied');
  }

  private exportHeightmap(): void {
    if (!this.terrainGenerator) return;

    const heightmap = this.terrainGenerator.exportHeightmap();
    if (!heightmap) {
      logger.warn('❌ No heightmap to export');
      return;
    }

    // Create blob and download
    const blob = new Blob([heightmap.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrain-heightmap-${Date.now()}.raw`;
    a.click();
    URL.revokeObjectURL(url);

    logger.info('💾 Heightmap exported');
  }

  private createInfoDisplay(): void {
    this.infoDiv = document.createElement('div');
    this.infoDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: 'Ubuntu Mono', monospace;
      font-size: 13px;
      z-index: 900;
      max-width: 350px;
      border: 2px solid #4a7c59;
      line-height: 1.5;
    `;

    this.updateInfoDisplay();
    document.body.appendChild(this.infoDiv);
  }

  private updateInfoDisplay(): void {
    if (!this.infoDiv || !this.terrainGenerator) return;

    const metadata = this.terrainGenerator.getMetadata();
    const config = this.terrainGenerator.getConfig();

    if (!metadata) return;

    const description = getPresetDescription(this.currentPreset);

    this.infoDiv.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #4a7c59; font-size: 16px;">
        🌍 ${this.currentPreset.charAt(0).toUpperCase() + this.currentPreset.slice(1)} Terrain
      </h3>
      <p style="margin: 0 0 15px 0; opacity: 0.9; font-size: 12px; line-height: 1.4;">
        ${description}
      </p>
      <div style="font-size: 12px; opacity: 0.9; line-height: 1.6;">
        <div><strong>📊 Statistics:</strong></div>
        <div>• Min Height: ${metadata.minHeight.toFixed(0)}m</div>
        <div>• Max Height: ${metadata.maxHeight.toFixed(0)}m</div>
        <div>• Avg Height: ${metadata.averageHeight.toFixed(0)}m</div>
        <div>• Vertices: ${metadata.vertexCount.toLocaleString()}</div>
        <div>• Triangles: ${metadata.triangleCount.toLocaleString()}</div>
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #333; font-size: 11px; line-height: 1.5;">
        <div><strong>⚙️ Configuration:</strong></div>
        <div>• Noise: ${config.noiseType} (${config.noiseMode})</div>
        <div>• Octaves: ${config.octaves}</div>
        <div>• Scale: ${config.scale.toFixed(4)}</div>
        <div>• Resolution: ${config.segments}x${config.segments}</div>
      </div>
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #333; font-size: 11px; line-height: 1.4;">
        <div style="color: #4a7c59; font-weight: bold; margin-bottom: 5px;">⌨️ Quick Tips:</div>
        <div>• Use GUI to switch presets</div>
        <div>• Adjust parameters in real-time</div>
        <div>• Try different noise modes</div>
        <div>• Export heightmap for use elsewhere</div>
      </div>
    `;
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
    logger.debug(`🧹 Disposing ${this.config.name}`);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.infoDiv && this.infoDiv.parentNode) {
      this.infoDiv.parentNode.removeChild(this.infoDiv);
      this.infoDiv = null;
    }

    if (this.terrainGenerator) {
      this.terrainGenerator.dispose();
      this.terrainGenerator = null;
    }

    super.dispose();
  }
}

// Create singleton instance
const proceduralTerrainApp = new ProceduralTerrainApp();

// Export in expected format
const ProceduralTerrain = {
  load: async (options: StoryOptions) => {
    return proceduralTerrainApp.load(options);
  },
  dispose: () => {
    return proceduralTerrainApp.dispose();
  },
  getAppInfo: () => {
    return proceduralTerrainApp.getAppInfo();
  },
};

export default ProceduralTerrain;