import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { setupLabelRenderer } from '../../experiences/flyzones/markers/marker';
import {
  EditorState,
  exportLocationData,
  resetLocation,
  undoLastAction,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from './state';
import { createEditorUI } from './ui';
import { setupInteraction } from './interaction';
import './styles.css'; // Import the CSS
import { AppBase } from '../../shared/AppBase';

/**
 * Location Editor App - Interactive location creation and editing tool
 * Seventh app converted to use AppBase architecture
 */
class LocationEditorApp extends AppBase {
  private editorState: EditorState | undefined;
  private labelRenderer: any;
  private animationId: number | undefined;
  private resizeHandler: (() => void) | undefined;
  private raycaster: THREE.Raycaster | undefined;
  private mouse: THREE.Vector2 | undefined;
  private debugSphere: THREE.Object3D | undefined;

  constructor() {
    super({
      name: 'Location Editor',
      description:
        'Interactive tool for creating and editing flight locations with takeoffs, landings, and fly zones',
      requiredComponents: ['scene', 'camera', 'renderer', 'controls', 'gui', 'terrain'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Clear visibility for precise editing
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 25000, // Log performance every 25 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { camera, scene, renderer, controls, gui, terrain } = options;

      // Set initial camera position
      camera.position.set(1000, 5000, 1000);

      // Store scene in window for UI access
      (window as any).__editorScene = scene;

      // Initialize editor state
      this.initializeEditorState(scene);

      // Setup components
      this.setupLabelRenderer();
      this.setupTerrain(terrain);
      this.setupInteraction(renderer, camera, scene);
      this.setupGUI(gui, scene);
      this.setupDebugVisuals(scene);

      // Create UI
      createEditorUI(this.editorState!);

      // Initialize cursor style
      this.updateCursorStyle(this.editorState!.mode, renderer);

      // Setup event handlers and start animation
      this.setupEventHandlers();
      this.startAnimationLoop(scene, camera, renderer, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private initializeEditorState(scene: THREE.Scene): void {
    const savedState = loadFromLocalStorage(scene);

    if (savedState) {
      this.editorState = savedState;
    } else {
      this.editorState = {
        locations: [],
        currentLocationIndex: null,
        selectedItem: null,
        mode: 'location', // Start in location creation mode
        flyZonePhaseType: 'takeoff',
        markers: [],
        flyZones: [],
        history: [],
      };
    }
  }

  private setupLabelRenderer(): void {
    this.labelRenderer = setupLabelRenderer();
  }

  private setupTerrain(terrain: any): void {
    // Make sure terrain is clickable
    if (terrain) {
      terrain.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.userData['type'] = 'terrain';
          child.userData['clickable'] = true;
        }
      });
    }
  }

  private setupInteraction(renderer: any, camera: any, scene: THREE.Scene): void {
    const result = setupInteraction(renderer, camera, scene, this.editorState!);
    this.raycaster = result.raycaster;
    this.mouse = result.mouse;
  }

  private setupGUI(gui: any, scene: THREE.Scene): void {
    if (!gui || !this.editorState) return;

    // Setup editor GUI
    const editorFolder = gui.addFolder('Location Editor');
    editorFolder.open();

    // Mode selection
    const modeFolder = editorFolder.addFolder('Mode');
    modeFolder.open();
    modeFolder
      .add(this.editorState, 'mode', ['location', 'takeoff', 'landing', 'flyzone'])
      .name('Edit Mode')
      .onChange((value: string) => {
        this.updateCursorStyle(value);
        this.saveState();
      });

    // FlyZone phase type selection
    const flyZoneFolder = editorFolder.addFolder('FlyZone Settings');
    flyZoneFolder.open();
    flyZoneFolder
      .add(this.editorState, 'flyZonePhaseType', ['takeoff', 'ridge', 'approach', 'landing'])
      .name('Phase Type')
      .onChange(() => {
        this.saveState();
      });

    // Export button
    editorFolder
      .add({ exportData: () => this.exportData() }, 'exportData')
      .name('Export Location Data');

    // Reset button
    editorFolder
      .add({ resetLocation: () => this.resetLocation(scene) }, 'resetLocation')
      .name('Reset Location');

    // Undo button
    editorFolder
      .add({ undoLastAction: () => this.undoLastAction(scene) }, 'undoLastAction')
      .name('Undo Last Action');

    // Clear storage button
    editorFolder
      .add({ clearStorage: () => this.clearStorage(scene) }, 'clearStorage')
      .name('Clear Saved Data');
  }

  private saveState(): void {
    if (this.editorState) {
      saveToLocalStorage(this.editorState);
    }
  }

  private exportData(): void {
    if (this.editorState) {
      exportLocationData(this.editorState);
    }
  }

  private resetLocation(scene: THREE.Scene): void {
    if (this.editorState) {
      resetLocation(this.editorState, scene);
      clearLocalStorage();
      createEditorUI(this.editorState);
    }
  }

  private undoLastAction(scene: THREE.Scene): void {
    if (this.editorState) {
      undoLastAction(this.editorState, scene);
      createEditorUI(this.editorState);
    }
  }

  private clearStorage(scene: THREE.Scene): void {
    if (this.editorState) {
      clearLocalStorage();
      resetLocation(this.editorState, scene);
      createEditorUI(this.editorState);
    }
  }

  private updateCursorStyle(mode: string, renderer?: any): void {
    const rendererElement = renderer?.domElement || document.querySelector('canvas');
    if (!rendererElement) return;

    switch (mode) {
      case 'location':
        rendererElement.style.cursor = 'crosshair';
        break;
      case 'takeoff':
        rendererElement.style.cursor = 'cell';
        break;
      case 'landing':
        rendererElement.style.cursor = 'copy';
        break;
      case 'flyzone':
        rendererElement.style.cursor = 'pointer';
        break;
      default:
        rendererElement.style.cursor = 'default';
    }
  }

  private setupDebugVisuals(scene: THREE.Scene): void {
    // Add a debug sphere to verify the scene is working
    const debugSphere = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    debugSphere.position.set(0, 1000, 0);
    scene.add(debugSphere);
    this.debugSphere = debugSphere;
  }

  private setupEventHandlers(): void {
    // Setup window resize handler
    this.resizeHandler = () => {
      if (this.labelRenderer) {
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private startAnimationLoop(scene: THREE.Scene, camera: any, renderer: any, controls: any): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Update hover states
        if (this.raycaster && this.mouse) {
          this.raycaster.setFromCamera(this.mouse, camera);
        }

        renderer.render(scene, camera);
        if (this.labelRenderer) {
          this.labelRenderer.render(scene, camera);
        }
        controls.update();

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

    // Cleanup resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Cleanup label renderer
    if (
      this.labelRenderer &&
      this.labelRenderer.domElement &&
      this.labelRenderer.domElement.parentNode
    ) {
      this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);
      this.labelRenderer = undefined;
    }

    // Cleanup debug sphere
    if (this.debugSphere) {
      const mesh = this.debugSphere as THREE.Mesh;
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
      this.debugSphere = undefined;
    }

    // Clear window reference
    if ((window as any).__editorScene) {
      delete (window as any).__editorScene;
    }

    // Clear editor state
    this.editorState = undefined;
    this.raycaster = undefined;
    this.mouse = undefined;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const locationEditorApp = new LocationEditorApp();

// Export in the expected format for the Stories system
const LocationEditor = {
  load: async (options: StoryOptions) => {
    return locationEditorApp.load(options);
  },
  dispose: () => {
    return locationEditorApp.dispose();
  },
  getAppInfo: () => {
    return locationEditorApp.getAppInfo();
  },
};

export default LocationEditor;
