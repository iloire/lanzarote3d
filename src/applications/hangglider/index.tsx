import * as THREE from 'three';
import HangGlider from '../../foundation/components/vehicles/Hangglider';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Hang Glider Workshop Demo - Showcases hang glider components
 */
class HangGliderWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Hang Glider Workshop',
      description: 'Workshop demo showcasing hang glider wing configurations',
      ground: {
        create: false,
      },
      lighting: {
        sunPosition: 12,
      },
      helpers: {
        axes: true,
        grid: true
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, gui, controls } = options;

      const hg = new HangGlider();
      const mesh = await hg.load();

      // Add GUI controls if needed
      if (gui) {
        hg.addGuiControls(gui);
      }

      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      // Set camera position for hang glider viewing
      const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
      camera.position.set(225, -70, 90);
      camera.lookAt(lookAt);

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

const hangGliderWorkshopApp = new HangGliderWorkshopApp();

const HangGliderWorkshop = {
  load: async (options: StoryOptions) => {
    return hangGliderWorkshopApp.load(options);
  },
  dispose: () => {
    return hangGliderWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return hangGliderWorkshopApp.getAppInfo();
  },
};

export default HangGliderWorkshop;
