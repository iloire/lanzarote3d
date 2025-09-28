import * as THREE from 'three';
import { SmallSailBoat, Tree, Stone } from '../../../../../foundation/components/scenery';
import { House, HouseType } from '../../../../../foundation/components/scenery';
import { PineTree, Igloo, IglooSize } from '../../../../../foundation/components/scenery';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

const createLabel = (text: string, position: THREE.Vector3) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 32px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(12, 3);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = -10;
  return mesh;
};

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
        create: true,
        size: { width: 400, height: 300 },
        color: 0x8fbc8f, // Dark sea green for ground
        opacity: 0.3
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
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
        this.labelMeshes.forEach(label => {
          label.quaternion.copy(camera.quaternion);
        });
      });

      this.isLoaded = true;
      console.log(
        `✅ ${this.config.name} loaded successfully with ${this.componentMeshes.length} components`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadComponents(scene: THREE.Scene, gui: any): Promise<void> {
    // Load igloo
    try {
      const igloo = new Igloo(IglooSize.Medium);
      const iglooMesh = igloo.load();
      iglooMesh.position.set(0, 0, -60);
      iglooMesh.scale.set(0.8, 0.8, 0.8);
      scene.add(iglooMesh);
      this.componentMeshes.push(iglooMesh);

      const iglooLabel = createLabel('Igloo', new THREE.Vector3(0, -10, -60));
      scene.add(iglooLabel);
      this.labelMeshes.push(iglooLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading igloo');
    }

    // Load boat
    try {
      const boat = new SmallSailBoat();
      const boatMesh = boat.load(); // Legacy API doesn't take gui parameter
      boatMesh.position.set(-60, 0, 120);
      scene.add(boatMesh);
      this.componentMeshes.push(boatMesh);

      const boatLabel = createLabel('Boat', new THREE.Vector3(-60, -10, 120));
      scene.add(boatLabel);
      this.labelMeshes.push(boatLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading boat');
    }

    // Load houses
    const houseConfigs = [
      { type: HouseType.Small, position: [80, 0, 0], label: 'Small House' },
      { type: HouseType.Medium, position: [80, 0, 50], label: 'Medium House' },
      { type: HouseType.Large, position: [80, 0, 100], label: 'Large House' },
      { type: HouseType.Modern, position: [80, 0, 150], label: 'Modern House' },
    ];

    for (const config of houseConfigs) {
      try {
        const house = new House(config.type);
        const houseMesh = house.load(gui);
        houseMesh.position.set(config.position[0] ?? 0, config.position[1] ?? 0, config.position[2] ?? 0);
        scene.add(houseMesh);
        this.componentMeshes.push(houseMesh);

        const houseLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2])
        );
        scene.add(houseLabel);
        this.labelMeshes.push(houseLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Load trees
    try {
      const pineTree = new PineTree();
      const pineTreeMesh = pineTree.load();
      pineTreeMesh.scale.set(3, 3, 3);
      pineTreeMesh.position.set(160, 0, 0);
      scene.add(pineTreeMesh);
      this.componentMeshes.push(pineTreeMesh);

      const pineLabel = createLabel('Pine Tree', new THREE.Vector3(160, -10, 0));
      scene.add(pineLabel);
      this.labelMeshes.push(pineLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading pine tree');
    }

    try {
      const tree = new Tree();
      const treeMesh = tree.load();
      treeMesh.scale.set(2, 2, 2);
      treeMesh.position.set(160, 0, 80);
      scene.add(treeMesh);
      this.componentMeshes.push(treeMesh);

      const treeLabel = createLabel('Tree', new THREE.Vector3(160, -10, 80));
      scene.add(treeLabel);
      this.labelMeshes.push(treeLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading tree');
    }

    // Load stones
    const stoneConfigs = [
      { position: [240, 0, 20], scale: [2, 2, 2], label: 'Stone' },
      { position: [240, 0, 100], scale: [1.5, 3, 1.5], label: 'Tall Stone' },
    ];

    for (const config of stoneConfigs) {
      try {
        const stone = new Stone();
        const stoneMesh = stone.load();
        stoneMesh.position.set(config.position[0] ?? 0, config.position[1] ?? 0, config.position[2] ?? 0);
        stoneMesh.scale.set(config.scale[0] ?? 1, config.scale[1] ?? 1, config.scale[2] ?? 1);
        scene.add(stoneMesh);
        this.componentMeshes.push(stoneMesh);

        const stoneLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2])
        );
        scene.add(stoneLabel);
        this.labelMeshes.push(stoneLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Add a simple ground plane for component showcase
    try {
      const groundGeometry = new THREE.PlaneGeometry(600, 400);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x8fbc8f, // Dark sea green for ground
        transparent: true,
        opacity: 0.3
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -15;
      scene.add(ground);
      this.componentMeshes.push(ground);

      const groundLabel = createLabel('Workshop Ground', new THREE.Vector3(0, -10, 0));
      scene.add(groundLabel);
      this.labelMeshes.push(groundLabel);
    } catch (error) {
      this.handleError(error as Error, 'creating workshop ground');
    }
  }

  private setupCamera(camera: THREE.Camera): void {
    const lookAt = new THREE.Vector3(120, 0, 75); // Center point between all spread-out components
    camera.position.set(600, 300, 300); // Much further away to show all scenery
    camera.lookAt(lookAt);
  }


  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

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
