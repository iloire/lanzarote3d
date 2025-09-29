import * as THREE from 'three';
import { PatrolBoat } from '../../foundation/components/scenery';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Boat Workshop Demo - Showcases single PatrolBoat component
 */
class BoatWorkshopApp extends WorkshopDemoBase {
  private boat: THREE.Object3D | null = null;

  constructor() {
    super({
      name: 'Boat Workshop',
      description: 'Workshop demo showcasing single PatrolBoat component',
      ground: {
        create: true,
        size: { width: 1000, height: 800 },
        color: 0x4a90e2, // Water-like blue color
        opacity: 0.7,
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

      // Create single patrol boat
      await this.createPatrolBoat(scene);

      // Set up camera for boat showcase - much closer view
      camera.position.set(0, 300, 500);
      camera.lookAt(new THREE.Vector3(0, 50, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with PatrolBoat`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createPatrolBoat(scene: THREE.Scene): Promise<void> {
    // Create PatrolBoat with scale and position
    const patrolBoat = new PatrolBoat({ scale: 3.5 });
    const boatMesh = await patrolBoat.load();

    // Position at center for focused view
    boatMesh.position.set(0, 50, 0);
    boatMesh.rotation.y = Math.PI / 8;

    scene.add(boatMesh);
    this.boat = boatMesh;

    console.log('Added Coast Guard Patrol Boat at center position');

    // Note: Boat has built-in floating animation via FloatingThreeComponent base class
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Dispose boat mesh
    if (this.boat) {
      this.boat.traverse(child => {
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
      this.boat = null;
    }

    super.dispose();
  }
}

const boatWorkshopApp = new BoatWorkshopApp();

const BoatWorkshop = {
  load: async (options: StoryOptions) => {
    return boatWorkshopApp.load(options);
  },
  dispose: () => {
    return boatWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return boatWorkshopApp.getAppInfo();
  },
};

export default BoatWorkshop;
