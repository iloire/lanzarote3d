import * as THREE from 'three';
import PilotHead, {
  GlassesType,
  PilotHeadType,
  PilotHeadOptions,
} from '../../foundation/components/characters/PilotHead';
import {
  HelmetOptions,
  HelmetType,
} from '../../foundation/components/characters/helmets/types';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';

/**
 * Head Workshop Demo - Showcases different pilot head types, helmets and glasses
 */
class HeadWorkshopApp extends WorkshopDemoBase {
  private labelContainer?: HTMLDivElement;

  constructor() {
    super({
      name: 'Head Workshop',
      description:
        'Workshop demo showcasing different pilot head types, helmet variations and glasses',
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

      // Comprehensive showcase: Show all head types with different helmet and glasses combinations
      const headTypeKeys = Object.keys(PilotHeadType).filter(key => isNaN(Number(key)));
      const helmetTypeKeys = Object.keys(HelmetType).filter(key => isNaN(Number(key)));
      const glassesTypeKeys = Object.keys(GlassesType).filter(key => isNaN(Number(key)));

      console.log(
        `🎭 Creating showcase with ${headTypeKeys.length} head types, ${helmetTypeKeys.length} helmet types, ${glassesTypeKeys.length} glasses types`
      );

      const heads: PilotHeadOptions[] = [];

      // Create a comprehensive showcase - each head type with multiple helmet/glasses combinations
      headTypeKeys.forEach((headKey, headIndex) => {
        // Create 3 variants per head type to show different helmet/glasses combinations
        for (let variant = 0; variant < 3; variant++) {
          const helmetIndex = (headIndex * 3 + variant) % helmetTypeKeys.length;
          const glassesIndex = (headIndex * 2 + variant) % glassesTypeKeys.length;

          const helmetKey = helmetTypeKeys[helmetIndex];
          const glassesKey = glassesTypeKeys[glassesIndex];

          // Create themed color schemes based on head type
          const baseHelmetOptions: HelmetOptions = this.getThemedHelmetOptions(headKey, variant);

          heads.push({
            headType: (PilotHeadType as any)[headKey],
            helmetType: (HelmetType as any)[helmetKey],
            helmetOptions: baseHelmetOptions,
            glassesType: (GlassesType as any)[glassesKey],
            skinColor: this.getThemedSkinColor(headKey),
            beardColor: this.getThemedBeardColor(headKey),
            eyeColor: this.getThemedEyeColor(headKey),
            glassesColor: this.getThemedGlassesColor(variant),
          });
        }
      });

      const x = -2000;
      const z = -1000;
      const ITEMS_PER_ROW = 4; // Increased to accommodate more heads
      const SPACING_X = 1200; // Adjusted for better fit
      const SPACING_Z = 1200;

      // Load all heads asynchronously
      const headPromises = heads.map(async (headOptions, index) => {
        const head = new PilotHead(headOptions);
        const mesh = await head.load();

        // Fix the enum value display
        const headTypeName = Object.keys(PilotHeadType).find(
          key => (PilotHeadType as any)[key] === headOptions.headType
        );

        // Calculate grid position with increased spacing
        const row = Math.floor(index / ITEMS_PER_ROW);
        const col = index % ITEMS_PER_ROW;
        mesh.position.set(x + col * SPACING_X, -100, z + row * SPACING_Z);

        console.log(
          `Head ${index}: ${headTypeName} at position (${x + col * SPACING_X}, -100, ${z + row * SPACING_Z})`
        );

        scene.add(mesh);
        const helmetTypeName = Object.keys(HelmetType).find(
          key => (HelmetType as any)[key] === headOptions.helmetType
        );
        const glassesTypeName = headOptions.glassesType
          ? Object.keys(GlassesType).find(
              key => (GlassesType as any)[key] === headOptions.glassesType
            )
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

      // Wait for all heads to load
      await Promise.all(headPromises);

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

  /**
   * Get themed helmet options based on head type and variant
   */
  private getThemedHelmetOptions(headType: string, variant: number): HelmetOptions {
    const colorSchemes = {
      Default: [
        { color: '#FFD700', color2: '#FFFFFF', color3: '#C0C0C0' }, // Gold/White/Silver
        { color: '#FF6B6B', color2: '#4ECDC4', color3: '#45B7D1' }, // Red/Teal/Blue
        { color: '#96CEB4', color2: '#FFEAA7', color3: '#DDA0DD' }, // Green/Yellow/Purple
      ],
      Warrior: [
        { color: '#D2691E', color2: '#F4A460', color3: '#FFD700' }, // Orange/Sandy/Gold (brighter)
        { color: '#4682B4', color2: '#87CEEB', color3: '#B0E0E6' }, // Steel Blue/Sky Blue/Powder Blue
        { color: '#CD5C5C', color2: '#F08080', color3: '#FFA07A' }, // Indian Red/Light Coral/Light Salmon
      ],
      Skeleton: [
        { color: '#F5F5DC', color2: '#E6E6FA', color3: '#D3D3D3' }, // Beige/Lavender/Light Gray
        { color: '#2F2F2F', color2: '#696969', color3: '#A9A9A9' }, // Dark Gray/Dim Gray/Dark Gray
        { color: '#4B0082', color2: '#8A2BE2', color3: '#9370DB' }, // Indigo/Blue Violet/Medium Purple
      ],
      Devil: [
        { color: '#8B0000', color2: '#FF0000', color3: '#FF4500' }, // Dark Red/Red/Orange Red
        { color: '#2F2F2F', color2: '#696969', color3: '#FF6347' }, // Dark Gray/Dim Gray/Tomato
        { color: '#800080', color2: '#FF1493', color3: '#FF69B4' }, // Purple/Deep Pink/Hot Pink
      ],
    };

    const schemes = colorSchemes[headType as keyof typeof colorSchemes] || colorSchemes.Default;
    return schemes[variant % schemes.length];
  }

  /**
   * Get themed skin color based on head type
   */
  private getThemedSkinColor(headType: string): string {
    const skinColors = {
      Default: '#e0bea5', // Normal skin
      Warrior: '#d4a574', // Slightly tanned
      Skeleton: '#f5f5dc', // Bone white
      Devil: '#ff6b6b', // Reddish skin
    };

    return skinColors[headType as keyof typeof skinColors] || skinColors.Default;
  }

  /**
   * Get themed beard color based on head type
   */
  private getThemedBeardColor(headType: string): string {
    const beardColors = {
      Default: '#8b4513', // Saddle brown
      Warrior: '#8b7355', // Lighter brown for better contrast
      Skeleton: '#d3d3d3', // Light gray
      Devil: '#5d4037', // Medium brown instead of very dark
    };

    return beardColors[headType as keyof typeof beardColors] || beardColors.Default;
  }

  /**
   * Get themed eye color based on head type
   */
  private getThemedEyeColor(headType: string): string {
    const eyeColors = {
      Default: '#4169e1', // Royal blue
      Warrior: '#87ceeb', // Sky blue (bright and visible)
      Skeleton: '#00ff00', // Bright green (eerie)
      Devil: '#ffff00', // Yellow (menacing)
    };

    return eyeColors[headType as keyof typeof eyeColors] || eyeColors.Default;
  }

  /**
   * Get themed glasses color based on variant
   */
  private getThemedGlassesColor(variant: number): string {
    const glassesColors = ['#ff69b4', '#00bfff', '#ffd700', '#98fb98', '#dda0dd'];
    return glassesColors[variant % glassesColors.length];
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
