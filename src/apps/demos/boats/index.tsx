import * as THREE from 'three';
import { ParagliderVoxel } from '../../../foundation/components/vehicles';
import type { ParagliderVoxelOptions } from '../../../foundation/components/vehicles';
import Environment from '../../shared/env/environment';
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../shared/types';
import { animator } from '../../../foundation/systems/animation/SimpleAnimator';
import { getDefaultTheme } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: THREE.Vector3;
};

const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#00bcd4',
        wingColor2: '#0097a7',
        inletsColor: 'lightblue',
        numeroCajones: 35,
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage,
      },
    },
    position: new THREE.Vector3(5500, 850, -800),
  },
  {
    pg: {
      glider: {
        wingColor1: '#ff5722',
        wingColor2: '#d84315',
        inletsColor: 'orange',
        numeroCajones: 35,
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage,
      },
    },
    position: new THREE.Vector3(6200, 920, -300),
  },
];

/**
 * Boats Animation Demo - Camera starts close to boats, then animates toward paragliders
 * Focus on showing boats partially while emphasizing paragliders and clouds
 */
class BoatsAnimationApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private animatorInstance: any | undefined;

  // Animation configuration
  private readonly ANIMATION_DURATION_MS = 8000; // 8 seconds total

  constructor() {
    const appConfig = getAppConfig('boats');
    super({
      name: appConfig?.name || 'Boats Animation',
      description: appConfig?.description || 'Animation showcasing boats and paragliders with camera movement from water to sky',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false,
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 12000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      // Apply theme to scene
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Load voxel paragliders
      await this.loadParagliders(scene);

      // Initial render
      renderer.render(scene, camera);

      // Set up environment
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0.7);

      // Add environment elements with emphasis on boats and clouds
      await this.environment.addCloudsFromTheme(thermals, theme);
      this.environment.addTrees(terrain);
      this.environment.addHouses(terrain);

      // Add boats for better visual variety
      this.environment.addRandomBoats(water); // Random boat types

      // Make environment available for theme switching
      options.environment = this.environment;

      // Add birds for more dynamic sky
      const birdPath = [
        new THREE.Vector3(4000, 800, -200),
        new THREE.Vector3(5000, 900, -600),
        new THREE.Vector3(6000, 1000, -400),
        new THREE.Vector3(7000, 900, -100),
        new THREE.Vector3(6500, 800, 200),
      ];
      await this.environment.addBirds(birdPath);

      // Setup camera animation sequence
      this.setupCameraAnimation(camera, controls, renderer, scene);

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

    await Promise.all(voxelPromises);
  }

  private setupCameraAnimation(
    camera: THREE.Camera,
    controls: any,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ): void {
    // Camera positions and target setup
    const avgPgPos = new THREE.Vector3();
    paraglidersVoxel.forEach(pg => avgPgPos.add(pg.position));
    avgPgPos.divideScalar(paraglidersVoxel.length);

    // Starting position - close to water level, showing boats partially
    // Position near the water, angled to capture boats in foreground
    const initialCameraPosition = new THREE.Vector3(4800, 120, -1200); // Low, near water
    const initialTarget = new THREE.Vector3(5200, 400, -600); // Looking toward area between boats and paragliders

    // Intermediate position - transitioning toward paragliders
    const intermediatePosition = new THREE.Vector3(5200, 400, -900);
    const intermediateTarget = new THREE.Vector3(5800, 600, -500);

    // Final position - focused on paragliders and clouds
    const finalCameraPosition = new THREE.Vector3(
      avgPgPos.x - 200,
      avgPgPos.y + 100,
      avgPgPos.z + 300
    );

    // Set initial camera position
    camera.position.copy(initialCameraPosition);
    camera.lookAt(initialTarget);

    // Setup controls
    if (controls) {
      controls.target.copy(initialTarget);
      controls.update();
      controls.enabled = false; // Disable during animation
    }

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera, controls);

    // Start the camera animation sequence
    setTimeout(() => {
      this.animatorInstance = animator.animate(
        'boats-to-paragliders',
        this.ANIMATION_DURATION_MS,
        progress => {
          let currentPosition, currentTarget;

          if (progress < 0.3) {
            // Phase 1: Show boats prominently (first 30% - 2.4 seconds)
            const phase1Progress = progress / 0.3;
            const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress);

            // Gentle movement while keeping boats visible
            currentPosition = new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              easedProgress * 0.5 // Slow movement
            );

            currentTarget = new THREE.Vector3().lerpVectors(
              initialTarget,
              intermediateTarget,
              easedProgress * 0.3
            );
          } else if (progress < 0.6) {
            // Phase 2: Transition focus (30-60% - 2.4 seconds)
            const phase2Progress = (progress - 0.3) / 0.3;
            const easedProgress = phase2Progress * phase2Progress * (3 - 2 * phase2Progress);

            currentPosition = new THREE.Vector3().lerpVectors(
              intermediatePosition,
              finalCameraPosition,
              easedProgress * 0.7
            );

            currentTarget = new THREE.Vector3().lerpVectors(
              intermediateTarget,
              avgPgPos,
              easedProgress
            );
          } else {
            // Phase 3: Focus on paragliders and clouds (60-100% - 3.2 seconds)
            const phase3Progress = (progress - 0.6) / 0.4;
            const easedProgress = 1 - Math.pow(1 - phase3Progress, 2);

            currentPosition = new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(intermediatePosition, finalCameraPosition, 0.7),
              finalCameraPosition,
              easedProgress
            );

            currentTarget = avgPgPos.clone();
          }

          camera.position.copy(currentPosition);

          if (controls) {
            controls.target.copy(currentTarget);
            controls.update();
          }
        },
        () => {
          // Animation complete - enable user controls
          if (controls) {
            controls.enabled = true;

            // Set up focused controls on paragliders
            OrbitControlsHelper.focusOnTarget(
              controls,
              avgPgPos,
              OrbitControlsHelper.createCenteredLimits(avgPgPos, {
                ...ORBIT_CONTROLS_PRESETS['aerial'],
                minDistance: 100,
                maxDistance: 2000,
                panBoundary: {
                  center: avgPgPos,
                  radius: 800,
                  verticalScale: 0.7,
                },
              })
            );
          }
          this.animatorInstance = undefined;
        }
      );
    }, 200);
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any
  ): void {
    let startTime = Date.now();

    const animate = () => {
      try {
        this.updatePerformance();

        // Gentle floating motion after animation completes
        if (this.animatorInstance === undefined) {
          const time = (Date.now() - startTime) * 0.0003;
          const floatAmplitude = 1.5;
          const floatSpeed = 1.0;

          const floatY = Math.sin(time * floatSpeed) * floatAmplitude;
          const floatX = Math.sin(time * floatSpeed * 0.6) * (floatAmplitude * 0.2);
          const floatZ = Math.cos(time * floatSpeed * 0.4) * (floatAmplitude * 0.15);

          camera.position.y += floatY * 0.015;
          camera.position.x += floatX * 0.008;
          camera.position.z += floatZ * 0.008;
        }

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

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.animatorInstance) {
      this.animatorInstance = undefined;
    }

    // Dispose paraglider meshes
    this.paragliderMeshes.forEach(mesh => {
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

    if (this.environment) {
      this.environment = undefined;
    }

    super.dispose();
  }
}

// Create singleton instance
const boatsAnimationApp = new BoatsAnimationApp();

// Export in the expected format
const BoatsAnimation = {
  load: async (options: StoryOptions) => {
    return boatsAnimationApp.load(options);
  },
  dispose: () => {
    return boatsAnimationApp.dispose();
  },
  getAppInfo: () => {
    return boatsAnimationApp.getAppInfo();
  },
};

export default BoatsAnimation;