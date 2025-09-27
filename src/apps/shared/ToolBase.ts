import Helpers from '../../foundation/utils/helpers';
import { AppBase, AppConfig } from './AppBase';
import { StoryOptions } from './types';
import Sky from '../../foundation/components/environment/Sky';

export interface ToolConfig extends Omit<AppConfig, 'scene'> {
  scene?: {
    environment?: 'lanzarote' | 'custom';
    lighting?: 'dynamic' | 'static';
    physics?: boolean;
    loadEnvironment?: boolean; // Option to load full environment (default: false)
    fog?: {
      enabled: boolean;
      color?: number;
      near?: number;
      far?: number;
    };
  };
}

/**
 * ToolBase - Specialized base for development and authoring tools
 *
 * Provides flexible environment setup for tools like:
 * - Location editor
 * - Component workshop
 * - Development utilities
 */
export abstract class ToolBase extends AppBase {

  constructor(config: ToolConfig) {
    // Provide tool-specific defaults
    super({
      ...config,
      scene: {
        environment: 'custom',
        lighting: 'static',
        physics: false,
        fog: {
          enabled: false, // Tools usually need clear visibility
        },
        ...config.scene,
      },
      performance: {
        monitoring: true,
        logIntervalMs: 20000, // More frequent monitoring for development
        ...config.performance,
      },
    });
  }

  /**
   * Load minimal environment for tools (sky only by default)
   */
  protected async loadEnvironment(options: StoryOptions): Promise<void> {
    const { scene, gui, controls } = options;

    // Enable controls
    controls.enabled = true;

    // Always load sky for lighting
    const sky = new Sky(19, 3);
    sky.addToScene(scene);
    sky.addGui(gui);
    sky.updateSunPosition(12);
    options.sky = sky;

    // Create helpers for development
    Helpers.createHelpers(scene);

    console.log('✅ Tool environment loaded: minimal setup (sky + helpers)');
  }

  /**
   * Override initializeCore to load minimal environment
   */
  protected override initializeCore(options: StoryOptions): void {
    super.initializeCore(options);
  }

  /**
   * Tools should call this after initializeCore
   */
  protected async initializeEnvironment(options: StoryOptions): Promise<void> {
    await this.loadEnvironment(options);
  }
}