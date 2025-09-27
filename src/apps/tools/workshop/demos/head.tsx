import * as THREE from 'three';
import PilotHead, {
  GlassesType,
  PilotHeadType,
  PilotHeadOptions,
} from '../../../../foundation/components/characters/PilotHead';
import {
  HelmetOptions,
  HelmetType,
} from '../../../../foundation/components/characters/helmets/types';
import { StoryOptions } from '../../../shared/types';
import { WorkshopDemoBase } from '../../../shared/WorkshopDemoBase';

const toHexColor = (num: number): string => {
  const hex = num.toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
};

/**
 * Head Workshop Demo - Showcases different pilot head types, helmets and glasses
 */
class HeadWorkshopApp extends WorkshopDemoBase {
  private labelContainer?: HTMLDivElement;

  constructor() {
    super({
      name: 'Head Workshop',
      description: 'Workshop demo showcasing different pilot head types, helmet variations and glasses',
      ground: {
        create: false, // Don't show ground plane for character showcase
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

      const { camera, scene, renderer, controls } = options;

      // Create container for labels
      this.labelContainer = this.createLabelContainer();

      const heads = Object.keys(PilotHeadType)
        .filter(key => isNaN(Number(key)))
        .reduce((acc, headKey) => {
          // For each head type
          Object.keys(HelmetType)
            .filter(key => isNaN(Number(key)))
            .forEach(helmetKey => {
              // Add head with helmet and each glasses type
              Object.keys(GlassesType)
                .filter(key => isNaN(Number(key)))
                .forEach(glassesKey => {
                  // helmet options with random colors
                  const baseHelmetOptions: HelmetOptions = {
                    color: toHexColor(Math.floor(Math.random() * 16777215)),
                    color2: toHexColor(Math.floor(Math.random() * 16777215)),
                    color3: toHexColor(Math.floor(Math.random() * 16777215)),
                  };

                  acc.push({
                    headType: (PilotHeadType as any)[headKey],
                    helmetType: (HelmetType as any)[helmetKey],
                    helmetOptions: baseHelmetOptions,
                    glassesType: (GlassesType as any)[glassesKey],
                  });
                });
            });

          return acc;
        }, [] as PilotHeadOptions[]);

      const x = -2000;
      const z = 0;
      const ITEMS_PER_ROW = 5;

      heads.forEach((headOptions, index) => {
        const head = new PilotHead(headOptions);
        const mesh = head.load();

        // Calculate grid position
        const row = Math.floor(index / ITEMS_PER_ROW);
        const col = index % ITEMS_PER_ROW;
        mesh.position.set(x + col * 800, -100, z + row * 1000);

        scene.add(mesh);

        // Fix the enum value display
        const headTypeName = Object.keys(PilotHeadType).find(
          key => (PilotHeadType as any)[key] === headOptions.headType
        );
        const helmetTypeName = Object.keys(HelmetType).find(
          key => (HelmetType as any)[key] === headOptions.helmetType
        );
        const glassesTypeName = headOptions.glassesType
          ? Object.keys(GlassesType).find(key => (GlassesType as any)[key] === headOptions.glassesType)
          : null;

        const labelText = `${headTypeName}\nHelmet: ${helmetTypeName}${
          glassesTypeName ? `\nGlasses: ${glassesTypeName}` : ''
        }`;
        const label = this.createStandardLabel(labelText);

        if (this.labelContainer) {
          this.labelContainer.appendChild(label);
        }

        // Update label position in animation loop
        const updateLabelPosition = () => {
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(mesh.matrixWorld);
          vector.y += 200; // Position above the head

          // Project 3D position to 2D screen coordinates
          vector.project(camera);

          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        };

        // Store update function on the mesh for later use
        (mesh as any).updateLabel = updateLabelPosition;
      });

      // Set camera position for head showcase
      camera.position.set(0, 1000, 8000);
      camera.lookAt(scene.position);

      // Start animation loop with label updates
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        // Update all labels
        scene.traverse(object => {
          if ((object as any).updateLabel) {
            (object as any).updateLabel();
          }
        });
      });

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Remove label container
    if (this.labelContainer) {
      this.labelContainer.remove();
      this.labelContainer = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const headWorkshopApp = new HeadWorkshopApp();

// Export in the expected format for the Stories system
const Head = {
  load: async (options: StoryOptions) => {
    return headWorkshopApp.load(options);
  },
  dispose: () => {
    return headWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return headWorkshopApp.getAppInfo();
  },
};

export default Head;
