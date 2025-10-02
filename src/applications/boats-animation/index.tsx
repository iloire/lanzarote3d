import * as THREE from 'three';
import Environment, { LANZAROTE_TOWNS } from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { getDefaultTheme } from '../../foundation/themes';
import { ThemeEngine } from '../../foundation/systems/ThemeEngine';
import { TerrainBase } from '../../shared/TerrainBase';
import { OrbitControlsHelper } from '../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../config/app-registry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { logger } from '../../foundation/utils/logger';
import {
  ANIMATION_CONFIG,
  paraglidersVoxel,
  birdPath,
} from './config';
import { loadParagliders } from './vehicleLoader';
import {
  setupStaticCamera,
  setupAnimatedCamera,
  applyFloatingMotion,
} from './cameraAnimation';

/**
 * Boats Animation Demo - Based on original animation but with camera starting near boats
 * Shows boats partially in frame, then transitions to focus on paragliders and clouds
 */
class BoatsAnimationApp extends TerrainBase {
    private environment: Environment | undefined;
    private animationId: number | undefined;
    private paragliderMeshes: THREE.Object3D[] = [];
    private isAnimating: boolean = false;
    private animationCleanup: (() => void) | undefined;

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

            // Set camera to initial position to avoid jarring transition
            const initialCameraPosition = new THREE.Vector3(8055, 220, -6155);
            camera.position.copy(initialCameraPosition);
            const boatCenterPosition = new THREE.Vector3(8400, 0, -6100);
            camera.lookAt(boatCenterPosition);
            if (controls) {
                controls.target.copy(boatCenterPosition);
                controls.update();
            }

            // Load voxel paragliders with proper tracking
            const paragliderResults = await loadParagliders(
                scene,
                paraglidersVoxel,
                this.handleError.bind(this)
            );
            this.paragliderMeshes = paragliderResults.map((r) => r.mesh);

            // must render before adding env
            renderer.render(scene, camera);

            // Set up environment using theme (same as original)
            this.environment = new Environment(scene);
            const weather = this.environment.createWeatherFromTheme(theme);
            const thermals = this.environment.generateThermals(weather, 0.7);

            // Add environment elements using theme (same as original)
            await this.environment.addCloudsFromTheme(thermals, theme);
            this.environment.addTrees(terrain);

            // Create Lanzarote towns using the predefined configuration
            await this.environment.addTownsFromConfig(LANZAROTE_TOWNS, terrain);

            logger.info('Adding boats to the scene...');
            this.environment.addMixedBoats(water);
            logger.info('Boats added. Component stats:', this.environment.getComponentStats());

            // Make environment available for theme switching
            options.environment = this.environment;

            // Add birds
            await this.environment.addBirds(birdPath);

            // Setup camera animation sequence - ONLY DIFFERENCE from original
            this.setupCameraAnimation(camera, controls, renderer, scene);

            this.isLoaded = true;
            logger.info(
                `✅ ${this.config.name} loaded successfully with ${this.paragliderMeshes.length} paragliders`
            );
        } catch (error) {
            this.handleError(error as Error, 'load');
            throw error;
        }
    }

    private setupCameraAnimation(
        camera: THREE.Camera,
        controls: OrbitControls,
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene
    ): void {
        const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();
        const boatCenterPosition = new THREE.Vector3(
            ANIMATION_CONFIG.positions.boatCenter.x,
            ANIMATION_CONFIG.positions.boatCenter.y,
            ANIMATION_CONFIG.positions.boatCenter.z
        );

        // Start animation loop
        this.startAnimationLoop(renderer, scene, camera, controls);

        // Check if animation is enabled
        if (!ANIMATION_CONFIG.enableAnimation) {
            // Static mode
            setupStaticCamera(camera, controls, boatCenterPosition);
            return;
        }

        // Animation mode
        this.animationCleanup = setupAnimatedCamera(camera, controls, pgPos, {
            onAnimationStart: () => {
                this.isAnimating = true;
            },
            onAnimationComplete: () => {
                this.isAnimating = false;
            },
        }).cleanup;
    }

    private startAnimationLoop(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
        controls: OrbitControls
    ): void {
        const startTime = Date.now();

        const animate = () => {
            try {
                this.updatePerformance();

                // Update environment components (boats, etc.)
                if (this.environment) {
                    const deltaTime = 0.016; // Assume 60fps for deltaTime
                    this.environment.update(deltaTime);
                }

                // Apply floating motion
                applyFloatingMotion(camera, startTime, this.isAnimating);

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
        logger.debug(`🧹 Disposing ${this.config.name}`);

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }

        if (this.animationCleanup) {
            this.animationCleanup();
            this.animationCleanup = undefined;
        }

        this.isAnimating = false;

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
