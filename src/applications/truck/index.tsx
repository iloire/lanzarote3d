import * as THREE from 'three';
import { Truck } from '../../foundation/components/vehicles';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Truck Workshop Demo - Showcases truck component with movement variations
 */
class TruckWorkshopApp extends WorkshopDemoBase {
  private trucks: THREE.Object3D[] = [];

  constructor() {
    super({
      name: 'Truck Workshop',
      description: 'Workshop demo showcasing truck component variations with driving movement',
      ground: {
        create: true,
        size: { width: 1500, height: 1200 },
        color: 0x8b4513, // Brown ground for construction/industrial area
        opacity: 0.9,
      },
      lighting: {
        sunPosition: 16,
        showHelpers: false,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, controls } = options;

      // Create multiple truck variations
      await this.createTruckVariations(scene);

      // Set up camera for truck showcase - further back due to truck size
      camera.position.set(300, 500, 700);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with ${this.trucks.length} trucks driving around`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createTruckVariations(scene: THREE.Scene): Promise<void> {
    const truckConfigurations = [
      {
        cabColor: '#0066CC',
        bedColor: '#004499',
        position: new THREE.Vector3(-300, 0, -300),
        scale: 4,
        name: 'Blue Work Truck',
      },
      {
        cabColor: '#CC0000',
        bedColor: '#990000',
        position: new THREE.Vector3(300, 0, -300),
        scale: 3.5,
        name: 'Red Pickup Truck',
      },
      {
        cabColor: '#FFAA00',
        bedColor: '#DD8800',
        position: new THREE.Vector3(-300, 0, 300),
        scale: 4.5,
        name: 'Orange Construction Truck',
      },
      {
        cabColor: '#006600',
        bedColor: '#004400',
        position: new THREE.Vector3(300, 0, 300),
        scale: 3.8,
        name: 'Green Farm Truck',
      },
      {
        cabColor: '#FFFFFF',
        bedColor: '#DDDDDD',
        position: new THREE.Vector3(0, 0, 0),
        scale: 5,
        name: 'White Heavy Duty Truck',
      },
    ];

    // Load all trucks concurrently
    const truckPromises = truckConfigurations.map(async config => {
      const truck = new Truck({
        cabColor: config.cabColor,
        bedColor: config.bedColor,
        scale: config.scale,
        radius: 200 + Math.random() * 150, // Vary the driving radius
        speed: 0.15 + Math.random() * 0.2, // Trucks move slower than cars
      });

      const truckMesh = await truck.load();
      truckMesh.position.copy(config.position);

      scene.add(truckMesh);
      this.trucks.push(truckMesh);

      console.log(
        `Added ${config.name} at position (${config.position.x}, ${config.position.y}, ${config.position.z})`
      );
      return truckMesh;
    });

    await Promise.all(truckPromises);

    // Add some industrial elements for visual context
    this.createIndustrialContext(scene);
  }

  private createIndustrialContext(scene: THREE.Scene): void {
    // Create industrial road system
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

    // Main highway
    const highway = new THREE.PlaneGeometry(1200, 60);
    const highwayMesh = new THREE.Mesh(highway, roadMaterial);
    highwayMesh.rotation.x = -Math.PI / 2;
    highwayMesh.position.y = 0.1;
    scene.add(highwayMesh);

    // Cross road
    const crossRoad = new THREE.PlaneGeometry(60, 1000);
    const crossRoadMesh = new THREE.Mesh(crossRoad, roadMaterial);
    crossRoadMesh.rotation.x = -Math.PI / 2;
    crossRoadMesh.position.y = 0.1;
    scene.add(crossRoadMesh);

    // Road markings
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    // Highway center lines
    const hLineGeometry = new THREE.PlaneGeometry(1200, 3);
    const hLineMesh = new THREE.Mesh(hLineGeometry, lineMaterial);
    hLineMesh.rotation.x = -Math.PI / 2;
    hLineMesh.position.y = 0.2;
    scene.add(hLineMesh);

    // Cross road center line
    const vLineGeometry = new THREE.PlaneGeometry(3, 1000);
    const vLineMesh = new THREE.Mesh(vLineGeometry, lineMaterial);
    vLineMesh.rotation.x = -Math.PI / 2;
    vLineMesh.position.y = 0.2;
    scene.add(vLineMesh);

    // Add some construction cones for atmosphere
    this.createConstructionCones(scene);
  }

  private createConstructionCones(scene: THREE.Scene): void {
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const coneGeometry = new THREE.ConeGeometry(8, 25, 8);

    const conePositions = [
      new THREE.Vector3(-150, 12.5, -150),
      new THREE.Vector3(150, 12.5, -150),
      new THREE.Vector3(-150, 12.5, 150),
      new THREE.Vector3(150, 12.5, 150),
      new THREE.Vector3(-75, 12.5, 0),
      new THREE.Vector3(75, 12.5, 0),
    ];

    conePositions.forEach(position => {
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.copy(position);
      cone.castShadow = true;
      scene.add(cone);
    });
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Dispose truck meshes
    this.trucks.forEach(truck => {
      truck.traverse(child => {
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
    this.trucks.length = 0;

    super.dispose();
  }
}

const truckWorkshopApp = new TruckWorkshopApp();

const TruckWorkshop = {
  load: async (options: StoryOptions) => {
    return truckWorkshopApp.load(options);
  },
  dispose: () => {
    return truckWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return truckWorkshopApp.getAppInfo();
  },
};

export default TruckWorkshop;
