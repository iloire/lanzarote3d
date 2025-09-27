import * as THREE from 'three';
import { StoryOptions } from '../../../../shared/types';
import { TerrainBase } from '../../../../shared/TerrainBase';

/**
 * Island Workshop Demo - Simple island view demo with full terrain
 */
class IslandWorkshopApp extends TerrainBase {
  private animationId: number | undefined;

  constructor() {
    super({
      name: 'Island Workshop',
      description: 'Simple workshop demo showcasing island environment view',
      requiredComponents: ['sky', 'water', 'terrain'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      await this.initializeEnvironment(options);
      const { camera, scene, renderer, controls } = options;

      // Set camera to view the island from a distance
      camera.position.set(-21200, 2500, 23000);

      // If sky is available, set controls target to sun position
      if (options.sky) {
        controls.target = options.sky.getSunPosition();
      }
      controls.update();

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
    controls: any
  ): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Update controls for damping
        controls.update();

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

    super.dispose();
  }
}

const islandWorkshopApp = new IslandWorkshopApp();

const Island = {
  load: async (options: StoryOptions) => {
    return islandWorkshopApp.load(options);
  },
  dispose: () => {
    return islandWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return islandWorkshopApp.getAppInfo();
  },
};

export default Island;