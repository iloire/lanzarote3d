import * as THREE from 'three';
import {
  SmallSailBoat,
  FishingBoat,
  Yacht,
  SpeedBoat,
  PatrolBoat,
} from '../../foundation/components/scenery';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Boats Workshop Demo - Showcases multiple boat components with variations
 */
class BoatsWorkshopApp extends WorkshopDemoBase {
  private boats: (THREE.Mesh | THREE.Group)[] = [];

  constructor() {
    super({
      name: 'Boats Workshop',
      description: 'Workshop demo showcasing multiple boat component variations and positioning',
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

      // Create multiple boat variations
      await this.createBoatVariations(scene);

      // Set up camera for boat showcase - much closer view
      camera.position.set(0, 300, 500);
      camera.lookAt(new THREE.Vector3(0, 50, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with ${this.boats.length} boats including PatrolBoat with movement`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createBoatVariations(scene: THREE.Scene): Promise<void> {
    const boatConfigurations = [
      {
        type: 'SmallSailBoat',
        position: new THREE.Vector3(-120, 50, -80),
        scale: 4,
        rotation: new THREE.Vector3(0, 0, 0),
        name: 'Small Sailboat',
      },
      {
        type: 'FishingBoat',
        position: new THREE.Vector3(0, 50, -80),
        scale: 3,
        rotation: new THREE.Vector3(0, Math.PI / 4, 0),
        name: 'Fishing Boat',
      },
      {
        type: 'Yacht',
        position: new THREE.Vector3(150, 50, -80),
        scale: 2.5,
        rotation: new THREE.Vector3(0, -Math.PI / 6, 0),
        name: 'Luxury Yacht',
      },
      {
        type: 'SpeedBoat',
        position: new THREE.Vector3(-60, 50, 80),
        scale: 3.5,
        rotation: new THREE.Vector3(0, Math.PI / 2, 0),
        name: 'Speed Boat',
      },
      {
        type: 'SmallSailBoat',
        position: new THREE.Vector3(90, 50, 80),
        scale: 2.5,
        rotation: new THREE.Vector3(0, -Math.PI / 3, 0),
        name: 'Mini Sailboat',
      },
      {
        type: 'PatrolBoat',
        position: new THREE.Vector3(-150, 50, 0),
        scale: 2.8,
        rotation: new THREE.Vector3(0, Math.PI / 8, 0),
        name: 'Coast Guard Patrol',
      },
    ];

    // Load all boats concurrently
    const boatPromises = boatConfigurations.map(async config => {
      let boat: any;
      let boatMesh: THREE.Mesh | THREE.Group;

      // Create appropriate boat type with modern API
      switch (config.type) {
        case 'SmallSailBoat':
          boat = new SmallSailBoat({ scale: config.scale });
          boatMesh = await boat.load();
          break;
        case 'FishingBoat':
          boat = new FishingBoat({ scale: config.scale });
          boatMesh = await boat.load();
          break;
        case 'Yacht':
          boat = new Yacht({ scale: config.scale });
          boatMesh = await boat.load();
          break;
        case 'SpeedBoat':
          boat = new SpeedBoat({ scale: config.scale });
          boatMesh = await boat.load();
          break;
        case 'PatrolBoat':
          boat = new PatrolBoat({ scale: config.scale });
          boatMesh = await boat.load();
          break;
        default:
          boat = new SmallSailBoat({ scale: config.scale });
          boatMesh = await boat.load();
      }

      // Apply transformations
      boatMesh.position.copy(config.position);
      boatMesh.rotation.setFromVector3(config.rotation);

      scene.add(boatMesh);
      this.boats.push(boatMesh);

      console.log(
        `Added ${config.name} at position (${config.position.x}, ${config.position.y}, ${config.position.z})`
      );
      return boatMesh;
    });

    await Promise.all(boatPromises);

    // Note: Boats now have built-in floating animation via FloatingThreeComponent base class
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

const boatsWorkshopApp = new BoatsWorkshopApp();

const BoatsWorkshop = {
  load: async (options: StoryOptions) => {
    return boatsWorkshopApp.load(options);
  },
  dispose: () => {
    return boatsWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return boatsWorkshopApp.getAppInfo();
  },
};

export default BoatsWorkshop;