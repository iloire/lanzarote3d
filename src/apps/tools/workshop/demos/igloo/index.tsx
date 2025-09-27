import * as THREE from 'three';
import { Igloo, IglooSize } from '../../../../../foundation/components/scenery';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';
import { StoryOptions } from '../../../../shared/types';

/**
 * Igloo Workshop Demo - Showcases Igloo component with different sizes
 * Demonstrates the new WorkshopDemoBase pattern for clean environments
 */
class IglooWorkshopApp extends WorkshopDemoBase {
  private labelContainer?: HTMLDivElement;
  private iglooMeshes: THREE.Object3D[] = [];

  constructor() {
    super({
      name: 'Igloo Workshop',
      description: 'Igloo scenery component showcase with different sizes',
      ground: {
        create: true,
        size: { width: 2000, height: 1000 },
        color: 0xffffff, // Snow white ground for igloos
        opacity: 0.9,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems - this automatically sets up clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, controls } = options;

      // Create container for labels using utility
      this.labelContainer = this.createLabelContainer();

      // Load and position igloos
      await this.loadIgloos(scene);

      // Set up camera
      camera.position.set(0, 200, 800);
      camera.lookAt(scene.position);

      // Start animation loop with label updates
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        this.updateLabels(camera);
      });

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.iglooMeshes.length} igloos`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadIgloos(scene: THREE.Scene): Promise<void> {
    const iglooConfigs = [
      { size: IglooSize.Small, name: 'Small Igloo' },
      { size: IglooSize.Medium, name: 'Medium Igloo' },
      { size: IglooSize.Large, name: 'Large Igloo' },
    ];

    const x = -400;
    const z = 0;
    const ITEMS_PER_ROW = 3;

    iglooConfigs.forEach((config, index) => {
      try {
        // Create igloo
        const igloo = new Igloo(config.size);
        const mesh = igloo.load();

        // Calculate grid position
        const row = Math.floor(index / ITEMS_PER_ROW);
        const col = index % ITEMS_PER_ROW;
        mesh.position.set(x + col * 400, 0, z + row * 600);

        scene.add(mesh);
        this.iglooMeshes.push(mesh);

        // Create HTML label using utility
        const subtitle = `Size: ${IglooSize[config.size]}<br>Radius: ${igloo.radius}m<br>Height: ${igloo.height}m`;
        const label = this.createStandardLabel(config.name, subtitle);
        this.labelContainer!.appendChild(label);

        // Update label position in animation loop
        const updateLabelPosition = (camera: THREE.Camera) => {
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(mesh.matrixWorld);
          vector.y += igloo.height + 50; // Position above the igloo

          // Project 3D position to 2D screen coordinates
          vector.project(camera);

          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        };

        // Store update function on the mesh for later use
        (mesh as any).updateLabel = updateLabelPosition;
      } catch (error) {
        this.handleError(error as Error, `loading ${config.name}`);
      }
    });
  }

  private updateLabels(camera: THREE.Camera): void {
    // Update all label positions
    this.iglooMeshes.forEach(mesh => {
      if ((mesh as any).updateLabel) {
        (mesh as any).updateLabel(camera);
      }
    });
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Clean up label container
    if (this.labelContainer) {
      this.labelContainer.remove();
      this.labelContainer = undefined;
    }

    // Dispose igloo meshes
    this.iglooMeshes.forEach(mesh => {
      mesh.traverse(child => {
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
    this.iglooMeshes.length = 0;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const iglooWorkshopApp = new IglooWorkshopApp();

// Export in the expected format for the Stories system
const IglooWorkshop = {
  load: async (options: StoryOptions) => {
    return iglooWorkshopApp.load(options);
  },
  dispose: () => {
    return iglooWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return iglooWorkshopApp.getAppInfo();
  },
};

export default IglooWorkshop;