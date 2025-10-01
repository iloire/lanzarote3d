import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';
import {
  cameraConfig,
  iglooConfig,
  treeConfigs,
  stoneConfigs,
  poolConfig,
  cactusConfigs,
  groundConfig,
} from './config';
import {
  loadIgloo,
  loadTrees,
  loadStones,
  loadPool,
  loadCacti,
  loadGround,
  ComponentLoadResult,
} from './componentLoader';
import {
  createLabel,
  countPolygons,
  updateLabelRotations,
} from './labelUtils';

/**
 * Workshop App - Component showcase with labels and scene setup
 * Converted to use WorkshopDemoBase for consistent workshop environment
 */
class WorkshopApp extends WorkshopDemoBase {
  private componentMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Mesh[] = [];

  constructor() {
    super({
      name: 'Workshop',
      description: 'Component showcase displaying various 3D objects with interactive labels',
      ground: {
        create: false,
        size: { width: 400, height: 300 },
        color: 0x8fbc8f, // Dark sea green for ground
        opacity: 0.3,
      },
      lighting: {
        sunPosition: 12,
        
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Load all components with proper tracking
      await this.loadComponents(scene, gui);

      // Setup camera and animation
      this.setupCamera(camera);
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        // Keep labels facing the camera
        updateLabelRotations(this.labelMeshes, camera);
      });

      this.isLoaded = true;
      logger.info(
        `✅ ${this.config.name} loaded successfully with ${this.componentMeshes.length} components`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadComponents(scene: THREE.Scene, gui: GUI): Promise<void> {
    const addComponent = (result: ComponentLoadResult | null) => {
      if (result) {
        this.componentMeshes.push(result.mesh);
        const polygonCount = countPolygons(result.mesh);
        const label = createLabel(result.label, result.position, polygonCount);
        scene.add(label);
        this.labelMeshes.push(label);
      }
    };

    // Load igloo
    const iglooResult = await loadIgloo(scene, iglooConfig, this.handleError.bind(this));
    addComponent(iglooResult);

    // Load trees
    const treeResults = await loadTrees(scene, treeConfigs, this.handleError.bind(this));
    treeResults.forEach(addComponent);

    // Load stones
    const stoneResults = await loadStones(scene, stoneConfigs, this.handleError.bind(this));
    stoneResults.forEach(addComponent);

    // Load pool
    const poolResult = await loadPool(scene, poolConfig, this.handleError.bind(this));
    addComponent(poolResult);

    // Load cacti
    const cactusResults = await loadCacti(scene, cactusConfigs, this.handleError.bind(this));
    cactusResults.forEach(addComponent);

    // Load ground
    const groundResult = loadGround(scene, groundConfig, this.handleError.bind(this));
    addComponent(groundResult);
  }

  private setupCamera(camera: THREE.Camera): void {
    camera.position.copy(cameraConfig.position);
    camera.lookAt(cameraConfig.lookAt);
  }

  public override dispose(): void {
    logger.debug(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Dispose component meshes
    this.componentMeshes.forEach(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });
    this.componentMeshes.length = 0;

    // Dispose label meshes
    this.labelMeshes.forEach(label => {
      if (label.geometry) {
        label.geometry.dispose();
      }
      if (label.material) {
        if (Array.isArray(label.material)) {
          label.material.forEach(mat => mat.dispose());
        } else {
          label.material.dispose();
        }
      }
    });
    this.labelMeshes.length = 0;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const workshopApp = new WorkshopApp();

// Export in the expected format for the Stories system
const Workshop = {
  load: async (options: StoryOptions) => {
    return workshopApp.load(options);
  },
  dispose: () => {
    return workshopApp.dispose();
  },
  getAppInfo: () => {
    return workshopApp.getAppInfo();
  },
};

export default Workshop;
