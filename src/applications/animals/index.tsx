import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { Crow, Eagle, Vulture } from '../../foundation/components/animals';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';

/**
 * Animals Showcase - Display various bird species with wing animations
 * Demonstrates the three bird classes: Crow, Eagle, and Vulture
 */
class AnimalsApp extends WorkshopDemoBase {
  private crow?: Crow;
  private eagle?: Eagle;
  private vulture?: Vulture;

  constructor() {
    super({
      name: 'Animals Showcase',
      description: 'Showcase of bird species with realistic wing animations',
      ground: {
        create: true,
        size: { width: 20, height: 20 },
        color: 0x228B22,
        opacity: 0.8
      },
      lighting: {
        sunPosition: 0.3,
      },
      helpers: false
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);

      // Set up clean workshop environment with specified ground and lighting
      this.setupCleanEnvironment(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Set up camera position for bird viewing
      this.setupCamera(camera, controls);

      // Create bird instances
      await this.createBirds(scene, gui);

      // Start animation loop with bird update callback
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        this.updateBirds();
      });

      this.isLoaded = true;
      logger.info('✅ Animals Showcase loaded successfully');

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }


  private setupCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls): void {
    // Position camera closer for better bird viewing
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 2, 0);
    logger.info(`📷 Camera positioned at (4, 3, 6) looking at (0, 2, 0)`);

    if (controls) {
      controls.target.set(0, 2, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();
      logger.info(`🎮 Controls configured with target at (0, 2, 0)`);
    }
  }

  private async createBirds(scene: THREE.Scene, gui?: GUI): Promise<void> {
    logger.info('🐦 Starting bird creation...');

    // Create Crow (left position)
    logger.info('Creating Crow...');
    this.crow = new Crow({
      wingBeatFrequency: 3.0,
      wingBeatAmplitude: 0.6
    });

    await this.crow.load();
    const crowMesh = this.crow.getMesh();
    if (crowMesh) {
      crowMesh.position.set(-4, 2, 0);
      scene.add(crowMesh);
      logger.info('✅ Crow added to scene at position (-4, 2, 0)');
    } else {
      logger.error('❌ Failed to get Crow mesh');
    }

    // Create Eagle (center position)
    logger.info('Creating Eagle...');
    this.eagle = new Eagle({
      wingBeatFrequency: 1.5,
      wingBeatAmplitude: 0.8
    });

    await this.eagle.load();
    const eagleMesh = this.eagle.getMesh();
    if (eagleMesh) {
      eagleMesh.position.set(0, 2, 0);
      scene.add(eagleMesh);
      logger.info('✅ Eagle added to scene at position (0, 2, 0)');
    } else {
      logger.error('❌ Failed to get Eagle mesh');
    }

    // Create Vulture (right position)
    logger.info('Creating Vulture...');
    this.vulture = new Vulture({
      wingBeatFrequency: 1.2,
      wingBeatAmplitude: 0.4
    });

    await this.vulture.load();
    const vultureMesh = this.vulture.getMesh();
    if (vultureMesh) {
      vultureMesh.position.set(4, 2, 0);
      scene.add(vultureMesh);
      logger.info('✅ Vulture added to scene at position (4, 2, 0)');
    } else {
      logger.error('❌ Failed to get Vulture mesh');
    }

    logger.info('🐦 All birds created and added to scene');

    // Add GUI controls if available
    if (gui) {
      this.setupGUI(gui);
    }
  }

  private setupGUI(gui: GUI): void {
    const birdFolder = gui.addFolder('Birds');
    birdFolder.add({ info: 'Bird models loaded successfully' }, 'info').name('Status');
    birdFolder.open();
  }

  private updateBirds(): void {
    // Update bird animations - WorkshopDemoBase handles deltaTime calculation
    if (this.crow) {
      this.crow.update(0.016); // ~60fps deltaTime for now
    }
    if (this.eagle) {
      this.eagle.update(0.016);
    }
    if (this.vulture) {
      this.vulture.update(0.016);
    }
  }

  override dispose(): void {
    logger.info('🧹 Disposing Animals Showcase');

    // Dispose bird components
    if (this.crow) {
      this.crow.dispose();
      this.crow = undefined;
    }
    if (this.eagle) {
      this.eagle.dispose();
      this.eagle = undefined;
    }
    if (this.vulture) {
      this.vulture.dispose();
      this.vulture = undefined;
    }

    // Call parent dispose (handles animation loop cleanup)
    super.dispose();
  }
}

// Create singleton instance
const animalsApp = new AnimalsApp();

// Export in the expected format for the app system
const AnimalsShowcase = {
  load: async (options: StoryOptions) => {
    return animalsApp.load(options);
  },
  dispose: () => {
    return animalsApp.dispose();
  },
  getAppInfo: () => {
    return animalsApp.getAppInfo();
  },
};

export default AnimalsShowcase;