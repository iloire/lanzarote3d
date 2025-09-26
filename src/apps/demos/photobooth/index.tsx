import * as THREE from 'three';
import { Paraglider, ParagliderOptions } from '../../../foundation/components/vehicles';
import ParagliderVoxel, {
  ParagliderVoxelOptions,
} from '../../../foundation/components/vehicles/ParagliderVoxel';
import Tandem from '../../../foundation/components/vehicles/Tandem';
import { PilotHeadType } from '../../../foundation/components/characters/PilotHead';
import Environment from '../../shared/env/environment';
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { AppBase } from '../../shared/AppBase';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../../foundation/utils/OrbitControlsHelper';

const tandems = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        inletsColor: '#333333',
        numeroCajones: 35,
      },
      pilot: {
        pilot: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffff00',
              color2: '#cccccc',
              color3: '#999999',
            },
          },
        },
        passenger: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffffff',
              color2: '#cccccc',
              color3: '#999999',
            },
          },
          suitColor: 'red',
          suitColor2: 'green',
        },
      },
    },
    position: new THREE.Vector3(6837, 850, -535),
  },
];

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: any;
};

const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage,
      },
    },
    position: new THREE.Vector3(6897, 920, -705),
  },
];

type ParagliderConfig = {
  pg: ParagliderOptions;
  position: any;
};

const paragliders: ParagliderConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6827, 860, -555),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'white',
        numeroCajones: 50,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6727, 780, -555),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 40,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6777, 920, -535),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 40,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6777, 920, -535),
  },
];

/**
 * PhotoBooth Demo - Beautiful static 3D scene showcasing paragliders and environment
 * Second app converted to use AppBase architecture
 */
class PhotoBoothApp extends AppBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];

  constructor() {
    super({
      name: 'Photobooth',
      description: 'Beautiful static 3D scene showcasing paragliders and environment',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Fog handled by theme system
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000, // Log performance every 15 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      controls.enabled = true;

      // Apply theme to scene
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      const initialPos = new THREE.Vector3(6200, 970, 175);
      const lookAtPos = paraglidersVoxel[0]?.position || new THREE.Vector3();

      // Set camera position and look at target
      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Apply landscape viewing controls for photobooth exploration
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, ORBIT_CONTROLS_PRESETS['landscape']);

      // Load paragliders with proper tracking for disposal
      await this.loadParagliders(scene);

      // must render before adding env
      renderer.render(scene, camera);

      // Set up environment using theme
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0);

      // Add environment elements using theme
      await this.environment.addCloudsFromTheme(thermals, theme);
      this.environment.addTrees(terrain);
      this.environment.addHouses(terrain);
      this.environment.addBoats(water);

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with ${this.paragliderMeshes.length} paragliders`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadParagliders(scene: THREE.Scene): Promise<void> {
    // Add regular paragliders
    const paragliderPromises = paragliders.map(async p => {
      try {
        const paraglider = new Paraglider(p.pg);
        const mesh = await paraglider.load();
        mesh.position.copy(p.position);
        const scale = 0.001;
        mesh.scale.set(scale, scale, scale);
        scene.add(mesh);
        this.paragliderMeshes.push(mesh);
        return mesh;
      } catch (error) {
        this.handleError(error as Error, 'loading regular paraglider');
        return null;
      }
    });

    // Add voxel paragliders
    const voxelPromises = paraglidersVoxel.map(async p => {
      try {
        const paraglider = new ParagliderVoxel(p.pg);
        const mesh = await paraglider.load();
        mesh.position.copy(p.position);
        const scale = 0.01;
        mesh.scale.set(scale, scale, scale);
        scene.add(mesh);
        this.paragliderMeshes.push(mesh);
        return mesh;
      } catch (error) {
        this.handleError(error as Error, 'loading voxel paraglider');
        return null;
      }
    });

    // Add tandems
    const tandemPromises = tandems.map(async p => {
      try {
        const tandem = new Tandem(p.pg);
        const mesh = await tandem.load();
        mesh.position.copy(p.position);
        const scale = 0.001;
        mesh.scale.set(scale, scale, scale);
        scene.add(mesh);
        this.paragliderMeshes.push(mesh);
        return mesh;
      } catch (error) {
        this.handleError(error as Error, 'loading tandem');
        return null;
      }
    });

    // Wait for all paragliders to load
    await Promise.all([...paragliderPromises, ...voxelPromises, ...tandemPromises]);
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
        OrbitControlsHelper.update(controls);

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

    // Dispose paraglider meshes
    this.paragliderMeshes.forEach(mesh => {
      // Dispose geometry and materials if they exist
      mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.paragliderMeshes.length = 0;

    // Dispose environment resources
    if (this.environment) {
      this.environment = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const photoBoothApp = new PhotoBoothApp();

// Export in the expected format for the Stories system
const PhotoBooth = {
  load: async (options: StoryOptions) => {
    return photoBoothApp.load(options);
  },
  dispose: () => {
    return photoBoothApp.dispose();
  },
  getAppInfo: () => {
    return photoBoothApp.getAppInfo();
  },
};

export default PhotoBooth;
