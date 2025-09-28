import * as THREE from 'three';
import { /* Paraglider, */ ParagliderOptions } from '../../../foundation/components/vehicles';
import ParagliderVoxel, {
  ParagliderVoxelOptions,
} from '../../../foundation/components/vehicles/ParagliderVoxel';
import { PilotHeadType } from '../../../foundation/components/characters/PilotHead';
import Environment from '../../shared/env/environment';
import adriModel from '../../../../assets/foundation/models/characters/adri/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri/adri.png';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper, ORBIT_CONTROLS_PRESETS } from '../../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';

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

/**
 * PhotoBooth Demo - Beautiful static 3D scene showcasing paragliders and environment
 * Second app converted to use AppBase architecture
 */
class PhotoBoothApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private showCars: boolean = process.env.NODE_ENV === 'development'; // Show cars only in development mode

  constructor() {
    const appConfig = getAppConfig('photobooth');
    super({
      // Use metadata from app registry
      name: appConfig?.name || 'Photobooth',
      description: appConfig?.description || 'Beautiful static 3D scene showcasing paragliders and environment',
      // App-specific configuration
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false // Fog handled by theme system
        }
      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000 // Log performance every 15 seconds
      }
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from DemoBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from DemoBase
      await this.initializeEnvironment(options);

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
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos,
        ORBIT_CONTROLS_PRESETS['landscape']
      );

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

      // Add cars close to the camera position for photobooth (development mode only)
      if (terrain && this.showCars) {
        await this.addCarsNearCamera(terrain);
      }

      // Make environment available for theme switching
      options.environment = this.environment;

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      const carStatus = this.showCars ? 'with cars enabled (dev mode)' : 'with cars disabled (production mode)';
      console.log(`✅ ${this.config.name} loaded successfully with ${this.paragliderMeshes.length} paragliders ${carStatus}`);

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  /**
   * Enable or disable cars in the photobooth demo
   */
  public setCarsEnabled(enabled: boolean): void {
    this.showCars = enabled;
    console.log(`🚗 Cars ${enabled ? 'enabled' : 'disabled'} for ${this.config.name}`);
  }

  private async loadParagliders(scene: THREE.Scene): Promise<void> {
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
    // Wait for all paragliders to load
    await Promise.all([...voxelPromises]);
  }

  /**
   * Add cars near the camera position for better photobooth shots
   */
  private async addCarsNearCamera(terrain: THREE.Mesh): Promise<void> {
    if (!this.environment) return;

    try {
      // Camera starts at (6200, 970, 175) looking at paraglider around (6897, 920, -705)
      // Add cars in the foreground and middle ground for interesting photobooth composition

      // Import movement patterns
      const { MovementPattern } = await import('../../../foundation/systems/behaviors/MovingBehavior');
      const { TerrainDrivingMode } = await import('../../../foundation/systems/behaviors/TerrainFollowingBehavior');

      // Foreground cars - close to camera for dramatic shots
      const foregroundCars = [
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.CIRCULAR,
          speed: 0.1,
          radius: 150,
          scale: 1,
          bodyColor: '#FF4444', // Bright red
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const
        },
        {
          type: 'AutonomousCar' as const,
          enableMovement: true,
          speed: 0.08,
          scale: 1,
          bodyColor: '#4444FF', // Bright blue
          drivingMode: TerrainDrivingMode.EXPLORATION,
          explorationRadius: 200
        }
      ];

      // Area 1: Cars around the specified terrain location
      await this.environment.createCarGroup(
        terrain,
        foregroundCars,
        {
          center: new THREE.Vector3(6620.8, 0, -2809.6), // Specified terrain location
          formation: 'random',
          spacing: 100,
          groupRadius: 150,
          terrain
        }
      );

      // Area 2: More cars in a circle around the same area
      const middlegroundCars = [
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.LINEAR,
          speed: 0.06,
          radius: 200,
          scale: 1,
          bodyColor: '#44FF44', // Bright green
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const
        },
        {
          type: 'Car' as const,
          enableMovement: true,
          pattern: MovementPattern.RANDOM_DRIFT,
          speed: 0.05,
          radius: 180,
          scale: 1,
          bodyColor: '#FFFF44', // Bright yellow
          autoStartMoving: true,
          faceDirection: true,
          forwardAxis: 'x' as const
        },
        {
          type: 'AutonomousCar' as const,
          enableMovement: true,
          speed: 0.04,
          scale: 1,
          bodyColor: '#FF44FF', // Bright magenta
          drivingMode: TerrainDrivingMode.PATROL,
          explorationRadius: 150
        }
      ];

      // Add more cars around the same terrain area
      await this.environment.createCarGroup(
        terrain,
        middlegroundCars,
        {
          center: new THREE.Vector3(6720.8, 0, -2709.6), // Slightly offset from main area
          formation: 'circle',
          spacing: 120,
          groupRadius: 200,
          terrain
        }
      );

      console.log('✅ Cars added around terrain location (6620.8, 45.1, -2809.6) for photobooth shots');
    } catch (error) {
      console.warn('⚠️ Failed to add cars to photobooth:', error);
    }
  }

  private startAnimationLoop(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, controls: any): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Update environment (cars, boats, etc.)
        if (this.environment) {
          this.environment.update(0.016); // Assuming ~60fps
        }

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
      mesh.traverse((child) => {
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
  }
};

export default PhotoBooth;
