import * as THREE from 'three';
import { AppBase } from './AppBase';
import { StoryOptions } from './types';
import Sky from '../foundation/components/environment/Sky';
import Water from '../foundation/components/environment/Water';
import { Island } from '../foundation/components/scenery/Island';
import { RenderPipeline } from '../foundation/rendering/RenderPipeline';
import { bakeCoastField } from '../foundation/rendering/CoastField';
import { OceanMaterial } from '../foundation/rendering/OceanMaterial';
import { ThemeEngine } from '../foundation/systems/ThemeEngine';
import { getDefaultTheme } from '../foundation/themes';

/**
 * TerrainBase - Specialized base that injects terrain (island) environment
 *
 * Provides full terrain environment setup for apps that need:
 * - Island terrain with collision detection
 * - Water and sky components
 * - Full Lanzarote environment setup
 *
 * Used by demos like Animation, Photobooth, and Famara
 */
export abstract class TerrainBase extends AppBase {
  protected loadingManager?: THREE.LoadingManager;
  protected pipeline?: RenderPipeline;

  /**
   * Load full environment for demos
   */
  protected async loadEnvironment(options: StoryOptions): Promise<void> {
    const { scene, gui, renderer, camera } = options;

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

    // Shallows and surf need to know where the beaches are.
    const ocean = water.material;
    if (ocean instanceof OceanMaterial) {
      ocean.setCoast(bakeCoastField(renderer, island));
    }

    // ?fx=0 renders without the post-processing pipeline, to compare looks and frame times.
    const params = new URLSearchParams(window.location.search);
    if (params.get('fx') !== '0') {
      this.pipeline = new RenderPipeline(renderer, scene, camera, {
        maxPixelRatio: params.has('embed') ? 1.5 : 2,
      });
      this.pipeline.attachSky(sky);
      options.pipeline = this.pipeline;
    }

    // Apps may have applied their theme before the sky, sea and island existed.
    await ThemeEngine.apply(options, getDefaultTheme(), {
      skipComponents: ['environment'],
    });

    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __lz: unknown }).__lz = { renderer, pipeline: this.pipeline };
    }

    console.log('✅ Terrain environment loaded: full Lanzarote setup with island terrain');
  }

  /**
   * Draw a frame: through the filmic pipeline once the environment is loaded.
   */
  protected renderFrame(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): void {
    if (this.pipeline) {
      this.pipeline.render(camera);
    } else {
      renderer.render(scene, camera);
    }
  }

  override dispose(): void {
    this.pipeline?.dispose();
    this.pipeline = undefined;
    super.dispose();
  }

  /**
   * Apps that need terrain call this first
   */
  protected async initializeEnvironment(options: StoryOptions): Promise<void> {
    await this.loadEnvironment(options);
  }
}
