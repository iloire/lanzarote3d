import * as THREE from 'three';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';
import { HouseGroupCreator } from '../../../../shared/env/house-group-creator';
import { ComponentRegistry } from '../../../../../foundation/systems/ComponentRegistry';
import { DEFAULT_VARIATION, NeighborhoodVariation } from '../../../../shared/env/house-group-types';

const createLabel = (text: string, position: THREE.Vector3) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 36px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(20, 5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = 50;
  return mesh;
};

/**
 * Town Workshop - Showcase of neighborhood generation using HouseGroupCreator
 * Demonstrates different neighborhood formations and house distributions
 */
class TownWorkshop extends WorkshopDemoBase {
  private neighborhoodMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Mesh[] = [];
  private houseGroupCreator!: HouseGroupCreator;
  private componentRegistry!: ComponentRegistry;

  constructor() {
    super({
      name: 'Town Workshop',
      description: 'Neighborhood generation showcase displaying various residential formations',
      ground: {
        create: true,
        size: { width: 2000, height: 1500 },
        color: 0x7CFC00, // Lawn green for town ground
        opacity: 0.4,
      },
      lighting: {
        sunPosition: 10,
        showHelpers: true,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems and clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Initialize component registry and house group creator
      this.componentRegistry = new ComponentRegistry();
      this.houseGroupCreator = new HouseGroupCreator(scene, this.componentRegistry);

      // Load all neighborhoods with proper tracking
      await this.loadNeighborhoods(scene, gui);

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
        `✅ ${this.config.name} loaded successfully with ${this.neighborhoodMeshes.length} houses`
      );
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadNeighborhoods(scene: THREE.Scene, gui: any): Promise<void> {
    // Define neighborhood configurations
    const neighborhoods: Array<{
      name: string;
      center: THREE.Vector3;
      type: 'suburban' | 'urban' | 'rural' | 'cul-de-sac' | 'street' | 'grid' | 'luxury' | 'random';
      size?: 'small' | 'medium' | 'large';
      density?: 'compact' | 'dense' | 'downtown';
      style?: 'farmstead' | 'village' | 'scattered';
      houses?: number;
      variation: NeighborhoodVariation;
    }> = [
      {
        name: 'Suburban (Medium)',
        center: new THREE.Vector3(-400, 0, -300),
        type: 'suburban',
        size: 'medium',
        variation: DEFAULT_VARIATION,
      },
      {
        name: 'Urban Dense',
        center: new THREE.Vector3(0, 0, -300),
        type: 'urban',
        density: 'dense',
        variation: { ...DEFAULT_VARIATION, poolChance: 0.1 },
      },
      {
        name: 'Rural Village',
        center: new THREE.Vector3(400, 0, -300),
        type: 'rural',
        style: 'village',
        variation: { ...DEFAULT_VARIATION, poolChance: 0.5 },
      },
      {
        name: 'Cul-de-Sac',
        center: new THREE.Vector3(-400, 0, 0),
        type: 'cul-de-sac',
        houses: 8,
        variation: { ...DEFAULT_VARIATION, poolChance: 0.4 },
      },
      {
        name: 'Main Street',
        center: new THREE.Vector3(0, 0, 0),
        type: 'street',
        houses: 12,
        variation: { ...DEFAULT_VARIATION, poolChance: 0.25 },
      },
      {
        name: 'Grid Neighborhood',
        center: new THREE.Vector3(400, 0, 0),
        type: 'grid',
        houses: 15,
        variation: DEFAULT_VARIATION,
      },
      {
        name: 'Luxury Suburban',
        center: new THREE.Vector3(-400, 0, 300),
        type: 'luxury',
        variation: { ...DEFAULT_VARIATION, poolChance: 0.8 },
      },
      {
        name: 'Mixed Random',
        center: new THREE.Vector3(0, 0, 300),
        type: 'random',
        houses: 18,
        variation: { ...DEFAULT_VARIATION, poolChance: 0.35 },
      },
      {
        name: 'Large Suburban',
        center: new THREE.Vector3(400, 0, 300),
        type: 'suburban',
        size: 'large',
        variation: { ...DEFAULT_VARIATION, poolChance: 0.45 },
      },
    ];

    // Create each neighborhood
    for (const config of neighborhoods) {
      try {
        let houses: THREE.Object3D[] = [];

        switch (config.type) {
          case 'suburban':
            houses = await this.houseGroupCreator.createSuburbanNeighborhood(
              config.center,
              config.size || 'medium',
              config.variation
            );
            break;

          case 'urban':
            houses = await this.houseGroupCreator.createUrbanNeighborhood(
              config.center,
              config.density || 'dense',
              config.variation
            );
            break;

          case 'rural':
            houses = await this.houseGroupCreator.createRuralNeighborhood(
              config.center,
              config.style || 'village',
              config.variation
            );
            break;

          case 'cul-de-sac':
            const culDeSacHouses = this.generateMixedHouses(config.houses || 8);
            houses = await this.houseGroupCreator.createCulDeSac(
              config.center,
              culDeSacHouses
            );
            break;

          case 'street':
            const streetHouses = this.generateMixedHouses(config.houses || 12);
            houses = await this.houseGroupCreator.createStreetNeighborhood(
              config.center,
              streetHouses
            );
            break;

          case 'grid':
            const gridHouses = this.generateMixedHouses(config.houses || 15);
            houses = await this.houseGroupCreator.createGridNeighborhood(
              config.center,
              gridHouses,
              80,
              3
            );
            break;

          case 'luxury':
            houses = await this.houseGroupCreator.createMixedNeighborhood(
              config.center,
              12,
              'suburban',
              {
                'Villa': 0.4,
                'DesertHouseWithPool': 0.3,
                'House': 0.2,
                'Townhouse': 0.1,
              },
              config.variation
            );
            break;

          case 'random':
            const randomHouses = this.generateMixedHouses(config.houses || 18);
            houses = await this.houseGroupCreator.createRandomNeighborhood(
              config.center,
              randomHouses,
              250
            );
            break;

          default:
            console.warn(`Unknown neighborhood type: ${config.type}`);
            continue;
        }

        // Track all house meshes
        this.neighborhoodMeshes.push(...houses);

        // Create label for this neighborhood
        const label = createLabel(config.name, config.center);
        scene.add(label);
        this.labelMeshes.push(label);

        console.log(`✅ Created ${config.name} with ${houses.length} houses`);
      } catch (error) {
        this.handleError(error as Error, `loading ${config.name}`);
      }
    }

    // Add roads and infrastructure
    this.createRoads(scene);
  }

  /**
   * Generate a land plot for a house based on type and scale
   */
  private generateLandPlot(houseType: string, scale: number) {
    const baseWidths: Record<string, number> = {
      'House': 60,
      'Villa': 100,
      'Townhouse': 50,
      'Barn': 80,
      'DesertHouse': 70,
      'Dome': 55,
      'DesertHouseWithPool': 90,
    };

    const baseDepths: Record<string, number> = {
      'House': 60,
      'Villa': 90,
      'Townhouse': 70,
      'Barn': 100,
      'DesertHouse': 80,
      'Dome': 55,
      'DesertHouseWithPool': 100,
    };

    const landColors = ['#7CFC00', '#90EE90', '#98FB98', '#ADFF2F', '#9ACD32'];

    // Add some random variation to land plot size
    const widthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
    const depthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation

    return {
      width: Math.max(40, (baseWidths[houseType] || 60) * scale * widthVariation),
      depth: Math.max(40, (baseDepths[houseType] || 60) * scale * depthVariation),
      color: landColors[Math.floor(Math.random() * landColors.length)],
    };
  }

  /**
   * Generate a mixed set of houses for custom neighborhoods
   */
  private generateMixedHouses(count: number) {
    const houses = [];
    const houseTypes = [
      { type: 'House' as const, weight: 0.4 },
      { type: 'Villa' as const, weight: 0.15 },
      { type: 'Townhouse' as const, weight: 0.15 },
      { type: 'Barn' as const, weight: 0.1 },
      { type: 'DesertHouse' as const, weight: 0.1 },
      { type: 'Dome' as const, weight: 0.05 },
      { type: 'DesertHouseWithPool' as const, weight: 0.05 },
    ];

    for (let i = 0; i < count; i++) {
      const totalWeight = houseTypes.reduce((sum, t) => sum + t.weight, 0);
      const random = Math.random() * totalWeight;
      let accumulated = 0;
      let selectedType = houseTypes[0].type;

      for (const typeOption of houseTypes) {
        accumulated += typeOption.weight;
        if (random <= accumulated) {
          selectedType = typeOption.type;
          break;
        }
      }

      // Generate 90-degree increment rotation
      const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];

      const scale = 0.8 + Math.random() * 0.4;

      // Generate land plot based on house type and scale
      const landPlot = this.generateLandPlot(selectedType, scale);

      houses.push({
        type: selectedType,
        scale,
        includePool: Math.random() < 0.3,
        rotation,
        landPlot,
      });
    }

    return houses;
  }

  /**
   * Create roads and pathways between neighborhoods
   */
  private createRoads(scene: THREE.Scene): void {
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });

    // Main horizontal road
    const mainRoadGeometry = new THREE.PlaneGeometry(1600, 40);
    const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.1, 0);
    scene.add(mainRoad);

