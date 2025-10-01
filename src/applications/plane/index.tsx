import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { Jet } from '../../foundation/components/vehicles';
import { logger } from '../../foundation/utils/logger';

/**
 * Plane Application - Showcase of the Jet aircraft
 */
class PlaneApp extends WorkshopDemoBase {
  private jetMesh?: THREE.Object3D;

  constructor() {
    super({
      name: 'Plane',
      description: 'Military jet aircraft showcase',
      ground: {
        create: true,
        size: { width: 200, height: 200 },
        color: 0x4a6741, // Dark green
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

      // Set up clean workshop environment
      this.setupCleanEnvironment(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Create jet
      await this.createJet(scene);

      // Setup camera
      this.setupCamera(camera, controls);

      // Setup GUI controls
      if (gui) {
        this.setupGUI(gui);
      }

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      logger.info('✅ Plane (Jet) application loaded successfully');

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createJet(scene: THREE.Scene): Promise<void> {
    logger.info('✈️ Creating jet aircraft...');

    try {
      const jet = new Jet({
        bodyColor: '#4A5568',
        wingColor: '#2D3748',
        cockpitColor: '#3B82F6',
        scale: 2,
        castShadow: true,
        receiveShadow: true
      });

      this.jetMesh = await jet.load();

      if (this.jetMesh) {
        this.jetMesh.position.set(0, 5, 0);
        this.jetMesh.rotation.y = Math.PI / 4; // Angle for better viewing
        scene.add(this.jetMesh);
        logger.info('✅ Jet added to scene');
      }

    } catch (error) {
      logger.error('❌ Error creating jet:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setupCamera(camera: THREE.PerspectiveCamera, controls: any): void {
    camera.position.set(40, 20, 40);
    camera.lookAt(0, 5, 0);
    logger.info('📷 Camera positioned for jet viewing');

    if (controls) {
      controls.target.set(0, 5, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setupGUI(gui: any): void {
    const jetFolder = gui.addFolder('Jet Aircraft');

    if (this.jetMesh) {
      const params = {
        rotationY: this.jetMesh.rotation.y,
        scale: this.jetMesh.scale.x,
      };

      jetFolder.add(params, 'rotationY', 0, Math.PI * 2, 0.1).onChange((value: number) => {
        if (this.jetMesh) {
          this.jetMesh.rotation.y = value;
        }
      }).name('Rotation');

      jetFolder.add(params, 'scale', 0.5, 5, 0.1).onChange((value: number) => {
        if (this.jetMesh) {
          this.jetMesh.scale.setScalar(value);
        }
      }).name('Scale');
    }

    jetFolder.add({ info: 'Military-style jet aircraft' }, 'info').name('Description');
    jetFolder.open();
  }

  override dispose(): void {
    logger.debug('🧹 Disposing Plane application');
    this.jetMesh = undefined;
    super.dispose();
  }
}

// Create singleton instance
const planeApp = new PlaneApp();

// Export in the expected format for the app system
const Plane = {
  load: async (options: StoryOptions) => {
    return planeApp.load(options);
  },
  dispose: () => {
    return planeApp.dispose();
  },
  getAppInfo: () => {
    return planeApp.getAppInfo();
  },
};

export default Plane;
