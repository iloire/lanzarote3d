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

// Same paragliders as original animation but positioned to work well with boats camera
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

/**
 * Boats Animation Demo - Based on original animation but with camera starting near boats
 * Shows boats partially in frame, then transitions to focus on paragliders and clouds
 */
class BoatsAnimationApp extends TerrainBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private animatorInstance: any | undefined;

  // Animation configuration - slightly longer to allow time to show boats
  private readonly ANIMATION_DURATION_MS = 8000; // 8 seconds total

  constructor() {
    const appConfig = getAppConfig('boats');
    super({
      name: appConfig?.name || 'Boats Animation',
      description: appConfig?.description || 'Animation starting near boats and transitioning to focus on paragliders and clouds',
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
        logIntervalMs: 12000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from TerrainBase
      this.initializeCore(options);

      // Load full environment (island, water, sky) from TerrainBase
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      // Apply theme to scene (same as original)
      const theme = options.theme ?? getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Load voxel paragliders with proper tracking (same as original)
      await this.loadParagliders(scene);

      // must render before adding env
      renderer.render(scene, camera);

      // Set up environment using theme (same as original)
      this.environment = new Environment(scene);
      const weather = this.environment.createWeatherFromTheme(theme);
      const thermals = this.environment.generateThermals(weather, 0.7);

      // Add environment elements using theme (same as original)
      await this.environment.addCloudsFromTheme(thermals, theme);
      this.environment.addTrees(terrain);
      this.environment.addHouses(terrain);
      this.environment.addRandomBoats(water); // Same boats as original

      // Make environment available for theme switching
      options.environment = this.environment;

      // Add birds (same path as original)
      const birdPath = [
        new THREE.Vector3(5000, 1000, 0),
        new THREE.Vector3(6000, 1100, -500),
        new THREE.Vector3(7000, 1200, -1000),
        new THREE.Vector3(8000, 1000, -500),
        new THREE.Vector3(7000, 900, 0),
      ];
      await this.environment.addBirds(birdPath);

      // Setup camera animation sequence - ONLY DIFFERENCE from original
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
    // Same as original animation
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
    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();

    // MODIFIED CAMERA POSITIONS to start behind boats with boats clearly visible
    // Starting position - behind boats at water level, boats clearly in frame
    const initialCameraPosition = new THREE.Vector3(8200, 80, -6200); // Behind boat area, lower
    const boatCenterPosition = new THREE.Vector3(7900, 30, -5200); // Center of boat area

    // Intermediate position - slowly rising and moving toward paraglider area
    const intermediatePosition = new THREE.Vector3(7200, 400, -3000);

    // Final position - same as original animation (close to paraglider)
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 100,
      pgPos.y + 50,
      pgPos.z + 200
    );

    // Set initial camera position behind boats looking at them
    camera.position.copy(initialCameraPosition);
    camera.lookAt(boatCenterPosition); // Look directly at boats

    // Ensure controls are set up properly
    if (controls) {
      controls.target.copy(boatCenterPosition);
      controls.update();
      controls.enabled = false; // Disable controls during animation
    }

    // Start animation loop (same as original)
    this.startAnimationLoop(renderer, scene, camera, controls);

    // Start the modified camera animation
    setTimeout(() => {
      this.animatorInstance = animator.animate(
        'boats-to-paragliders',
        this.ANIMATION_DURATION_MS,
        progress => {
          let currentPosition;

          if (progress < 0.4) {
            // Phase 1: Show boats prominently (first 40% - 3.2 seconds)
            const phase1Progress = progress / 0.4;
            const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress);

            // Very minimal movement to keep boats in frame
            currentPosition = new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              easedProgress * 0.15 // Even slower initial movement
            );

            // Keep looking at boats for longer
            const lookTarget = new THREE.Vector3().lerpVectors(
              boatCenterPosition,
              pgPos,
              easedProgress * 0.3 // Slower shift in focus
            );
            if (controls) {
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else if (progress < 0.7) {
            // Phase 2: Slow transition (40-70% - 2.4 seconds)
            const phase2Progress = (progress - 0.4) / 0.3;
            const easedProgress = phase2Progress * phase2Progress * (3 - 2 * phase2Progress);

            currentPosition = new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(initialCameraPosition, intermediatePosition, 0.15),
              finalCameraPosition,
              easedProgress * 0.6 // Gradual movement
            );

            // Slowly shift to paraglider
            if (controls) {
              const targetProgress = Math.min(phase2Progress * 0.8, 1.0);
              const lookTarget = new THREE.Vector3().lerpVectors(
                controls.target,
                pgPos,
                targetProgress * 0.15 // Very gradual focus shift
              );
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else {
            // Phase 3: Final approach to paraglider (70-100% - 2.4 seconds)
            const phase3Progress = (progress - 0.7) / 0.3;
            const easedProgress = 1 - Math.pow(1 - phase3Progress, 2.5);

            currentPosition = new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(
                new THREE.Vector3().lerpVectors(initialCameraPosition, intermediatePosition, 0.15),
                finalCameraPosition,
                0.6
              ),
              finalCameraPosition,
              easedProgress
            );

            // Focus on paraglider
            if (controls) {
              controls.target.lerpVectors(controls.target, pgPos, 0.08);
              controls.update();
            }
          }

          camera.position.copy(currentPosition);
        },
        () => {
          // Animation complete - same as original
          if (controls) {
            controls.enabled = true;

            OrbitControlsHelper.focusOnTarget(
              controls,
              pgPos,
              OrbitControlsHelper.createCenteredLimits(pgPos, {
                ...ORBIT_CONTROLS_PRESETS['closeSubject'],
                minDistance: 50,
                maxDistance: 1500,
                panBoundary: {
                  center: pgPos,
                  radius: 500,
                  verticalScale: 0.5,
                },
              })
            );
          }
          this.animatorInstance = undefined;
        }
      );
    }, 100);
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any
  ): void {
    // Same as original animation
    let startTime = Date.now();

    const animate = () => {
      try {
        this.updatePerformance();

        // Add gentle floating motion like a cloud (same as original)
        const time = (Date.now() - startTime) * 0.0005;
        const floatAmplitude = 2;
        const floatSpeed = 1.2;

        if (this.animatorInstance === undefined) {
          const floatY = Math.sin(time * floatSpeed) * floatAmplitude;
          const floatX = Math.sin(time * floatSpeed * 0.7) * (floatAmplitude * 0.3);
          const floatZ = Math.cos(time * floatSpeed * 0.5) * (floatAmplitude * 0.2);

          camera.position.y += floatY * 0.02;
          camera.position.x += floatX * 0.01;
          camera.position.z += floatZ * 0.01;
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
    // Same as original animation
    console.log(`🧹 Disposing ${this.config.name}`);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.animatorInstance) {
      this.animatorInstance = undefined;
    }

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