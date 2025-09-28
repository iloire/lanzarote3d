import * as THREE from 'three';
import Clouds from '../../../../../foundation/components/environment/Clouds';
import { StoryOptions } from '../../../../shared/types';
import { getAllThemes, getThemeById } from '../../../../../foundation/themes';
import { ThemeEngine } from '../../../../../foundation/systems/ThemeEngine';
import { themeManager } from '../../../../../foundation/systems/ThemeManager';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

// Use themes from our comprehensive theme system
const ALL_THEMES = getAllThemes();

/**
 * Clouds Workshop Demo - Showcases different cloud themes
 */
class CloudsWorkshopApp extends WorkshopDemoBase {
  private currentClouds: THREE.Object3D | null = null;
  private currentTheme: any;

  constructor() {
    super({
      name: 'Clouds Workshop',
      description: 'Workshop demo showcasing different cloud themes and weather patterns',
      ground: {
        create: true,
        size: { width: 2000, height: 2000 },
        color: 0x87ceeb, // Sky blue ground for clouds
        opacity: 0.2,
      },
      lighting: {
        sunPosition: 14,
        showHelpers: true,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, controls, gui } = options;

      this.currentTheme = ALL_THEMES[0]; // Start with first theme

      // Apply initial theme (theme manager should already be initialized by app.tsx)
      if (this.currentTheme) {
        await themeManager.applyTheme(this.currentTheme.id);
      }

      // Create initial clouds
      await this.createClouds(scene, this.currentTheme);

      // Setup GUI for theme switching
      if (gui) {
        this.setupThemeGUI(gui, scene);
      }

      // Set camera position for good cloud viewing
      camera.position.set(290, 30, 230);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createClouds(scene: THREE.Scene, theme: any): Promise<THREE.Object3D> {
    // Remove existing clouds
    if (this.currentClouds) {
      scene.remove(this.currentClouds);
      // Dispose of materials and geometries
      this.currentClouds.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

    const cloudOptions = ThemeEngine.getCloudOptionsFromTheme(theme);
    const mesh = await new Clouds(cloudOptions).load(1, new THREE.Vector3(0, 0, 0));
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    this.currentClouds = mesh;
    return mesh;
  }

  private setupThemeGUI(gui: any, scene: THREE.Scene): void {
    const themeFolder = gui.addFolder('🎨 Cloud Themes');

    // Quick theme selector
    const themeNames = ALL_THEMES.map(theme => theme.id);
    const themeControl = {
      theme: this.currentTheme.id,
      regenerate: () => this.createClouds(scene, this.currentTheme),
      applyFullTheme: async () => {
        await themeManager.applyTheme(this.currentTheme.id);
        await this.createClouds(scene, this.currentTheme);
      },
    };

    themeFolder
      .add(themeControl, 'theme', themeNames)
      .name('🚀 Select Theme')
      .onChange(async (value: string) => {
        const theme = getThemeById(value);
        if (theme) {
          this.currentTheme = theme;
          await themeManager.applyTheme(theme.id);
          await this.createClouds(scene, theme);
        }
      });

    themeFolder.add(themeControl, 'applyFullTheme').name('🌟 Apply Complete Theme');
    themeFolder.add(themeControl, 'regenerate').name('🔄 Regenerate Clouds');

    themeFolder.open();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Clean up clouds
    if (this.currentClouds) {
      this.currentClouds.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      this.currentClouds = null;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const cloudsWorkshopApp = new CloudsWorkshopApp();

// Export in the expected format for the Stories system
const CloudsWorkshop = {
  load: async (options: StoryOptions) => {
    return cloudsWorkshopApp.load(options);
  },
  dispose: () => {
    return cloudsWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return cloudsWorkshopApp.getAppInfo();
  },
};

export default CloudsWorkshop;
