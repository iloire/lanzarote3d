import * as THREE from 'three';
import { AppBase, AppConfig } from './AppBase';
import { StoryOptions } from './types';
import Sky from '../../foundation/components/environment/Sky';
import Water from '../../foundation/components/environment/Water';
import { Island } from '../../foundation/components/scenery/Island';

export interface ExperienceConfig extends Omit<AppConfig, 'scene'> {
  scene?: {
    environment?: 'lanzarote' | 'custom';
    lighting?: 'dynamic' | 'static';
    physics?: boolean;
    fog?: {
      enabled: boolean;
      color?: number;
      near?: number;
      far?: number;
    };
  };
}

/**
 * ExperienceBase - Specialized base for interactive experiences
 *
 * Provides full environment and physics setup for experiences like:
 * - Flight simulator
 * - Flyzones exploration
 * - Interactive tours
 */
export abstract class ExperienceBase extends AppBase {
  protected loadingManager?: THREE.LoadingManager;

  constructor(config: ExperienceConfig) {
    // Provide experience-specific defaults
    super({
      ...config,
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: true, // Experiences often need physics
        fog: {
          enabled: true,
        },
        ...config.scene,
      },
      performance: {
        monitoring: true,
        logIntervalMs: 10000, // More frequent monitoring for interactive experiences
        ...config.performance,
      },
    });
  }

  /**
   * Load full environment for experiences
   */
  protected async loadEnvironment(options: StoryOptions): Promise<void> {
    const { scene, gui } = options;

    // Create loading manager
    this.loadingManager = new THREE.LoadingManager();

    // Sky setup
    const sky = new Sky(19, 3);
    sky.addToScene(scene);
    sky.addGui(gui);
    options.sky = sky;

    // Water setup
    const water = new Water({ size: 500000 }).load(sky.getSunPosition());
    scene.add(water);
    options.water = water;

    // Island setup
    const islandInstance = new Island();
    const island = await islandInstance.load(this.loadingManager);

    // Apply island configuration from SCENE_CONFIG
    const scale = 20000; // From SCENE_CONFIG.scale
    const position: [number, number, number] = [0, -10, 0]; // From SCENE_CONFIG.islandPosition

    island.scale.set(scale, scale, scale);
    island.position.set(...position);
    scene.add(island);

    options.terrain = island;
    options.terrainInstance = islandInstance;

    console.log('✅ Experience environment loaded: full Lanzarote setup');
  }

  /**
   * Override initializeCore to load full environment
   */
  protected override initializeCore(options: StoryOptions): void {
    super.initializeCore(options);
  }

  /**
   * Experiences should call this after initializeCore
   */
  protected async initializeEnvironment(options: StoryOptions): Promise<void> {
    await this.loadEnvironment(options);
  }
}