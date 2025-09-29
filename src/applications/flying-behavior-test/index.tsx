import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { FlyingBehavior, FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';
import HangGliderModel from '../../foundation/components/vehicles/Hangglider';

/**
 * Flying Behavior Test - Test the FlyingBehavior system with autonomous flight
 * Demonstrates obstacle avoidance, boundary detection, and terrain awareness
 */
class FlyingBehaviorTestApp extends WorkshopDemoBase {
  private hangglider?: HangGliderModel;
  private flyingBehavior?: FlyingBehavior;
  private walls: THREE.Mesh[] = [];
  private ground?: THREE.Mesh;

  constructor() {
    super({
      name: 'Flying Behavior Test',
      description: 'Test autonomous flying behavior with obstacle avoidance and boundary detection',
      ground: {
        create: true,
        size: { width: 50, height: 50 },
        color: 0x4a6741,
        opacity: 0.8
      },
      lighting: {
        sunPosition: 0.3,
      },
      helpers: false
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);

      // Set up clean workshop environment
      this.setupCleanEnvironment(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Set up camera position for flight viewing
      this.setupCamera(camera, controls);

      // Create test environment with walls
      await this.createTestEnvironment(scene);

      // Create hangglider with flying behavior
      await this.createFlyingHangglider(scene);

      // Setup GUI controls
      if (gui) {
        this.setupGUI(gui);
      }

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        // Update flying behavior (handled internally by FlyingBehavior)
      });

      this.isLoaded = true;
      console.log('✅ Flying Behavior Test loaded successfully');

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupCamera(camera: THREE.PerspectiveCamera, controls: any): void {
    // Position camera for good view of flying area
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 10, 0);
    console.log(`📷 Camera positioned at (30, 20, 30) looking at (0, 10, 0)`);

    if (controls) {
      controls.target.set(0, 10, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();
      console.log(`🎮 Controls configured with target at (0, 10, 0)`);
    }
  }

  private async createTestEnvironment(scene: THREE.Scene): Promise<void> {
    console.log('🏗️ Creating test environment with walls...');

    // Create walls as obstacles
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.1
    });

    const wallGeometry = new THREE.BoxGeometry(2, 15, 2);

    // Position walls around the flight area with more spacing
    const wallPositions = [
      { x: 18, z: 18 },   // Front right
      { x: -18, z: 18 },  // Front left
      { x: 18, z: -18 },  // Back right
      { x: -18, z: -18 }, // Back left
      { x: 0, z: 25 },    // North wall
      { x: 0, z: -25 },   // South wall
      { x: 25, z: 0 },    // East wall
      { x: -25, z: 0 }    // West wall
    ];

    wallPositions.forEach((pos, index) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, 7.5, pos.z); // Half height above ground
      wall.name = `Wall_${index}`;
      scene.add(wall);
      this.walls.push(wall);
      console.log(`🧱 Wall ${index} placed at (${pos.x}, 7.5, ${pos.z})`);
    });

    // Get reference to ground for terrain detection
    const groundObjects = scene.children.filter(child =>
      child.name && child.name.toLowerCase().includes('ground')
    );

    if (groundObjects.length > 0 && groundObjects[0] instanceof THREE.Mesh) {
      this.ground = groundObjects[0] as THREE.Mesh;
      console.log('🌍 Ground reference found for terrain detection');
    }
  }

  private async createFlyingHangglider(scene: THREE.Scene): Promise<void> {
    console.log('🪂 Creating hangglider with flying behavior...');

    try {
      // Create hangglider (it extends AutoFlier but we'll override with FlyingBehavior)
      this.hangglider = new HangGliderModel();
      const emptyPath: THREE.Vector3[] = []; // We won't use the path system
      const hanggliderMesh = await this.hangglider.load(emptyPath);

      if (hanggliderMesh) {
        // Position hangglider in center of flight area
        hanggliderMesh.position.set(0, 10, 0);
        hanggliderMesh.scale.setScalar(0.1); // Make it smaller for better viewing
        scene.add(hanggliderMesh);
        console.log('✅ Hangglider added to scene');

        // Create and attach flying behavior
        this.flyingBehavior = new FlyingBehavior({
          pattern: FlightPattern.FREE_ROAM,
          speed: 6.0, // Increased speed for better testing
          turnSpeed: 3.0, // Increased turn speed for more responsive avoidance
          flightRadius: 22, // Adjusted for wider wall spacing
          returnDistance: 30, // Adjusted for outer wall positions
          minHeight: 5,
          maxHeight: 20,
          obstacleAvoidanceDistance: 10, // Increased for better wall avoidance
          centerPoint: new THREE.Vector3(0, 0, 0),
          autoStart: true,
          faceDirection: true,
          forwardAxis: 'z'
        });

        this.flyingBehavior.attachTo(hanggliderMesh);

        // Add walls as obstacles
        this.flyingBehavior.addObstacles(this.walls);

        // Set terrain for height detection
        if (this.ground) {
          this.flyingBehavior.setTerrain(this.ground);
        }

        // Start flying
        this.flyingBehavior.start();
        console.log('🚁 Flying behavior started');

      } else {
        console.error('❌ Failed to create hangglider mesh');
      }

    } catch (error) {
      console.error('❌ Error creating hangglider:', error);
    }
  }

  private setupGUI(gui: any): void {
    const behaviorFolder = gui.addFolder('Flying Behavior');

    if (this.flyingBehavior) {
      const params = {
        speed: 6.0,
        turnSpeed: 3.0,
        flightRadius: 22,
        pattern: 'FREE_ROAM',
        start: () => this.flyingBehavior?.start(),
        stop: () => this.flyingBehavior?.stop(),
        getState: () => {
          const state = this.flyingBehavior?.getFlightState();
          console.log('Flight State:', state);
        }
      };

      behaviorFolder.add(params, 'speed', 0.5, 8.0, 0.1).onChange((value: number) => {
        if (this.flyingBehavior) {
          (this.flyingBehavior as any).speed = value;
        }
      });

      behaviorFolder.add(params, 'turnSpeed', 0.1, 5.0, 0.1).onChange((value: number) => {
        if (this.flyingBehavior) {
          (this.flyingBehavior as any).turnSpeed = value;
        }
      });

      behaviorFolder.add(params, 'flightRadius', 5, 30, 1).onChange((value: number) => {
        if (this.flyingBehavior) {
          (this.flyingBehavior as any).flightRadius = value;
        }
      });

      behaviorFolder.add(params, 'pattern', ['FREE_ROAM', 'CIRCULAR', 'FIGURE_EIGHT']).onChange((value: string) => {
        if (this.flyingBehavior) {
          (this.flyingBehavior as any).pattern = value;
        }
      });

      behaviorFolder.add(params, 'start').name('Start Flying');
      behaviorFolder.add(params, 'stop').name('Stop Flying');
      behaviorFolder.add(params, 'getState').name('Log State');
    }

    behaviorFolder.add({ info: 'Hangglider with autonomous flight behavior' }, 'info').name('Status');
    behaviorFolder.open();
  }

  override dispose(): void {
    console.log('🧹 Disposing Flying Behavior Test');

    // Stop and dispose flying behavior
    if (this.flyingBehavior) {
      this.flyingBehavior.dispose();
      this.flyingBehavior = undefined;
    }

    // Clean up hangglider
    if (this.hangglider) {
      // Note: HangGliderModel doesn't have a dispose method, but we clean up references
      this.hangglider = undefined;
    }

    // Clean up walls
    this.walls.length = 0;
    this.ground = undefined;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const flyingBehaviorTestApp = new FlyingBehaviorTestApp();

// Export in the expected format for the app system
const FlyingBehaviorTest = {
  load: async (options: StoryOptions) => {
    return flyingBehaviorTestApp.load(options);
  },
  dispose: () => {
    return flyingBehaviorTestApp.dispose();
  },
  getAppInfo: () => {
    return flyingBehaviorTestApp.getAppInfo();
  },
};

export default FlyingBehaviorTest;