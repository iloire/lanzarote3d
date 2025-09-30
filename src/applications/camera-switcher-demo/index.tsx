import * as THREE from 'three';
import { TerrainBase } from '../../shared/TerrainBase';
import { StoryOptions } from '../../shared/types';
import { CameraTargetController, CameraMode } from '../../foundation/systems/scene/CameraTargetController';
import { createCameraTargetUI } from '../../foundation/components/ui/CameraTargetUI';
import { Cessna, Jet, HangGliderWing } from '../../foundation/components/vehicles';
import { EngineFlyingBehavior } from '../../foundation/systems/behaviors/EngineFlyingBehavior';
import { FlyingBehavior, FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';
import { getAppConfig } from '../../config/app-registry';

/**
 * Camera Switcher Demo
 *
 * Demonstrates the CameraTargetController with multiple dynamic targets:
 * - Flying Cessna with autonomous terrain-avoidance flight
 * - Flying Jet with faster, higher altitude flight
 * - Hang glider soaring in circles with FlyingBehavior
 * - Static markers (ground, hill)
 *
 * Features:
 * - React UI for target selection
 * - Multiple camera modes (Follow, First Person, Orbit, Static)
 * - Smooth transitions between targets
 * - lil-gui controls for fine-tuning
 */
class CameraSwitcherDemo extends TerrainBase {
  private targetController: CameraTargetController | null = null;
  private cessnaBehavior: EngineFlyingBehavior | undefined;
  private jetBehavior: EngineFlyingBehavior | undefined;
  private hanggliderBehavior: FlyingBehavior | undefined;
  private animationId: number | undefined;

  constructor() {
    const appConfig = getAppConfig('camera-switcher-demo');
    if (!appConfig) {
      throw new Error('Camera switcher demo app not found in registry');
    }
    super({
      name: appConfig.name,
      description: appConfig.description,
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: { enabled: true },
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    // Initialize core systems
    this.initializeCore(options);

    // Load environment
    await this.initializeEnvironment(options);

    const { camera, scene, renderer, terrain, controls, gui } = options;

    if (!scene || !renderer || !terrain || !camera) {
      throw new Error('Required components not initialized');
    }

    // Replace camera with CameraTargetController
    this.targetController = new CameraTargetController(
      camera.fov,
      camera.aspect,
      camera.near,
      camera.far
    );
    this.targetController.position.copy(camera.position);
    this.targetController.rotation.copy(camera.rotation);

    // Replace in scene
    scene.remove(camera);
    scene.add(this.targetController);

    // Update options camera reference
    options.camera = this.targetController;

    // Update controls to use new camera
    controls.object = this.targetController;
    controls.enabled = true;
    controls.update();

    // Add flying Cessna
    await this.addFlyingCessna(scene, terrain);

    // Add flying Jet
    await this.addFlyingJet(scene, terrain);

    // Add hang glider
    await this.addHangglider(scene, terrain);

    // Add static markers
    await this.addStaticMarkers(scene);

    // Add GUI controls
    this.targetController.addGui(gui);

    // Create React UI
    createCameraTargetUI(this.targetController, controls, (targetIndex, mode) => {
      console.log(`📷 Switched to target ${targetIndex} in ${mode} mode`);
    });

    // Set initial camera position and target
    this.targetController.switchToTarget(0, CameraMode.Follow, 0, controls);

    // Set up animation loop
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Update camera
      if (this.targetController) {
        this.targetController.update(0.016);
      }

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, this.targetController);
    };
    animate();

    console.log(
      '🎬 Camera Switcher Demo loaded with',
      this.targetController.getTargets().length,
      'targets'
    );
  }

  private async addFlyingCessna(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    const cessna = new Cessna({
      bodyColor: '#FFFACD',
      scale: 3,
    });
    const cessnaMesh = await cessna.load();
    cessnaMesh.position.set(6000, 300, -500);
    scene.add(cessnaMesh);

    // Add autonomous flight behavior
    this.cessnaBehavior = new EngineFlyingBehavior({
      speed: 8.0,
      turnSpeed: 0.6,
      flightRadius: 2000,
      cruiseAltitude: 250,
      minHeight: 150,
      maxHeight: 400,
      terrainClearance: 100,
      lookAheadDistance: 200,
      centerPoint: new THREE.Vector3(6500, 0, -400),
      autoStart: true,
    });

    this.cessnaBehavior.attachTo(cessnaMesh);
    this.cessnaBehavior.setTerrain(terrain);
    this.cessnaBehavior.start(); // Manually start the behavior

    // Add to camera targets
    this.targetController?.addTarget(cessnaMesh, '✈️ Cessna (Flying)');
  }

  private async addFlyingJet(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    const jet = new Jet({
      bodyColor: '#4169e1',
      scale: 4,
    });
    const jetMesh = await jet.load();
    jetMesh.position.set(8500, 350, 500);
    scene.add(jetMesh);

    // Add flying behavior with different parameters
    this.jetBehavior = new EngineFlyingBehavior({
      speed: 12.0, // Faster than Cessna
      turnSpeed: 0.4, // Wider turns
      flightRadius: 3000,
      cruiseAltitude: 350, // Flies higher
      minHeight: 250,
      maxHeight: 500,
      terrainClearance: 150,
      lookAheadDistance: 300,
      centerPoint: new THREE.Vector3(8500, 0, 500),
      autoStart: true,
    });

    this.jetBehavior.attachTo(jetMesh);
    this.jetBehavior.setTerrain(terrain);
    this.jetBehavior.start(); // Manually start the behavior

    // Add to camera targets
    this.targetController?.addTarget(jetMesh, '✈️ Jet (Fast)');
  }

  private async addHangglider(scene: THREE.Scene, terrain: THREE.Mesh): Promise<void> {
    // Create hang glider wing mesh
    const wingComponent = new HangGliderWing({
      wingColor: '#ff6b35',
      wingspan: 80,
      scale: 1,
    });
    const hanggliderMesh = await wingComponent.load();
    hanggliderMesh.position.set(7500, 250, -1500);
    scene.add(hanggliderMesh);

    // Add circular soaring behavior  (wind-dependent flight)
    this.hanggliderBehavior = new FlyingBehavior({
      pattern: FlightPattern.CIRCULAR,
      speed: 5.0,
      turnSpeed: 0.7,
      flightRadius: 800,
      minHeight: 180,
      maxHeight: 320,
      centerPoint: new THREE.Vector3(7500, 0, -1500),
      autoStart: true,
    });

    this.hanggliderBehavior.attachTo(hanggliderMesh);
    this.hanggliderBehavior.setTerrain(terrain);
    this.hanggliderBehavior.start(); // Manually start the behavior

    // Add to camera targets
    this.targetController?.addTarget(hanggliderMesh, '🪂 Hang Glider (Soaring)');
  }

  private async addStaticMarkers(scene: THREE.Scene): Promise<void> {
    // Ground marker
    const groundMarker = new THREE.Group();
    const groundGeometry = new THREE.CylinderGeometry(5, 5, 20, 8);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: '#ffa500' });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = true;
    groundMarker.add(groundMesh);
    groundMarker.position.set(8000, 10, -2000);
    scene.add(groundMarker);

    this.targetController?.addTarget(groundMarker, '📍 Ground Marker');

    // Hill marker
    const hillMarker = new THREE.Group();
    const hillGeometry = new THREE.CylinderGeometry(5, 5, 30, 8);
    const hillMaterial = new THREE.MeshStandardMaterial({ color: '#ff1493' });
    const hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
    hillMesh.castShadow = true;
    hillMarker.add(hillMesh);
    hillMarker.position.set(9000, 150, 500);
    scene.add(hillMarker);

    this.targetController?.addTarget(hillMarker, '🏔️ Hill Marker');
  }

  override dispose(): void {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Clean up behaviors
    if (this.cessnaBehavior) {
      this.cessnaBehavior.dispose();
      this.cessnaBehavior = undefined;
    }
    if (this.jetBehavior) {
      this.jetBehavior.dispose();
      this.jetBehavior = undefined;
    }
    if (this.hanggliderBehavior) {
      this.hanggliderBehavior.dispose();
      this.hanggliderBehavior = undefined;
    }

    // Clean up target controller
    if (this.targetController) {
      this.targetController.dispose();
      this.targetController = null;
    }

    super.dispose();
  }
}

// Create singleton instance
const cameraSwitcherDemoApp = new CameraSwitcherDemo();

// Export in the expected format for the Stories system
const CameraSwitcherDemoExport = {
  load: async (options: StoryOptions) => {
    return cameraSwitcherDemoApp.load(options);
  },
  dispose: () => {
    return cameraSwitcherDemoApp.dispose();
  },
  getAppInfo: () => {
    return cameraSwitcherDemoApp.getAppInfo();
  },
};

export default CameraSwitcherDemoExport;
