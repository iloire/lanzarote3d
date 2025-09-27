import * as THREE from 'three';
import { SmallSailBoat, FishingBoat, Yacht, SpeedBoat } from '../../../../../foundation/components/scenery';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Boat Workshop Demo - Showcases boat component with variations
 */
class BoatWorkshopApp extends WorkshopDemoBase {
  private boats: (THREE.Mesh | THREE.Group)[] = [];

  constructor() {
    super({
      name: 'Boat Workshop',
      description: 'Workshop demo showcasing boat component variations and positioning',
      ground: {
        create: true,
        size: { width: 1000, height: 800 },
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

      // Set up camera for boat showcase - much closer view
      camera.position.set(0, 300, 500);
      camera.lookAt(new THREE.Vector3(0, 50, 0));

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
        type: 'SmallSailBoat',
        position: new THREE.Vector3(-120, 50, -80),
        scale: new THREE.Vector3(4, 4, 4),
        rotation: new THREE.Vector3(0, 0, 0),
        name: 'Small Sailboat'
      },
      {
        type: 'FishingBoat',
        position: new THREE.Vector3(0, 50, -80),
        scale: new THREE.Vector3(3, 3, 3),
        rotation: new THREE.Vector3(0, Math.PI / 4, 0),
        name: 'Fishing Boat'
      },
      {
        type: 'Yacht',
        position: new THREE.Vector3(150, 50, -80),
        scale: new THREE.Vector3(2.5, 2.5, 2.5),
        rotation: new THREE.Vector3(0, -Math.PI / 6, 0),
        name: 'Luxury Yacht'
      },
      {
        type: 'SpeedBoat',
        position: new THREE.Vector3(-60, 50, 80),
        scale: new THREE.Vector3(3.5, 3.5, 3.5),
        rotation: new THREE.Vector3(0, Math.PI / 2, 0),
        name: 'Speed Boat'
      },
      {
        type: 'SmallSailBoat',
        position: new THREE.Vector3(90, 50, 80),
        scale: new THREE.Vector3(2.5, 2.5, 2.5),
        rotation: new THREE.Vector3(0, -Math.PI / 3, 0),
        name: 'Mini Sailboat'
      },
    ];

    boatConfigurations.forEach((config) => {
      let boat: any;
      let boatMesh: THREE.Mesh | THREE.Group;

      // Create appropriate boat type
      switch (config.type) {
        case 'SmallSailBoat':
          boat = new SmallSailBoat();
          boatMesh = boat.load();
          break;
        case 'FishingBoat':
          boat = new FishingBoat();
          boatMesh = boat.load();
          break;
        case 'Yacht':
          boat = new Yacht();
          boatMesh = boat.load();
          break;
        case 'SpeedBoat':
          boat = new SpeedBoat();
          boatMesh = boat.load();
          break;
        default:
          boat = new SmallSailBoat();
          boatMesh = boat.load();
      }

      // Apply transformations
      boatMesh.position.copy(config.position);
      boatMesh.scale.copy(config.scale);
      boatMesh.rotation.setFromVector3(config.rotation);

      // Add some randomness to make it more interesting
      boatMesh.position.y += Math.random() * 10 - 5; // Small height variation

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
        // Different floating patterns for each boat - reduced amplitude
        const floatOffset = Math.sin(time + index * 0.5) * 8;
        const bobOffset = Math.cos(time * 1.5 + index * 0.3) * 3;

        boat.position.y = originalPositions[index] + floatOffset + bobOffset;

        // Small rotation for realistic boat movement
        boat.rotation.z = Math.sin(time + index * 0.7) * 0.02;
        boat.rotation.x = Math.cos(time * 0.8 + index * 0.4) * 0.01;
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