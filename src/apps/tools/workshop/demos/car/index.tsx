import * as THREE from 'three';
import { Car } from '../../../../../foundation/components/vehicles';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Car Workshop Demo - Showcases car component with movement variations
 */
class CarWorkshopApp extends WorkshopDemoBase {
  private cars: THREE.Object3D[] = [];

  constructor() {
    super({
      name: 'Car Workshop',
      description: 'Workshop demo showcasing car component variations with driving movement',
      ground: {
        create: true,
        size: { width: 1200, height: 1000 },
        color: 0x90EE90, // Light green ground for roads/grass
        opacity: 0.8,
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

      // Create multiple car variations
      await this.createCarVariations(scene);

      // Set up camera for car showcase
      camera.position.set(200, 400, 600);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      this.startAnimationLoop(renderer, scene, camera, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.cars.length} cars driving around`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createCarVariations(scene: THREE.Scene): Promise<void> {
    const carConfigurations = [
      {
        bodyColor: '#CC0000',
        roofColor: '#990000',
        position: new THREE.Vector3(-200, 0, -200),
        scale: 3,
        name: 'Red Sports Car'
      },
      {
        bodyColor: '#0066CC',
        roofColor: '#004499',
        position: new THREE.Vector3(200, 0, -200),
        scale: 2.5,
        name: 'Blue Sedan'
      },
      {
        bodyColor: '#FFFF00',
        roofColor: '#CCCC00',
        position: new THREE.Vector3(-200, 0, 200),
        scale: 2.8,
        name: 'Yellow Taxi'
      },
      {
        bodyColor: '#FFFFFF',
        roofColor: '#DDDDDD',
        position: new THREE.Vector3(200, 0, 200),
        scale: 3.2,
        name: 'White SUV'
      },
      {
        bodyColor: '#000000',
        roofColor: '#333333',
        position: new THREE.Vector3(0, 0, 0),
        scale: 3.5,
        name: 'Black Luxury Car'
      },
    ];

    // Load all cars concurrently
    const carPromises = carConfigurations.map(async (config) => {
      const car = new Car({
        bodyColor: config.bodyColor,
        roofColor: config.roofColor,
        scale: config.scale,
        radius: 150 + Math.random() * 100, // Vary the driving radius
        speed: 0.3 + Math.random() * 0.3,   // Vary the driving speed
      });

      const carMesh = await car.load();
      carMesh.position.copy(config.position);

      scene.add(carMesh);
      this.cars.push(carMesh);

      console.log(`Added ${config.name} at position (${config.position.x}, ${config.position.y}, ${config.position.z})`);
      return carMesh;
    });

    await Promise.all(carPromises);

    // Add some road markings for visual context
    this.createRoadMarkings(scene);
  }

  private createRoadMarkings(scene: THREE.Scene): void {
    // Create simple road markings to give context
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });

    // Horizontal road
    const horizontalRoad = new THREE.PlaneGeometry(800, 40);
    const hRoadMesh = new THREE.Mesh(horizontalRoad, roadMaterial);
    hRoadMesh.rotation.x = -Math.PI / 2;
    hRoadMesh.position.y = 0.1; // Slightly above ground
    scene.add(hRoadMesh);

    // Vertical road
    const verticalRoad = new THREE.PlaneGeometry(40, 800);
    const vRoadMesh = new THREE.Mesh(verticalRoad, roadMaterial);
    vRoadMesh.rotation.x = -Math.PI / 2;
    vRoadMesh.position.y = 0.1; // Slightly above ground
    scene.add(vRoadMesh);

    // Road center lines
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    // Horizontal center line
    const hLineGeometry = new THREE.PlaneGeometry(800, 2);
    const hLineMesh = new THREE.Mesh(hLineGeometry, lineMaterial);
    hLineMesh.rotation.x = -Math.PI / 2;
    hLineMesh.position.y = 0.2;
    scene.add(hLineMesh);

    // Vertical center line
    const vLineGeometry = new THREE.PlaneGeometry(2, 800);
    const vLineMesh = new THREE.Mesh(vLineGeometry, lineMaterial);
    vLineMesh.rotation.x = -Math.PI / 2;
    vLineMesh.position.y = 0.2;
    scene.add(vLineMesh);
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Dispose car meshes
    this.cars.forEach(car => {
      car.traverse(child => {
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
    this.cars.length = 0;

    super.dispose();
  }
}

const carWorkshopApp = new CarWorkshopApp();

const CarWorkshop = {
  load: async (options: StoryOptions) => {
    return carWorkshopApp.load(options);
  },
  dispose: () => {
    return carWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return carWorkshopApp.getAppInfo();
  },
};

export default CarWorkshop;