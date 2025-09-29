import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import createVoxelExample from './example';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { AppBase } from '../../shared/AppBase';

/**
 * Voxel Demo App - 3D voxel visualization with STL export functionality
 * Eighth and final app converted to use AppBase architecture
 */
class VoxelDemoApp extends AppBase {
  private animationId?: number;
  private voxelExample?: THREE.Object3D;
  private downloadButton?: HTMLButtonElement;
  private lights: THREE.Light[] = [];
  private helpers: THREE.Object3D[] = [];
  private platform?: THREE.Object3D;

  constructor() {
    super({
      name: 'Voxel Demo',
      description:
        '3D voxel visualization demo with multiple lighting and STL export functionality',
      requiredComponents: ['scene', 'camera', 'controls', 'renderer'],
      scene: {
        environment: 'custom',
        lighting: 'static',
        physics: false,
        fog: {
          enabled: false, // Fog handled by theme system
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 30000, // Log performance every 30 seconds
      },
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { scene, camera, controls, renderer } = options;

      // Create and add voxel example
      this.loadVoxelExample(scene);

      // Setup lighting
      this.setupLighting(scene);

      // Setup scene helpers and platform
      this.setupSceneHelpers(scene);
      this.setupPlatform(scene);

      // Setup camera and controls
      this.setupCamera(camera, controls);

      // Setup fog
      this.setupFog(scene);

      // Add download functionality
      this.setupDownloadButton();

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private loadVoxelExample(scene: THREE.Scene): void {
    try {
      this.voxelExample = createVoxelExample();
      scene.add(this.voxelExample);
    } catch (error) {
      this.handleError(error as Error, 'loading voxel example');
    }
  }

  private setupLighting(scene: THREE.Scene): void {
    // Add multiple lights for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Add key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1000, 1000, 1000);
    scene.add(keyLight);
    this.lights.push(keyLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1000, 500, 0);
    scene.add(fillLight);
    this.lights.push(fillLight);

    // Add back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(0, 500, -1000);
    scene.add(backLight);
    this.lights.push(backLight);
  }

  private setupSceneHelpers(scene: THREE.Scene): void {
    // Add axes helper for debugging
    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);
    this.helpers.push(axesHelper);

    // Add grid helper for scale reference
    const gridHelper = new THREE.GridHelper(2000, 20);
    scene.add(gridHelper);
    this.helpers.push(gridHelper);
  }

  private setupPlatform(scene: THREE.Scene): void {
    // Add a platform under the voxel model
    const platformGeometry = new THREE.PlaneGeometry(2000, 2000);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      shininess: 0,
      side: THREE.DoubleSide,
    });
    this.platform = new THREE.Mesh(platformGeometry, platformMaterial);
    this.platform.rotation.x = -Math.PI / 2;
    this.platform.position.y = -50;
    scene.add(this.platform);
  }

  private setupCamera(camera: any, controls: any): void {
    // Reset camera and controls
    camera.position.set(500, 1400, 1000);
    camera.lookAt(0, 300, 0);
    controls.target.set(0, 200, 0);
    controls.minDistance = 100;
    controls.maxDistance = 5000;
    controls.update();
  }

  private setupFog(scene: THREE.Scene): void {
    // Note: Fog is handled by ThemeEngine to avoid conflicts
    // Remove manual fog application to prevent conflicts with theme system
  }

  private setupDownloadButton(): void {
    if (!this.voxelExample) return;

    this.downloadButton = document.createElement('button');
    this.downloadButton.innerHTML = 'Download STL';
    this.downloadButton.style.position = 'absolute';
    this.downloadButton.style.bottom = '20px';
    this.downloadButton.style.left = '20px';
    this.downloadButton.style.zIndex = '1000';
    this.downloadButton.style.padding = '10px 15px';
    this.downloadButton.style.backgroundColor = '#007acc';
    this.downloadButton.style.color = 'white';
    this.downloadButton.style.border = 'none';
    this.downloadButton.style.borderRadius = '5px';
    this.downloadButton.style.cursor = 'pointer';

    this.downloadButton.onclick = () => {
      if (this.voxelExample) {
        try {
          const exporter = new STLExporter();
          const stlString = exporter.parse(this.voxelExample);
          const blob = new Blob([stlString], { type: 'text/plain' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'voxel_example.stl';
          link.click();
        } catch (error) {
          this.handleError(error as Error, 'exporting STL');
        }
      }
    };

    document.body.appendChild(this.downloadButton);
  }

  private startAnimationLoop(renderer: any, scene: THREE.Scene, camera: any): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Remove download button
    if (this.downloadButton && this.downloadButton.parentNode) {
      this.downloadButton.parentNode.removeChild(this.downloadButton);
      this.downloadButton = undefined;
    }

    // Dispose voxel example
    if (this.voxelExample) {
      this.voxelExample.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.voxelExample = undefined;
    }

    // Dispose platform
    if (this.platform) {
      const mesh = this.platform as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      this.platform = undefined;
    }

    // Clear arrays
    this.lights.length = 0;
    this.helpers.length = 0;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const voxelDemoApp = new VoxelDemoApp();

// Export in the expected format for the Stories system
const VoxelStory = {
  load: async (options: StoryOptions) => {
    return voxelDemoApp.load(options);
  },
  dispose: () => {
    return voxelDemoApp.dispose();
  },
  getAppInfo: () => {
    return voxelDemoApp.getAppInfo();
  },
};

export default VoxelStory;
