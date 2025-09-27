import * as THREE from 'three';
import Boat from '../../../../../foundation/components/scenery/Boat';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Boat Workshop Demo - Showcases boat component with variations
 */
class BoatWorkshopApp extends WorkshopDemoBase {
  private boats: THREE.Mesh[] = [];

  constructor() {
    super({
      name: 'Boat Workshop',
      description: 'Workshop demo showcasing boat component variations and positioning',
      ground: {
        create: true,
        size: { width: 8000, height: 6000 },
        color: 0x4a90e2, // Water-like blue color
        opacity: 0.7,
      },
      lighting: {
        sunPosition: 14,
        showHelpers: false,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, controls } = options;

      // Create multiple boat variations
      this.createBoatVariations(scene);

      // Set up camera for boat showcase - closer view
      camera.position.set(0, 800, 1500);
      camera.lookAt(new THREE.Vector3(0, 100, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.boats.length} boats`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private createBoatVariations(scene: THREE.Scene): void {
    const boatConfigurations = [
      {
        position: new THREE.Vector3(-2000, 100, -1000),
        scale: new THREE.Vector3(1, 1, 1),
        rotation: new THREE.Vector3(0, 0, 0),
        name: 'Standard Boat'
      },
      {
        position: new THREE.Vector3(0, 100, -1000),
        scale: new THREE.Vector3(1.5, 1.2, 1.8),
        rotation: new THREE.Vector3(0, Math.PI / 4, 0),
        name: 'Large Fishing Boat'
      },
      {
        position: new THREE.Vector3(2000, 100, -1000),
        scale: new THREE.Vector3(0.7, 0.8, 0.6),
        rotation: new THREE.Vector3(0, -Math.PI / 6, 0),
        name: 'Small Sailboat'
      },
      {
        position: new THREE.Vector3(-1000, 100, 1000),
        scale: new THREE.Vector3(2, 1.5, 2.5),
        rotation: new THREE.Vector3(0, Math.PI / 2, 0),
        name: 'Large Yacht'
      },
      {
        position: new THREE.Vector3(1000, 100, 1000),
        scale: new THREE.Vector3(0.5, 0.6, 0.4),
        rotation: new THREE.Vector3(0, -Math.PI / 3, 0),
        name: 'Dinghy'
      },
    ];

    boatConfigurations.forEach((config, index) => {
      const boat = new Boat();
      const boatMesh = boat.load();

      // Apply transformations
      boatMesh.position.copy(config.position);
      boatMesh.scale.copy(config.scale);
      boatMesh.rotation.setFromVector3(config.rotation);

      // Add some randomness to make it more interesting
      boatMesh.position.y += Math.random() * 50 - 25; // Small height variation

      scene.add(boatMesh);
      this.boats.push(boatMesh);

      console.log(`Added ${config.name} at position (${config.position.x}, ${config.position.y}, ${config.position.z})`);
    });

    // Add some floating animation
    this.addFloatingAnimation();
  }

  private addFloatingAnimation(): void {
    const originalPositions = this.boats.map(boat => boat.position.y);

    const animate = () => {
      const time = Date.now() * 0.001;

      this.boats.forEach((boat, index) => {
        // Different floating patterns for each boat
        const floatOffset = Math.sin(time + index * 0.5) * 30;
        const bobOffset = Math.cos(time * 1.5 + index * 0.3) * 10;

        boat.position.y = originalPositions[index] + floatOffset + bobOffset;

        // Small rotation for realistic boat movement
        boat.rotation.z = Math.sin(time + index * 0.7) * 0.05;
        boat.rotation.x = Math.cos(time * 0.8 + index * 0.4) * 0.03;
      });

      if (this.isLoaded) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Dispose boat meshes
    this.boats.forEach(boat => {
      boat.traverse(child => {
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
    this.boats.length = 0;

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