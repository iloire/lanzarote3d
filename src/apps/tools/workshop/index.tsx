import * as THREE from 'three';
import { Paraglider } from '../../../foundation/components/vehicles';
import { Boat, Tree, Stone, Island } from '../../../foundation/components/scenery';
import { House, HouseType } from '../../../foundation/components/scenery';
import { PineTree } from '../../../foundation/components/scenery';
import Helpers from '../../../foundation/utils/helpers';
import { PilotHeadType } from '../../../foundation/components/characters';
import { StoryOptions } from '../../shared/types';
import { AppBase } from '../../shared/AppBase';

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
 * Fourth app converted to use AppBase architecture
 */
class WorkshopApp extends AppBase {
  private animationId?: number;
  private componentMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Mesh[] = [];

  constructor() {
    super({
      name: 'Workshop',
      description: 'Component showcase displaying various 3D objects with interactive labels',
      requiredComponents: [
        'scene',
        'camera',
        'renderer',
        'terrain',
        'water',
        'sky',
        'gui',
        'controls',
      ],
      scene: {
        environment: 'custom',
        lighting: 'static',
        physics: false,
        fog: {
          enabled: false, // Workshop focuses on clear component visibility
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 20000, // Log performance every 20 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

      controls.enabled = true;

      terrain.visible = false;
      water.visible = false;

      Helpers.createHelpers(scene);

      sky.updateSunPosition(12);

      // Load all components with proper tracking
      await this.loadComponents(scene, gui);

      // Setup camera and animation
      this.setupCamera(camera);
      this.startAnimationLoop(camera, renderer, scene, controls);

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
    // Load paraglider
    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      inletsColor: '#333333',
      numeroCajones: 40,
    };

    const pilotOptions = {
      head: {
        headType: PilotHeadType.Default,
        helmetOptions: {
          color: '#ffffff',
          color2: '#cccccc',
          color3: '#999999',
        },
      },
    };

    try {
      const paraglider = new Paraglider({
        glider: gliderOptions,
        pilot: pilotOptions,
      });
      const mesh = await paraglider.load(gui);
      mesh.position.set(-20, 0, 0);
      mesh.scale.set(0.01, 0.01, 0.01);
      scene.add(mesh);
      this.componentMeshes.push(mesh);
    } catch (error) {
      this.handleError(error as Error, 'loading paraglider');
    }

    // Load boat
    try {
      const boat = new Boat();
      const boatMesh = boat.load(gui);
      boatMesh.position.set(-30, 0, 80);
      scene.add(boatMesh);
      this.componentMeshes.push(boatMesh);

      const boatLabel = createLabel('Boat', new THREE.Vector3(-30, -10, 80));
      scene.add(boatLabel);
      this.labelMeshes.push(boatLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading boat');
    }

    // Load houses
    const houseConfigs = [
      { type: HouseType.Small, position: [0, 0, 0], label: 'Small House' },
      { type: HouseType.Medium, position: [0, 0, 30], label: 'Medium House' },
      { type: HouseType.Large, position: [0, 0, 60], label: 'Large House' },
      { type: HouseType.Modern, position: [0, 0, 90], label: 'Modern House' },
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
      pineTreeMesh.position.set(30, 0, 120);
      scene.add(pineTreeMesh);
      this.componentMeshes.push(pineTreeMesh);

      const pineLabel = createLabel('Pine Tree', new THREE.Vector3(30, -10, 120));
      scene.add(pineLabel);
      this.labelMeshes.push(pineLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading pine tree');
    }

    try {
      const tree = new Tree();
      const treeMesh = tree.load();
      treeMesh.scale.set(2, 2, 2);
      treeMesh.position.set(60, 0, 120);
      scene.add(treeMesh);
      this.componentMeshes.push(treeMesh);

      const treeLabel = createLabel('Tree', new THREE.Vector3(60, -10, 120));
      scene.add(treeLabel);
      this.labelMeshes.push(treeLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading tree');
    }

    // Load stones
    const stoneConfigs = [
      { position: [100, 0, 30], scale: [2, 2, 2], label: 'Stone' },
      { position: [130, 0, 60], scale: [1.5, 3, 1.5], label: 'Tall Stone' },
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

    // Load island (async loading)
    try {
      const loadingManager = new THREE.LoadingManager();
      const islandMesh = await Island.load(loadingManager);
      islandMesh.position.set(-50, 0, 50);
      islandMesh.scale.set(0.5, 0.5, 0.5);
      scene.add(islandMesh);
      this.componentMeshes.push(islandMesh);

      const islandLabel = createLabel('Island', new THREE.Vector3(-50, -10, 50));
      scene.add(islandLabel);
      this.labelMeshes.push(islandLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading island');
    }
  }

  private setupCamera(camera: THREE.Camera): void {
    const lookAt = new THREE.Vector3(40, 0, 60); // Center point between all spread-out components
    camera.position.set(400, 200, -150); // Much further away to show all scenery
    camera.lookAt(lookAt);
  }

  private startAnimationLoop(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    controls: any
  ): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Keep labels facing the camera
        this.labelMeshes.forEach(label => {
          label.quaternion.copy(camera.quaternion);
        });

        renderer.render(scene, camera);
        controls.update();
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
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
