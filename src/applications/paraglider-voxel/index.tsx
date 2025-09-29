import * as THREE from 'three';
import ParagliderVoxel from '../../foundation/components/vehicles/ParagliderVoxel';
import adriModel from '../../../assets/foundation/models/characters/adri/adri.obj';
import adriTextureImage from '../../../assets/foundation/models/characters/adri/adri.png';
import ivanModel from '../../../assets/foundation/models/characters/ivan/ivan.obj';
import ivanTextureImage from '../../../assets/foundation/models/characters/ivan/ivan.png';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Paraglider Voxel Workshop Demo - Showcases voxel-style paraglider components
 * Now featuring both Adri and Ivan characters!
 */
class ParagliderVoxelWorkshopApp extends WorkshopDemoBase {
  private paragliders: any[] = [];

  constructor() {
    super({
      name: 'Paraglider Voxel Workshop - Adri vs Ivan',
      description:
        'Workshop demo showcasing voxel-style paraglider components with both Adri and Ivan pilots',
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

      console.log('🎭 Creating paragliders with both Adri and Ivan pilots...');

      // Define character configurations
      const characters = [
        {
          name: 'Adri',
          objFile: adriModel,
          textureFile: adriTextureImage,
          position: { x: -30, y: 0, z: 0 },
          wingColors: { color1: '#ff4444', color2: '#44ff44' },
        },
        {
          name: 'Ivan',
          objFile: ivanModel,
          textureFile: ivanTextureImage,
          position: { x: 30, y: 0, z: 0 },
          wingColors: { color1: '#4444ff', color2: '#ff44ff' },
        },
      ];

      // Create paragliders for each character
      for (const char of characters) {
        console.log(`📦 Creating paraglider for ${char.name}...`);

        const gliderOptions = {
          wingColor1: char.wingColors.color1,
          wingColor2: char.wingColors.color2,
          breakColor: '#ffff00',
          lineFrontColor: '#000000',
          lineBackColor: '#000000',
          inletsColor: '#ffffff',
          numeroCajones: 40,
          bandLength: 500,
          carabinersSeparationMM: 300,
        };

        const pilotOptions = {
          objFile: char.objFile,
          textureFile: char.textureFile,
        };

        const paragliderOptions = {
          glider: gliderOptions,
          pilot: pilotOptions,
        };

        try {
          const paraglider = new ParagliderVoxel(paragliderOptions);
          const mesh = await paraglider.load(gui);

          // Scale and position each paraglider
          mesh.scale.set(0.01, 0.01, 0.01);
          mesh.position.set(char.position.x, char.position.y, char.position.z);

          scene.add(mesh);
          this.paragliders.push({ paraglider, mesh, character: char.name });

          console.log(`✅ ${char.name} paraglider loaded successfully`);
        } catch (error) {
          console.error(`❌ Failed to load ${char.name} paraglider:`, error);
        }
      }

      // Create character labels
      this.createCharacterLabels(scene);

      // Position camera to show both paragliders
      camera.position.set(0, 40, 80); // Centered view to see both
      camera.lookAt(0, 0, 0); // Look at center between them

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with ${this.paragliders.length} paragliders`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Create labels for each character
   */
  private createCharacterLabels(scene: THREE.Scene): void {
    this.paragliders.forEach(pg => {
      const label = this.createLabel(
        `${pg.character}\nPilot`,
        pg.mesh.position.clone().add(new THREE.Vector3(0, 15, 0))
      );
      scene.add(label);
    });
  }

  /**
   * Create a text label
   */
  private createLabel(text: string, position: THREE.Vector3): THREE.Mesh {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    if (context) {
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = 'bold 32px Arial';
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';

      const lines = text.split('\n');
      lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, 50 + index * 40);
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    const geometry = new THREE.PlaneGeometry(15, 8);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    return mesh;
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
