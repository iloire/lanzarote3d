import * as THREE from 'three';
import { Pilot } from '../../foundation/components/characters/Pilot';
import TandemPilot from '../../foundation/components/characters/TandemPilot';
import {
  GlassesType,
  PilotHeadType,
  HelmetType,
} from '../../foundation/components/characters/PilotHead';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase, WorkshopDemoConfig } from '../../shared/WorkshopDemoBase';

/**
 * Pilot Workshop Demo - Showcases different pilot character types
 */
class PilotWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Pilot Workshop',
      description:
        'Workshop demo showcasing different pilot character types and customization options',
      ground: {
        create: false, // Don't show ground plane for character showcase
      },
      lighting: {
        sunPosition: 12,
        
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer } = options;

      const pilots = [
        {
          headType: PilotHeadType.Default,
          helmetType: HelmetType.Default,
          helmetColor: '#ffff00',
        },
        {
          headType: PilotHeadType.Default,
          helmetType: HelmetType.Default,
        },
        {
          headType: PilotHeadType.Warrior,
          helmetType: HelmetType.Default,
        },
      ];

      // Load pilots
      let x = -1400;
      for (const pilotOptions of pilots) {
        const pilot = new Pilot(pilotOptions);
        const mesh = await pilot.load();
        mesh.position.set(x, -300, -500);
        scene.add(mesh);
        x += 600;
      }

      // Load tandem pilot
      const tandem = new TandemPilot({
        pilot: {
          headType: PilotHeadType.Default,
          suitColor: 'green',
          shoesColor: 'black',
        },
        passenger: {
          headType: PilotHeadType.Default,
          suitColor: 'orange',
          shoesColor: 'gray',
        },
      });
      const meshTandem = await tandem.load();
      meshTandem.position.set(-2000, -300, -500);
      scene.add(meshTandem);

      // Set camera position for character showcase
      camera.position.set(0, 0, 8000);
      camera.lookAt(scene.position);

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, options.controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const pilotWorkshopApp = new PilotWorkshopApp();

// Export in the expected format for the Stories system
const PilotWorkshop = {
  load: async (options: StoryOptions) => {
    return pilotWorkshopApp.load(options);
  },
  dispose: () => {
    return pilotWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return pilotWorkshopApp.getAppInfo();
  },
};

export default PilotWorkshop;
