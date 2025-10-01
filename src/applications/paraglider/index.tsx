import * as THREE from 'three';
import { Paraglider } from '../../foundation/components/vehicles';
import { PilotHeadType } from '../../foundation/components/characters/PilotHead';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Paraglider Workshop Demo - Showcases paraglider wing variations
 */
class ParagliderWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Paraglider Workshop',
      description: 'Workshop demo showcasing different paraglider wing configurations and colors',
      ground: {
        create: false, // Don't show ground plane for wing showcase
      },
      lighting: {
        sunPosition: 12,
      },
      helpers: {
        axes: true,
        grid: true
      }
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, gui, controls } = options;

      const gliderOptions = {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        inletsColor: '#333333',
        numeroCajones: 40,
        bandLength: 500,
        carabinersSeparationMM: 300,
      };
      const pilotOptions = {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffffff',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
        carabinerColor: '#333',
      };

      const paragliderOptions = {
        glider: gliderOptions,
        pilot: pilotOptions,
      };

      const paraglider = new Paraglider(paragliderOptions);
      const mesh = await paraglider.load();
      paraglider.addGuiControls(gui);
      scene.add(mesh);

      // Set camera position for paraglider showcase
      const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
      camera.position.set(12000, 250, 10300);
      camera.lookAt(lookAt);

      // Start animation loop
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

// Create singleton instance
const paragliderWorkshopApp = new ParagliderWorkshopApp();

// Export in the expected format for the Stories system
const ParagliderWorkshop = {
  load: async (options: StoryOptions) => {
    return paragliderWorkshopApp.load(options);
  },
  dispose: () => {
    return paragliderWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return paragliderWorkshopApp.getAppInfo();
  },
};

export default ParagliderWorkshop;
