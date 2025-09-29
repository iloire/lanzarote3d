import * as THREE from 'three';
import { Tree, Stone } from '../../../../../foundation/components/scenery';
import { House, HouseType } from '../../../../../foundation/components/scenery/buildings';
import { PineTree, PalmTree, CoconutPalm, DatePalm, FanPalm, Igloo, IglooSize, Pool, SaguaroCactus, BarrelCactus, PricklyPearCactus, OrganPipeCactus } from '../../../../../foundation/components/scenery';
import { VillaLegacy as Villa, TownhouseLegacy as Townhouse, BarnLegacy as Barn, DesertHouseLegacy as DesertHouse, DomeLegacy as Dome, DesertHouseWithPoolLegacy as DesertHouseWithPool } from '../../../../../foundation/components/scenery';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Count the total number of triangles/polygons in a 3D object
 */
const countPolygons = (object: THREE.Object3D): number => {
  let totalTriangles = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;

      if (geometry.index !== null) {
        // Indexed geometry
        totalTriangles += geometry.index.count / 3;
      } else {
        // Non-indexed geometry
        const positionAttribute = geometry.getAttribute('position');
        if (positionAttribute) {
          totalTriangles += positionAttribute.count / 3;
        }
      }
    }
  });

  return Math.floor(totalTriangles);
};

/**
 * Format polygon count for display
 */
const formatPolygonCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const createLabel = (text: string, position: THREE.Vector3, polygonCount?: number) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 320;
  canvas.height = 80;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Main title
    context.font = 'bold 28px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, 30);

    // Polygon count
    if (polygonCount !== undefined) {
      context.font = '20px Arial';
      context.fillStyle = '#ffff00'; // Yellow for polygon count
      context.fillText(`${formatPolygonCount(polygonCount)} polys`, canvas.width / 2, 55);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(15, 4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = 25; // Position labels above the models
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
        create: false,
        size: { width: 400, height: 300 },
        color: 0x8fbc8f, // Dark sea green for ground
        opacity: 0.3,
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
      iglooMesh.position.set(0, -15, -60);
      iglooMesh.scale.set(0.8, 0.8, 0.8);
      scene.add(iglooMesh);
      this.componentMeshes.push(iglooMesh);

      const iglooPolygons = countPolygons(iglooMesh);
      const iglooLabel = createLabel('Igloo', new THREE.Vector3(0, -10, -60), iglooPolygons);
      scene.add(iglooLabel);
      this.labelMeshes.push(iglooLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading igloo');
    }

    // Load houses - organized with better spacing to avoid overlapping
    const houseConfigs = [
      { type: HouseType.Small, position: [50, 0, -20], label: 'Small House' },
      { type: HouseType.Medium, position: [50, 0, 20], label: 'Medium House' },
      { type: HouseType.Large, position: [50, 0, 60], label: 'Large House' },
      { type: HouseType.Modern, position: [90, 0, 20], label: 'Modern House' },
    ];

    for (const config of houseConfigs) {
      try {
        const house = new House({ type: config.type });
        const houseMesh = house.load(gui);
        houseMesh.position.set(
          config.position[0] ?? 0,
          -15, // Ground level
          config.position[2] ?? 0
        );
        scene.add(houseMesh);
        this.componentMeshes.push(houseMesh);

        const housePolygons = countPolygons(houseMesh);
        const houseLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2]),
          housePolygons
        );
        scene.add(houseLabel);
        this.labelMeshes.push(houseLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Load new building types - organized grid with better spacing
    const buildingConfigs = [
      { type: 'Villa', position: [-50, 0, 40], scale: 0.6, label: 'Villa' },
      { type: 'Townhouse', position: [-50, 0, 80], scale: 0.8, label: 'Townhouse' },
      { type: 'Barn', position: [-100, 0, 0], scale: 0.6, label: 'Barn' },
      { type: 'DesertHouse', position: [-100, 0, 40], scale: 0.8, label: 'Desert House' },
      { type: 'Dome', position: [-100, 0, 80], scale: 0.8, label: 'Dome' },
      { type: 'DesertHouseWithPool', position: [-150, 0, 20], scale: 0.6, label: 'Desert House + Pool' },
    ];

    for (const config of buildingConfigs) {
      try {
        let building;

        switch (config.type) {
          case 'Villa':
            building = new Villa({ scale: config.scale });
            break;
          case 'Townhouse':
            building = new Townhouse({ scale: config.scale });
            break;
          case 'Barn':
            building = new Barn({ scale: config.scale });
            break;
          case 'DesertHouse':
            building = new DesertHouse({ scale: config.scale });
            break;
          case 'Dome':
            building = new Dome({ scale: config.scale });
            break;
          case 'DesertHouseWithPool':
            building = new DesertHouseWithPool({ scale: config.scale });
            break;
          default:
            continue;
        }

        const buildingMesh = building.load();
        buildingMesh.position.set(
          config.position[0] ?? 0,
          -15, // Ground level
          config.position[2] ?? 0
        );
        scene.add(buildingMesh);
        this.componentMeshes.push(buildingMesh);

        const buildingPolygons = countPolygons(buildingMesh);
        const buildingLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2]),
          buildingPolygons
        );
        scene.add(buildingLabel);
        this.labelMeshes.push(buildingLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Load trees - organized grid with better spacing
    const treeConfigs = [
      { type: 'Pine', position: [120, 0, 0], scale: 2.5, label: 'Pine Tree', component: PineTree },
      { type: 'Tree', position: [120, 0, 30], scale: 2, label: 'Tree', component: Tree },
      { type: 'Palm', position: [120, 0, 60], scale: 2, label: 'Palm Tree', component: PalmTree },
      { type: 'Coconut', position: [160, 0, 0], scale: 2, label: 'Coconut Palm', component: CoconutPalm },
      { type: 'Date', position: [160, 0, 30], scale: 2, label: 'Date Palm', component: DatePalm },
      { type: 'Fan', position: [160, 0, 60], scale: 1.5, label: 'Fan Palm', component: FanPalm },
    ];

    for (const config of treeConfigs) {
      try {
        const tree = new config.component();
        const treeMesh = tree.load();
        treeMesh.scale.set(config.scale, config.scale, config.scale);
        treeMesh.position.set(
          config.position[0] ?? 0,
          -15, // Ground level
          config.position[2] ?? 0
        );
        scene.add(treeMesh);
        this.componentMeshes.push(treeMesh);

        const treePolygons = countPolygons(treeMesh);
        const treeLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2]),
          treePolygons
        );
        scene.add(treeLabel);
        this.labelMeshes.push(treeLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Load stones - organized with better spacing
    const stoneConfigs = [
      { position: [200, 0, 0], scale: [2, 2, 2], label: 'Stone' },
      { position: [200, 0, 30], scale: [1.5, 3, 1.5], label: 'Tall Stone' },
    ];

    for (const config of stoneConfigs) {
      try {
        const stone = new Stone();
        const stoneMesh = stone.load();
        stoneMesh.position.set(
          config.position[0] ?? 0,
          -15, // Ground level
          config.position[2] ?? 0
        );
        stoneMesh.scale.set(config.scale[0] ?? 1, config.scale[1] ?? 1, config.scale[2] ?? 1);
        scene.add(stoneMesh);
        this.componentMeshes.push(stoneMesh);

        const stonePolygons = countPolygons(stoneMesh);
        const stoneLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2]),
          stonePolygons
        );
        scene.add(stoneLabel);
        this.labelMeshes.push(stoneLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Load standalone Pool
    try {
      const pool = new Pool();
      const poolMesh = pool.load();
      poolMesh.position.set(320, -15, 30);
      poolMesh.scale.set(0.8, 0.8, 0.8);
      scene.add(poolMesh);
      this.componentMeshes.push(poolMesh);

      const poolPolygons = countPolygons(poolMesh);
      const poolLabel = createLabel('Pool', new THREE.Vector3(320, -10, 30), poolPolygons);
      scene.add(poolLabel);
      this.labelMeshes.push(poolLabel);
    } catch (error) {
      this.handleError(error as Error, 'loading pool');
    }

    // Load cactus types - organized with better spacing
    const cactusConfigs = [
      { type: 'Saguaro', position: [240, 0, 0], scale: 0.6, label: 'Saguaro Cactus' },
      { type: 'Barrel', position: [240, 0, 30], scale: 1.0, label: 'Barrel Cactus' },
      { type: 'PricklyPear', position: [240, 0, 60], scale: 0.8, label: 'Prickly Pear' },
      { type: 'OrganPipe', position: [280, 0, 20], scale: 0.7, label: 'Organ Pipe Cactus' },
    ];

    for (const config of cactusConfigs) {
      try {
        let cactus;

        switch (config.type) {
          case 'Saguaro':
            cactus = new SaguaroCactus({ scale: config.scale });
            break;
          case 'Barrel':
            cactus = new BarrelCactus({ scale: config.scale });
            break;
          case 'PricklyPear':
            cactus = new PricklyPearCactus({ scale: config.scale });
            break;
          case 'OrganPipe':
            cactus = new OrganPipeCactus({ scale: config.scale });
            break;
          default:
            continue;
        }

        const cactusMesh = cactus.load();
        cactusMesh.position.set(
          config.position[0] ?? 0,
          -15, // Ground level
          config.position[2] ?? 0
        );
        scene.add(cactusMesh);
        this.componentMeshes.push(cactusMesh);

        const cactusPolygons = countPolygons(cactusMesh);
        const cactusLabel = createLabel(
          config.label,
          new THREE.Vector3(config.position[0], -10, config.position[2]),
          cactusPolygons
        );
        scene.add(cactusLabel);
        this.labelMeshes.push(cactusLabel);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.label}`);
      }
    }

    // Add a simple ground plane for component showcase
    try {
      const groundGeometry = new THREE.PlaneGeometry(500, 200);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x8fbc8f, // Dark sea green for ground
        transparent: true,
        opacity: 0.3,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -15;
      scene.add(ground);
      this.componentMeshes.push(ground);

      const groundPolygons = countPolygons(ground);
      const groundLabel = createLabel('Workshop Ground', new THREE.Vector3(0, -10, 0), groundPolygons);
      scene.add(groundLabel);
      this.labelMeshes.push(groundLabel);
    } catch (error) {
      this.handleError(error as Error, 'creating workshop ground');
    }
  }

  private setupCamera(camera: THREE.Camera): void {
    const lookAt = new THREE.Vector3(100, 0, 40); // Center point for reorganized compact layout
    camera.position.set(400, 200, 300); // Closer position for better view of organized components
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
