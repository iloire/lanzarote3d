import { StoryOptions } from '../../../shared/types';
import { WorkshopDemoBase } from '../../../shared/WorkshopDemoBase';

/**
 * Island Workshop Demo - Simple island view demo
 */
class IslandWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Island Workshop',
      description: 'Simple workshop demo showcasing island environment view',
      ground: {
        create: false,
      },
      lighting: {
        sunPosition: 2,
        showHelpers: false,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
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

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);
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