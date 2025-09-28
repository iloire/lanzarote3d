import * as THREE from 'three';
import { NewGlider } from '../../../../../foundation/components/vehicles/GliderComponent';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * NewGlider Workshop Demo - Showcases modern glider component with advanced features
 */
class NewGliderWorkshopApp extends WorkshopDemoBase {
  private labelContainer?: HTMLDivElement;

  constructor() {
    super({
      name: 'NewGlider Workshop',
      description: 'Workshop demo showcasing modern NewGlider component with enhanced features, resource management, and dynamic controls',
      ground: {
        create: false,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      const { camera, scene, renderer, gui, controls } = options;

      // Create container for labels
      this.labelContainer = this.createLabelContainer();

      // Create multiple NewGlider instances with different configurations
      const gliderConfigs = [
        {
          name: 'Sport Glider',
          options: {
            numeroCajones: 30,
            wingColor1: '#FF6B6B',
            wingColor2: '#4ECDC4',
            wingColor3: '#45B7D1',
            showBreakLines: true,
            bandLength: 400,
            carabinersSeparationMM: 250,
            castShadow: true,
            receiveShadow: true,
          },
          position: new THREE.Vector3(-8000, 0, 0),
        },
        {
          name: 'Competition Glider',
          options: {
            numeroCajones: 50,
            wingColor1: '#FFD700',
            wingColor2: '#FF8C00',
            wingColor3: '#FF4500',
            showBreakLines: true,
            bandLength: 300,
            carabinersSeparationMM: 200,
            castShadow: true,
            receiveShadow: true,
          },
          position: new THREE.Vector3(0, 0, 0),
        },
        {
          name: 'Beginner Glider',
          options: {
            numeroCajones: 20,
            wingColor1: '#98FB98',
            wingColor2: '#90EE90',
            wingColor3: '#00FA9A',
            showBreakLines: false,
            bandLength: 500,
            carabinersSeparationMM: 300,
            castShadow: true,
            receiveShadow: true,
          },
          position: new THREE.Vector3(8000, 0, 0),
        },
      ];

      console.log(`🪂 Creating NewGlider showcase with ${gliderConfigs.length} variants`);

      // Load all gliders asynchronously
      const gliderPromises = gliderConfigs.map(async (config, index) => {
        const glider = new NewGlider(config.options);
        const mesh = await glider.load();

        // Position the glider
        mesh.position.copy(config.position);
        scene.add(mesh);

        console.log(`NewGlider ${index}: ${config.name} at position (${config.position.x}, ${config.position.y}, ${config.position.z})`);

        // Create label
        const labelText = `${config.name}\\nCells: ${config.options.numeroCajones}\\nBand: ${config.options.bandLength}mm`;
        const label = this.createStandardLabel(labelText);

        if (this.labelContainer) {
          this.labelContainer.appendChild(label);
        }

        // Update label position in animation loop
        const updateLabelPosition = () => {
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(mesh.matrixWorld);
          vector.y += 2000; // Position above the glider

          // Project 3D position to 2D screen coordinates
          vector.project(camera);

          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          label.style.transform = \`translate(-50%, -50%) translate(\${x}px,\${y}px)\`;
        };

        // Store update function on the mesh for later use
        (mesh as any).updateLabel = updateLabelPosition;

        // Add GUI controls for this glider if it's the center one
        if (index === 1 && gui) {
          const gliderFolder = gui.addFolder(\`\${config.name} Controls\`);

          // Brake controls
          const brakeControls = {
            leftBrake: 0,
            rightBrake: 0,
            speedBar: 0,
          };

          gliderFolder.add(brakeControls, 'leftBrake', 0, 1, 0.1)
            .name('Left Brake')
            .onChange((value: number) => {
              glider.breakLeft(value);
            });

          gliderFolder.add(brakeControls, 'rightBrake', 0, 1, 0.1)
            .name('Right Brake')
            .onChange((value: number) => {
              glider.breakRight(value);
            });

          gliderFolder.add(brakeControls, 'speedBar', 0, 1, 0.1)
            .name('Speed Bar')
            .onChange((value: number) => {
              // Speed bar implementation would go here
              console.log(\`Speed bar: \${value}\`);
            });

          // Release all brakes button
          gliderFolder.add({
            releaseBrakes: () => {
              glider.releaseBrakes();
              brakeControls.leftBrake = 0;
              brakeControls.rightBrake = 0;
              brakeControls.speedBar = 0;
              gliderFolder.controllers.forEach(controller => controller.updateDisplay());
            }
          }, 'releaseBrakes').name('Release All Brakes');

          // Component info
          const info = glider.getInfo();
          const infoFolder = gliderFolder.addFolder('Component Info');
          infoFolder.add(info, 'name').name('Name').listen();
          infoFolder.add(info, 'version').name('Version').listen();
          infoFolder.add(info, 'numeroCajones').name('Cells').listen();

          gliderFolder.open();
        }

        return { glider, mesh, config };
      });

      // Wait for all gliders to load
      await Promise.all(gliderPromises);

      // Set camera position for glider showcase
      camera.position.set(0, 4000, 12000);
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
      console.log(\`✅ \${this.config.name} loaded successfully\`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  public override dispose(): void {
    console.log(\`🧹 Disposing \${this.config.name}\`);

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
const newGliderWorkshopApp = new NewGliderWorkshopApp();

// Export in the expected format for the Stories system
const NewGliderWorkshop = {
  load: async (options: StoryOptions) => {
    return newGliderWorkshopApp.load(options);
  },
  dispose: () => {
    return newGliderWorkshopApp.dispose();
  },
  getAppInfo: () => {
    return newGliderWorkshopApp.getAppInfo();
  },
};

export default NewGliderWorkshop;