    // Vertical connecting roads
    const verticalRoadGeometry = new THREE.PlaneGeometry(40, 600);

    const leftRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-400, 0.1, 0);
    scene.add(leftRoad);

    const centerRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    centerRoad.rotation.x = -Math.PI / 2;
    centerRoad.position.set(0, 0.1, 0);
    scene.add(centerRoad);

    const rightRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(400, 0.1, 0);
    scene.add(rightRoad);

    // Road markings
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
    });

    // Dashed lines for main road
    for (let i = -15; i <= 15; i++) {
      if (i % 2 === 0) continue; // Create dashed effect
      const marking = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 2),
        markingMaterial
      );
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(i * 50, 0.11, 0);
      scene.add(marking);
    }

    this.neighborhoodMeshes.push(mainRoad, leftRoad, centerRoad, rightRoad);
  }

  private setupCamera(camera: THREE.Camera): void {
    const lookAt = new THREE.Vector3(0, 0, 0); // Center of town
    camera.position.set(0, 600, 800); // High aerial view for town overview
    camera.lookAt(lookAt);
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Dispose neighborhood meshes
    this.neighborhoodMeshes.forEach(obj => {
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
    this.neighborhoodMeshes.length = 0;

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

    // Dispose component registry
    if (this.componentRegistry) {
      this.componentRegistry.dispose();
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const townWorkshop = new TownWorkshop();

// Export in the expected format for the Stories system
const TownDemo = {
  load: async (options: StoryOptions) => {
    return townWorkshop.load(options);
  },
  dispose: () => {
    return townWorkshop.dispose();
  },
  getAppInfo: () => {
    return townWorkshop.getAppInfo();
  },
};

export default TownDemo;