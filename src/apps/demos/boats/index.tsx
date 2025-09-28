import * as THREE from 'three';
import { ParagliderVoxel } from '../../../foundation/components/vehicles';
import type { ParagliderVoxelOptions } from '../../../foundation/components/vehicles';
import Environment from '../../shared/env/environment';
import adriModel from '../../../../assets/foundation/models/characters/adri/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri/adri.png';
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

// ==========================================
// ANIMATION CONFIGURATION - Easy to tweak!
// ==========================================
// To disable animation and use static camera:
// 1. Set enableAnimation: false
// 2. Choose staticMode.position: 'closeUp', 'overhead', 'waterLevel', or 'custom'
// 3. If using 'custom', set customPosition and customLookAt coordinates
// 4. Set staticMode.enableControls: true to allow manual camera navigation
const ANIMATION_CONFIG = {
  // Enable/disable camera animation
  enableAnimation: false, // Set to false for static camera positioned close to boats

  // Static camera configuration (used when enableAnimation = false)
  staticMode: {
    // Choose preset position or use 'custom' for manual positioning
    position: 'custom' as 'closeUp' | 'overhead' | 'waterLevel' | 'custom',
    enableControls: true, // Allow user to manually navigate with orbit controls

    // Custom camera positioning (used when position = 'custom')
    customPosition: { x: 7840, y: 24, z: -5100 }, // Camera position
    customLookAt: { x: 7900, y: 30, z: -5200 }, // Where camera looks (default: boat center)
  },

  // Timing settings
  duration: 18000, // Total animation duration in milliseconds

  // Phase timing (as percentages of total duration)
  phases: {
    boatFocus: 0.2, // 50% - First phase showing boats prominently
    transition: 0.3, // 75% - End of transition phase
    // Final phase (paraglider focus) is from 75% to 100%
  },

  // Camera positions (Three.js Vector3 coordinates)
  positions: {
    initial: { x: 8200, y: 80, z: -6200 }, // Behind boats at water level
    boatCenter: { x: 7900, y: 30, z: -5200 }, // Center of boat area (look target)
    intermediate: { x: 7200, y: 400, z: -3000 }, // Rising toward paraglider area
    // Final position is calculated relative to paraglider: pgPos + finalOffset
    finalOffset: { x: -100, y: 50, z: 200 }, // Offset from paraglider position

    // Static camera positions (used when enableAnimation = false)
    static: {
      closeUp: { x: 7900, y: 70, z: -5120 }, // Close to boats, slightly elevated
      overhead: { x: 7900, y: 150, z: -5200 }, // Overhead view of boats
      waterLevel: { x: 7900, y: 20, z: -5100 }, // At water level, very close
    },
  },

  // Movement speed multipliers (lower = slower movement)
  speeds: {
    phase1Movement: 0.05, // How fast camera moves in phase 1 (boats focus)
    phase1LookShift: 0.05, // How fast look target shifts in phase 1
    phase2Movement: 0.1, // Movement speed in transition phase
    phase2Interpolation: 0.15, // Interpolation factor for phase 2 intermediate position
    phase2LookShift: 0.15, // Look target shift speed in phase 2
    phase3LookShift: 0.08, // Final phase look target adjustment speed
  },

  // Camera floating effect (after animation completes)
  floating: {
    amplitude: 0, // Floating amplitude
    speed: 1.2, // Floating speed multiplier
    timeMultiplier: 0.0005, // Time scaling for floating calculations
    dampening: {
      y: 0.02, // Y-axis floating dampening
      x: 0.01, // X-axis floating dampening
      z: 0.01, // Z-axis floating dampening
    },
  },

  // Control settings after animation
  controls: {
    minDistance: 50,
    maxDistance: 1500,
    panRadius: 500,
    panVerticalScale: 0.5,
  },
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

  // Animation configuration - using values from ANIMATION_CONFIG
  private readonly ANIMATION_DURATION_MS = ANIMATION_CONFIG.duration;

  constructor() {
    const appConfig = getAppConfig('boats');
    if (!appConfig) {
      throw new Error('Boats app not found in registry');
    }
    super({
      name: appConfig.name,
      description: appConfig.description,
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
      console.log('Adding boats to the scene...');
      this.environment.addMixedBoats(water); // Same boats as original
      console.log('Boats added. Component stats:', this.environment.getComponentStats());

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

    // Camera positions from ANIMATION_CONFIG - easy to tweak!
    const { positions } = ANIMATION_CONFIG;
    const initialCameraPosition = new THREE.Vector3(
      positions.initial.x,
      positions.initial.y,
      positions.initial.z
    );
    const boatCenterPosition = new THREE.Vector3(
      positions.boatCenter.x,
      positions.boatCenter.y,
      positions.boatCenter.z
    );
    const intermediatePosition = new THREE.Vector3(
      positions.intermediate.x,
      positions.intermediate.y,
      positions.intermediate.z
    );

    // Final position calculated from paraglider position + offset
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x + positions.finalOffset.x,
      pgPos.y + positions.finalOffset.y,
      pgPos.z + positions.finalOffset.z
    );

    // Check if animation is enabled
    if (!ANIMATION_CONFIG.enableAnimation) {
      // Static mode - position camera using configured position
      let cameraPos, lookAtPos;

      if (ANIMATION_CONFIG.staticMode.position === 'custom') {
        // Use custom positioning
        cameraPos = ANIMATION_CONFIG.staticMode.customPosition;
        lookAtPos = ANIMATION_CONFIG.staticMode.customLookAt;
      } else {
        // Use preset static position
        const staticPos = ANIMATION_CONFIG.positions.static[ANIMATION_CONFIG.staticMode.position];
        cameraPos = staticPos;
        lookAtPos = boatCenterPosition;
      }

      camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);

      if (controls) {
        controls.target.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
        controls.update();
        controls.enabled = ANIMATION_CONFIG.staticMode.enableControls; // Enable/disable controls based on config
      }

      // Start animation loop for static scene
      this.startAnimationLoop(renderer, scene, camera, controls);
      return; // Exit without starting camera animation
    }

    // Animation mode - set initial camera position behind boats looking at them
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
          const { phases, speeds } = ANIMATION_CONFIG;

          if (progress < phases.boatFocus) {
            // Phase 1: Show boats prominently (first half of animation)
            const phase1Progress = progress / phases.boatFocus;
            const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress);

            // Movement using configurable speed
            currentPosition = new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              easedProgress * speeds.phase1Movement
            );

            // Look target shift using configurable speed
            const lookTarget = new THREE.Vector3().lerpVectors(
              boatCenterPosition,
              pgPos,
              easedProgress * speeds.phase1LookShift
            );
            if (controls) {
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else if (progress < phases.transition) {
            // Phase 2: Transition phase (configurable duration)
            const phase2Start = phases.boatFocus;
            const phase2Duration = phases.transition - phases.boatFocus;
            const phase2Progress = (progress - phase2Start) / phase2Duration;
            const easedProgress = phase2Progress * phase2Progress * (3 - 2 * phase2Progress);

            currentPosition = new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(
                initialCameraPosition,
                intermediatePosition,
                speeds.phase2Interpolation
              ),
              finalCameraPosition,
              easedProgress * speeds.phase2Movement
            );

            // Look target shift using configurable speed
            if (controls) {
              const targetProgress = Math.min(phase2Progress * 0.8, 1.0);
              const lookTarget = new THREE.Vector3().lerpVectors(
                controls.target,
                pgPos,
                targetProgress * speeds.phase2LookShift
              );
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else {
            // Phase 3: Final approach to paraglider (transition to 100%)
            const phase3Start = phases.transition;
            const phase3Duration = 1.0 - phases.transition;
            const phase3Progress = (progress - phase3Start) / phase3Duration;
            const easedProgress = 1 - Math.pow(1 - phase3Progress, 2.5);

            currentPosition = new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(
                new THREE.Vector3().lerpVectors(
                  initialCameraPosition,
                  intermediatePosition,
                  speeds.phase2Interpolation
                ),
                finalCameraPosition,
                speeds.phase2Movement
              ),
              finalCameraPosition,
              easedProgress
            );

            // Focus on paraglider using configurable speed
            if (controls) {
              controls.target.lerpVectors(controls.target, pgPos, speeds.phase3LookShift);
              controls.update();
            }
          }

          camera.position.copy(currentPosition);
        },
        () => {
          // Animation complete - enable controls with configurable settings
          if (controls) {
            controls.enabled = true;

            OrbitControlsHelper.focusOnTarget(
              controls,
              pgPos,
              OrbitControlsHelper.createCenteredLimits(pgPos, {
                ...ORBIT_CONTROLS_PRESETS['closeSubject'],
                minDistance: ANIMATION_CONFIG.controls.minDistance,
                maxDistance: ANIMATION_CONFIG.controls.maxDistance,
                panBoundary: {
                  center: pgPos,
                  radius: ANIMATION_CONFIG.controls.panRadius,
                  verticalScale: ANIMATION_CONFIG.controls.panVerticalScale,
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

        // Camera floating effect using configurable parameters
        const { floating } = ANIMATION_CONFIG;
        const time = (Date.now() - startTime) * floating.timeMultiplier;

        // Update environment components (boats, etc.)
        if (this.environment) {
          const deltaTime = 0.016; // Assume 60fps for deltaTime
          this.environment.update(deltaTime);
          // Environment updates are working - debug logs removed
        }

        if (this.animatorInstance === undefined) {
          const floatY = Math.sin(time * floating.speed) * floating.amplitude;
          const floatX = Math.sin(time * floating.speed * 0.7) * (floating.amplitude * 0.3);
          const floatZ = Math.cos(time * floating.speed * 0.5) * (floating.amplitude * 0.2);

          camera.position.y += floatY * floating.dampening.y;
          camera.position.x += floatX * floating.dampening.x;
          camera.position.z += floatZ * floating.dampening.z;
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
