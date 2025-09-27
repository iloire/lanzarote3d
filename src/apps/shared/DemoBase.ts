import * as THREE from 'three';
import { AppBase, AppConfig } from './AppBase';
import { StoryOptions } from './types';
import Sky from '../../foundation/components/environment/Sky';
import Water from '../../foundation/components/environment/Water';
import { Island } from '../../foundation/components/scenery/Island';

export interface DemoConfig extends Omit<AppConfig, 'scene'> {
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
 * DemoBase - Specialized base for showcase demonstrations
 *
 * Provides full environment setup for demos like:
 * - Animation demo
 * - Photobooth
 * - Famara landscape
 */
export abstract class DemoBase extends AppBase {
  protected loadingManager?: THREE.LoadingManager;

  constructor(config: DemoConfig) {
    // Provide demo-specific defaults
    super({
      ...config,
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: true, // Demos often benefit from atmospheric fog
        },
        ...config.scene,
      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000, // Regular monitoring for showcase demos
        ...config.performance,
      },
    });
  }

  /**
   * Load full environment for demos (same as experiences but no physics)
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

    // Apply island configuration
    const scale = 20000;
    const position: [number, number, number] = [0, -10, 0];

    island.scale.set(scale, scale, scale);
    island.position.set(...position);
    scene.add(island);

    options.terrain = island;
    options.terrainInstance = islandInstance;

    console.log('✅ Demo environment loaded: full Lanzarote setup (no physics)');
  }

  /**
   * Demos should call this after initializeCore
   */
  protected async initializeEnvironment(options: StoryOptions): Promise<void> {
    await this.loadEnvironment(options);
  }
}