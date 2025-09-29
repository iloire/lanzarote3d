import * as THREE from 'three';
import { Car } from '../../foundation/components/vehicles';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Autonomous Driving Demo - Simple car demo
 */
class AutonomousDrivingApp extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Autonomous Driving Demo',
      description: 'Simple car movement demo',
      ground: {
        create: true,
        size: { width: 500, height: 500 },
        color: 0x90ee90,
        opacity: 0.8,
      },
      lighting: {
        sunPosition: 14,
        
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, controls } = options;

      console.log('🚗 Creating simple car...');
      const car = new Car({
        bodyColor: '#FF4444',
        roofColor: '#CC0000',
        scale: 4,
      });

      const carMesh = await car.load();
      carMesh.position.set(0, 10, 0);
      scene.add(carMesh);

      camera.position.set(0, 100, 200);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);
    super.dispose();
  }
}

const autonomousDrivingApp = new AutonomousDrivingApp();

const AutonomousDriving = {
  load: async (options: StoryOptions) => {
    return autonomousDrivingApp.load(options);
  },
  dispose: () => {
    return autonomousDrivingApp.dispose();
  },
  getAppInfo: () => {
    return autonomousDrivingApp.getAppInfo();
  },
};

export default AutonomousDriving;
