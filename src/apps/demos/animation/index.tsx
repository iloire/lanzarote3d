import * as THREE from 'three';
import { ParagliderVoxel } from '../../../foundation/components/vehicles';
import type { ParagliderVoxelOptions } from '../../../foundation/components/vehicles';
import Environment from '../../shared/env/environment';
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../shared/types';
import { animator } from '../../../foundation/systems/animation/SimpleAnimator';
import { THEMES } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';
import { AppBase } from '../../shared/AppBase';

// Use the golden hour theme for animation demo
const ANIMATION_THEME = THEMES['golden'];

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: THREE.Vector3;
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

/**
 * Animation Demo - Restored original animation with voxel paraglider
 * Third app converted to use AppBase architecture
 */
class AnimationApp extends AppBase {
  private environment: Environment | undefined;
  private animationId: number | undefined;
  private paragliderMeshes: THREE.Object3D[] = [];
  private animatorInstance: any | undefined;

  constructor() {
    super({
      name: 'Animation Demo',
      description: 'Dramatic camera animation showcasing voxel paragliders with golden hour lighting',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: true,
          color: 0xffb347, // Golden hour fog
          near: 1000,
          far: 20000
        }
      },
      performance: {
        monitoring: true,
        logIntervalMs: 12000 // Log performance every 12 seconds
      }
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { camera, scene, renderer, terrain, water, controls } = options;

      // Apply theme to scene
      const theme = options.theme ?? ANIMATION_THEME;
      if (!theme) {
        throw new Error('Theme not available');
      }
      await ThemeEngine.apply(options, theme);

      // Load voxel paragliders with proper tracking
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

      // Setup camera animation sequence
      this.setupCameraAnimation(camera, controls, renderer, scene);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.paragliderMeshes.length} paragliders`);

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

  private setupCameraAnimation(camera: THREE.Camera, controls: any, renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();

    // Starting position - extremely far away on the other side of the island
    const initialCameraPosition = new THREE.Vector3(-2000, 2500, 5000);

    // Intermediate position - approaching the area quickly
    const intermediatePosition = new THREE.Vector3(4500, 1600, 1500);

    // Final position - slow, careful approach to the paraglider
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 100, // Close to paraglider
      pgPos.y + 50, // Slightly above
      pgPos.z + 200 // Behind the paraglider
    );

    // Set initial camera position and look at the paraglider
    camera.position.copy(initialCameraPosition);
    camera.lookAt(pgPos);

    // Ensure controls are set up properly
    if (controls) {
      controls.target.copy(pgPos);
      controls.update();
      controls.enabled = false; // Disable controls during animation
    }

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera);

    // Start the dramatic two-phase camera animation
    setTimeout(() => {
      // Store initial positions
      const startTarget = controls ? controls.target.clone() : pgPos.clone();

      // Single seamless animation with custom easing (8 seconds total)
      this.animatorInstance = animator.animate(
        'camera-seamless',
        8000,
        progress => {
          let currentPosition;

          if (progress < 0.35) {
            // Phase 1: Fast approach (first 35% = 2.8 seconds)
            const phase1Progress = progress / 0.35; // 0-1 for first phase
            // Use smooth acceleration with gentle end
            const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress); // smoothstep
            currentPosition = new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              easedProgress
            );

            // Look towards the area gradually
            const lookTarget = new THREE.Vector3().lerpVectors(
              startTarget,
              pgPos,
              easedProgress * 0.6
            );
            if (controls) {
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else {
            // Phase 2: Slow approach (last 65% = 5.2 seconds)
            const phase2Progress = (progress - 0.35) / 0.65; // 0-1 for second phase
            // Use very smooth decelerated easing that connects perfectly
            const easedProgress = 1 - Math.pow(1 - phase2Progress, 2.5); // smooth deceleration
            currentPosition = new THREE.Vector3().lerpVectors(
              intermediatePosition,
              finalCameraPosition,
              easedProgress
            );

            // Gradually focus on the paraglider with smooth transition
            if (controls) {
              const targetProgress = Math.min(phase2Progress * 1.5, 1.0); // More gradual targeting
              controls.target.lerpVectors(controls.target, pgPos, targetProgress * 0.05); // Very smooth
              controls.update();
            }
          }

          camera.position.copy(currentPosition);
        },
        () => {
          // Animation complete
          if (controls) {
            controls.enabled = true;
          }
          // Allow floating motion to begin
          this.animatorInstance = undefined;
        }
      );
    }, 100);
  }

  private startAnimationLoop(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    let startTime = Date.now();

    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Add gentle floating motion like a cloud
        const time = (Date.now() - startTime) * 0.0005; // Slow motion
        const floatAmplitude = 2; // Vertical float range in units
        const floatSpeed = 1.2; // Speed of floating motion

        // Store original position during animation, only apply floating after animation completes
        if (this.animatorInstance === undefined) {
          // Apply subtle floating motion in multiple directions for more natural cloud-like movement
          const floatY = Math.sin(time * floatSpeed) * floatAmplitude;
          const floatX = Math.sin(time * floatSpeed * 0.7) * (floatAmplitude * 0.3); // Slower, smaller horizontal drift
          const floatZ = Math.cos(time * floatSpeed * 0.5) * (floatAmplitude * 0.2); // Even slower depth variation

          camera.position.y += floatY * 0.02; // Very gentle motion
          camera.position.x += floatX * 0.01;
          camera.position.z += floatZ * 0.01;
        }

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

    // Stop animator if running
    if (this.animatorInstance) {
      // Stop any ongoing animations
      // Stop any ongoing animations - note: stop method doesn't need ID parameter
      // animator.stop();
      this.animatorInstance = undefined;
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
const animationApp = new AnimationApp();

// Export in the expected format for the Stories system
const Animation = {
  load: async (options: StoryOptions) => {
    return animationApp.load(options);
  },
  dispose: () => {
    return animationApp.dispose();
  },
  getAppInfo: () => {
    return animationApp.getAppInfo();
  },
};

export default Animation;
