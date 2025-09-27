import * as THREE from 'three';
import {
  HelmetOptions,
  HelmetType,
} from '../../../../../foundation/components/characters/helmets/types';
import { DefaultHelmet } from '../../../../../foundation/components/characters/helmets/DefaultHelmet';
import { FullFaceHelmet } from '../../../../../foundation/components/characters/helmets/FullFaceHelmet';
import { HelmetWithHorns } from '../../../../../foundation/components/characters/helmets/HelmetWithHorns';
import { SpikedHelmet } from '../../../../../foundation/components/characters/helmets/SpikedHelmet';
import { WingedHelmet } from '../../../../../foundation/components/characters/helmets/WingedHelmet';
import { CrownHelmet } from '../../../../../foundation/components/characters/helmets/CrownHelmet';
import { SharkHelmet } from '../../../../../foundation/components/characters/helmets/SharkHelmet';
import { CrystalHelmet } from '../../../../../foundation/components/characters/helmets/CrystalHelmet';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';
import { StoryOptions } from '../../../../shared/types';

// Professional color palettes with lower contrast and more realistic tones
const COLOR_PALETTES = {
  military: [
    '#4A5D3A', '#3D4E2F', '#556B3D', '#6B7A5B', '#7A8B6C',
    '#2F3F23', '#5C6B4A', '#8A9B7A', '#3A4B2D', '#4F6040'
  ],
  gray: [
    '#6A6A6A', '#5A5A5A', '#7A7A7A', '#8A8A8A', '#5D5D5D',
    '#707070', '#757575', '#656565', '#808080', '#606060'
  ],
  steel: [
    '#4A4A52', '#5A5A62', '#525252', '#4F4F57', '#565664',
    '#464653', '#58586C', '#4C4C59', '#54546B', '#4A4A5F'
  ]
};

const getRandomColorFromPalette = (): string => {
  const paletteNames = Object.keys(COLOR_PALETTES) as (keyof typeof COLOR_PALETTES)[];
  const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  const palette = COLOR_PALETTES[randomPalette];
  return palette[Math.floor(Math.random() * palette.length)];
};

/**
 * Helmet Workshop Demo - Showcases all helmet types with random colors
 * Demonstrates WorkshopDemoBase pattern for clean environment
 */
class HelmetWorkshopApp extends WorkshopDemoBase {
  private labelContainer?: HTMLDivElement;
  private helmetMeshes: THREE.Object3D[] = [];

  constructor() {
    super({
      name: 'Helmet Workshop',
      description: 'Helmet component variations showcase',
      ground: {
        create: true,
        size: { width: 3000, height: 2000 },
        color: 0x8fbc8f, // Neutral ground for helmets
        opacity: 0.3,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems - automatically sets up clean environment
      this.initializeCore(options);

      const { camera, scene, renderer, controls } = options;

      // Create container for labels using utility
      this.labelContainer = this.createLabelContainer();

      // Load and position helmets
      await this.loadHelmets(scene);

      // Set up camera
      camera.position.set(0, 1000, 3000);
      camera.lookAt(scene.position);

      // Start animation loop with label updates
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        this.updateLabels(camera);
      });

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.helmetMeshes.length} helmets`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async loadHelmets(scene: THREE.Scene): Promise<void> {
    // Create array of helmet configurations
    const helmets = Object.keys(HelmetType)
      .filter(key => isNaN(Number(key)))
      .map(helmetKey => {
        return {
          type: HelmetType[helmetKey as keyof typeof HelmetType],
          options: {
            color: getRandomColorFromPalette(),
            color2: getRandomColorFromPalette(),
            color3: getRandomColorFromPalette(),
          } as HelmetOptions,
        };
      });

    const x = -800;
    const z = 0;
    const ITEMS_PER_ROW = 3;

    helmets.forEach((helmetConfig, index) => {
      try {
        let helmet: any;

        switch (helmetConfig.type) {
          case HelmetType.Default:
            helmet = new DefaultHelmet(helmetConfig.options);
            break;
          case HelmetType.FullFace:
            helmet = new FullFaceHelmet(helmetConfig.options);
            break;
          case HelmetType.WithHorns:
            helmet = new HelmetWithHorns(helmetConfig.options);
            break;
          case HelmetType.Spiked:
            helmet = new SpikedHelmet(helmetConfig.options);
            break;
          case HelmetType.Winged:
            helmet = new WingedHelmet(helmetConfig.options);
            break;
          case HelmetType.Crown:
            helmet = new CrownHelmet(helmetConfig.options);
            break;
          case HelmetType.Shark:
            helmet = new SharkHelmet(helmetConfig.options);
            break;
          case HelmetType.Crystal:
            helmet = new CrystalHelmet(helmetConfig.options);
            break;
          default:
            console.warn('Unknown helmet type:', helmetConfig.type);
            return;
        }

        const mesh = helmet.load();

        // Calculate grid position
        const row = Math.floor(index / ITEMS_PER_ROW);
        const col = index % ITEMS_PER_ROW;
        mesh.position.set(x + col * 800, 0, z + row * 1000);

        scene.add(mesh);
        this.helmetMeshes.push(mesh);

        // Create HTML label using utility
        const helmetTypeName = Object.keys(HelmetType).find(
          key => HelmetType[key as keyof typeof HelmetType] === helmetConfig.type
        );

        const subtitle = `color1: ${helmetConfig.options.color}<br>color2: ${helmetConfig.options.color2}<br>color3: ${helmetConfig.options.color3}`;
        const label = this.createStandardLabel(`Helmet: ${helmetTypeName}`, subtitle);
        this.labelContainer!.appendChild(label);

        // Update label position in animation loop
        const updateLabelPosition = (camera: THREE.Camera) => {
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(mesh.matrixWorld);
          vector.y += 200; // Position above the helmet

          // Project 3D position to 2D screen coordinates
          vector.project(camera);

          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        };

        // Store update function on the mesh for later use
        (mesh as any).updateLabel = updateLabelPosition;
      } catch (error) {
        this.handleError(error as Error, `loading helmet ${index}`);
      }
    });
  }

  private updateLabels(camera: THREE.Camera): void {
    // Update all label positions
    this.helmetMeshes.forEach(mesh => {
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

    // Dispose helmet meshes
    this.helmetMeshes.forEach(mesh => {
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
    this.helmetMeshes.length = 0;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const helmetWorkshopApp = new HelmetWorkshopApp();

// Export in the expected format for the Stories system
const HelmetWorkshop = {
  load: async (options: StoryOptions) => {
    return helmetWorkshopApp.load(options);
  },
  dispose: () => {
    return helmetWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return helmetWorkshopApp.getAppInfo();
  },
};

export default HelmetWorkshop;
