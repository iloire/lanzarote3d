import * as THREE from 'three';
import PilotHead, {
  GlassesType,
  PilotHeadType,
  PilotHeadOptions,
} from '../../../../../foundation/components/characters/PilotHead';
import {
  HelmetOptions,
  HelmetType,
} from '../../../../../foundation/components/characters/helmets/types';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

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

      // Create a more reasonable sample - one example per head type with variety
      const headTypeKeys = Object.keys(PilotHeadType).filter(key => isNaN(Number(key)));
      const helmetTypeKeys = Object.keys(HelmetType).filter(key => isNaN(Number(key)));
      const glassesTypeKeys = Object.keys(GlassesType).filter(key => isNaN(Number(key)));

      const heads: PilotHeadOptions[] = [];

      // Create one head per head type, with varied helmets and glasses
      headTypeKeys.forEach((headKey, headIndex) => {
        const helmetKey = helmetTypeKeys[headIndex % helmetTypeKeys.length];
        const glassesKey = glassesTypeKeys[headIndex % glassesTypeKeys.length];

        const baseHelmetOptions: HelmetOptions = {
          color: getRandomColorFromPalette(),
          color2: getRandomColorFromPalette(),
          color3: getRandomColorFromPalette(),
        };

        heads.push({
          headType: (PilotHeadType as any)[headKey],
          helmetType: (HelmetType as any)[helmetKey],
          helmetOptions: baseHelmetOptions,
          glassesType: (GlassesType as any)[glassesKey],
        });
      });

      const x = -1500;
      const z = 0;
      const ITEMS_PER_ROW = 3;
      const SPACING_X = 1500; // Increased spacing to prevent overlap
      const SPACING_Z = 1500;

      heads.forEach((headOptions, index) => {
        const head = new PilotHead(headOptions);
        const mesh = head.load();

        // Fix the enum value display
        const headTypeName = Object.keys(PilotHeadType).find(
          key => (PilotHeadType as any)[key] === headOptions.headType
        );

        // Calculate grid position with increased spacing
        const row = Math.floor(index / ITEMS_PER_ROW);
        const col = index % ITEMS_PER_ROW;
        mesh.position.set(x + col * SPACING_X, -100, z + row * SPACING_Z);

        console.log(`Head ${index}: ${headTypeName} at position (${x + col * SPACING_X}, -100, ${z + row * SPACING_Z})`);

        scene.add(mesh);
        const helmetTypeName = Object.keys(HelmetType).find(
          key => (HelmetType as any)[key] === headOptions.helmetType
        );
        const glassesTypeName = headOptions.glassesType
          ? Object.keys(GlassesType).find(key => (GlassesType as any)[key] === headOptions.glassesType)
          : null;

        const labelText = `${headTypeName}\nHelmet: ${helmetTypeName}${glassesTypeName ? `\nGlasses: ${glassesTypeName}` : ''
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

      // Set camera position for head showcase - adjusted for new spacing
      camera.position.set(0, 1200, 4000);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

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
