import LegacyGlider from '../../foundation/components/vehicles/Glider';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Legacy Glider Workshop Demo - Showcases the legacy glider component
 */
class LegacyGliderWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Legacy Glider Workshop',
      description:
        'Workshop demo showcasing legacy glider component with traditional wing configurations',
      ground: {
        create: false,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, gui, controls } = options;

      const gliderOptions = {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        breakColor: '#333333',
        lineFrontColor: '#000000',
        lineBackColor: '#333333',
        inletsColor: '#333333',
        numeroCajones: 30,
        bandLength: 500,
        carabinersSeparationMM: 300,
      };

      const glider = new LegacyGlider(gliderOptions);
      const mesh = await glider.load(gui);
      scene.add(mesh);

      camera.position.set(12000, 1250, 11300);
      camera.lookAt(mesh.position);

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

const legacyGliderWorkshopApp = new LegacyGliderWorkshopApp();

const LegacyGliderWorkshop = {
  load: async (options: StoryOptions) => {
    return legacyGliderWorkshopApp.load(options);
  },
  dispose: () => {
    return legacyGliderWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return legacyGliderWorkshopApp.getAppInfo();
  },
};

export default LegacyGliderWorkshop;
