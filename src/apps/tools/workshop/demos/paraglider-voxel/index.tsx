import ParagliderVoxel from '../../../../../foundation/components/vehicles/ParagliderVoxel';
import adriModel from '../../../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Paraglider Voxel Workshop Demo - Showcases voxel-style paraglider components
 */
class ParagliderVoxelWorkshopApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Paraglider Voxel Workshop',
      description: 'Workshop demo showcasing voxel-style paraglider components with pilots',
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
        wingColor1: '#ff4444',
        wingColor2: '#44ff44',
        breakColor: '#ffff00',
        lineFrontColor: '#000000',
        lineBackColor: '#000000',
        inletsColor: '#ffffff',
        numeroCajones: 40,
        bandLength: 500,
        carabinersSeparationMM: 300,
      };

      const pilotOptions = {
        objFile: adriModel,
        textureFile: adriTextureImage,
      };

      const paragliderOptions = {
        glider: gliderOptions,
        pilot: pilotOptions,
      };

      const paraglider = new ParagliderVoxel(paragliderOptions);
      const mesh = await paraglider.load(gui);
      mesh.scale.set(0.01, 0.01, 0.01);
      scene.add(mesh);

      // Position camera much closer to the voxel paraglider for detailed view
      camera.position.set(78, 25, 65); // Much closer - roughly 8 units away
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

const paragliderVoxelWorkshopApp = new ParagliderVoxelWorkshopApp();

const ParagliderVoxelWorkshop = {
  load: async (options: StoryOptions) => {
    return paragliderVoxelWorkshopApp.load(options);
  },
  dispose: () => {
    return paragliderVoxelWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return paragliderVoxelWorkshopApp.getAppInfo();
  },
};

export default ParagliderVoxelWorkshop;