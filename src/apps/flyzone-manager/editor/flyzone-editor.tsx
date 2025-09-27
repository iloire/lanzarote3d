import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { TerrainBase } from '../../shared/TerrainBase';
import { flyzoneAPI } from '../api/flyzone-api';
import {
  FlyzoneLocation,
  TakeoffLocation,
  LandingZone,
  FlightPhase,
  WindCondition,
  GPS,
} from '../types/flyzone-types';
import { FlyzoneEditorUI } from './flyzone-editor-ui';
import { FlyzoneMarkers } from './flyzone-markers';
import './flyzone-editor.css';

/**
 * Interactive Flyzone Editor - Terrain-based location creation and editing
 *
 * Features:
 * - Click-to-place takeoff and landing locations
 * - Interactive flyzone boundary definition
 * - Wind condition configuration
 * - Media attachment (images/videos)
 * - Real-time GPS coordinate display
 * - Terrain-aware placement validation
 */

export interface EditorMode {
  type: 'select' | 'takeoff' | 'landing' | 'flyzone' | 'edit';
  subtype?: 'ridge' | 'thermal' | 'approach';
}

export interface EditorState {
  mode: EditorMode;
  currentLocation: FlyzoneLocation | null;
  selectedItem: any | null;
  isEditing: boolean;
  isDirty: boolean;
  locations: FlyzoneLocation[];
}

class FlyzoneEditorApp extends TerrainBase {
  private editorState: EditorState | undefined;
  private editorUI: FlyzoneEditorUI | undefined;
  private markers: FlyzoneMarkers | undefined;
  private animationId: number | undefined;
  private raycaster: THREE.Raycaster | undefined;
  private mouse: THREE.Vector2 | undefined;
  private isMouseDown = false;
  private terrainMesh: THREE.Mesh | undefined;
  private eventHandlers: {
    onMouseMove?: (event: MouseEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  } = {};

  constructor() {
    super({
      name: 'Flyzone Editor',
      description: 'Interactive tool for creating and editing flyzone locations with wind analysis',
      requiredComponents: ['scene', 'camera', 'renderer', 'controls', 'gui', 'terrain', 'water', 'sky'],
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
        logIntervalMs: 30000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, controls, gui, terrain } = options;

      // Initialize API
      await flyzoneAPI.initialize();

      // Set initial camera position for editing
      camera.position.set(5000, 2000, 0);

      // Store terrain reference
      this.terrainMesh = terrain;

      // Initialize editor state
      await this.initializeEditorState();

      // Setup interaction
      this.setupInteraction(renderer, camera, scene);

      // Initialize UI components
      this.editorUI = new FlyzoneEditorUI(this.editorState!, this.onUIAction.bind(this));
      this.markers = new FlyzoneMarkers(scene);

      // Setup GUI controls
      this.setupGUI(gui);

      // Load existing locations
      await this.loadExistingLocations();

      // Setup event handlers
      this.setupEventHandlers(renderer);

      // Start animation loop
      this.startAnimationLoop(scene, camera, renderer, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async initializeEditorState(): Promise<void> {
    this.editorState = {
      mode: { type: 'select' },
      currentLocation: null,
      selectedItem: null,
      isEditing: false,
      isDirty: false,
      locations: [],
    };
  }

  private setupInteraction(renderer: THREE.WebGLRenderer, camera: THREE.Camera, scene: THREE.Scene): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Mouse event handlers
    this.eventHandlers.onMouseMove = (event: MouseEvent) => {
      if (!this.mouse) return;

      const rect = renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateCursor();
    };

    this.eventHandlers.onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left click
        this.isMouseDown = true;
      }
    };

    this.eventHandlers.onMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && this.isMouseDown) {
        // Handle clicks in all modes
        const handled = this.handleClick(camera, scene);

        // Prevent camera controls only when in placement modes or when marker was selected
        if (this.editorState && (this.editorState.mode.type !== 'select' || handled)) {
          event.stopPropagation();
          event.preventDefault();
        }
        this.isMouseDown = false;
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousemove', this.eventHandlers.onMouseMove);
    renderer.domElement.addEventListener('mousedown', this.eventHandlers.onMouseDown);
    renderer.domElement.addEventListener('mouseup', this.eventHandlers.onMouseUp);
  }

  private updateCursor(): void {
    if (!this.editorState) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    switch (this.editorState.mode.type) {
      case 'select':
        canvas.style.cursor = 'default'; // Allow normal camera controls
        break;
      case 'takeoff':
        canvas.style.cursor = 'crosshair';
        break;
      case 'landing':
        canvas.style.cursor = 'copy';
        break;
      case 'flyzone':
        canvas.style.cursor = 'cell';
        break;
      case 'edit':
        canvas.style.cursor = 'move';
        break;
      default:
        canvas.style.cursor = 'default';
    }
  }

  private handleClick(camera: THREE.Camera, scene: THREE.Scene): boolean {
    if (!this.raycaster || !this.mouse || !this.editorState || !this.terrainMesh) return false;

    this.raycaster.setFromCamera(this.mouse, camera);

    // First check for marker selection in all modes
    if (this.markers && this.trySelectMarker()) {
      return true; // Marker was selected, event was handled
    }

    // If no marker was selected and we're in a placement mode, handle terrain click
    if (this.editorState.mode.type !== 'select') {
      const terrainIntersects = this.raycaster.intersectObject(this.terrainMesh, true);
      if (terrainIntersects.length === 0) return false;

      const intersectionPoint = terrainIntersects[0].point;
      const gps = flyzoneAPI.worldPositionToGPS(intersectionPoint);

      switch (this.editorState.mode.type) {
        case 'takeoff':
          this.addTakeoffLocation(intersectionPoint, gps);
          return true;
        case 'landing':
          this.addLandingZone(intersectionPoint, gps);
          return true;
        case 'flyzone':
          this.addFlightPhase(intersectionPoint, gps);
          return true;
      }
    }

    return false; // Event was not handled
  }

  private addTakeoffLocation(position: THREE.Vector3, gps: GPS): void {
    if (!this.editorState || !this.markers) return;

    // Create default takeoff location
    const takeoff: TakeoffLocation = {
      id: `takeoff_${Date.now()}`,
      title: `Takeoff ${this.getCurrentLocationTakeoffCount() + 1}`,
      description: 'New takeoff location',
      position: position.clone(),
      gps,
      elevation: position.y,
      windConditions: [{
        id: `wind_${Date.now()}`,
        direction: { ideal: 0, range: [315, 45] },
        speed: { min: 10, max: 30, ideal: 20 },
        rating: 3,
        description: 'Standard wind conditions',
      }],
      safety: {
        difficulty: 'intermediate',
        hazards: [],
        emergency: {
          contacts: [],
          procedures: [],
        },
      },
      access: {
        difficulty: 'moderate',
        description: 'Standard access',
        walkingTime: 10,
      },
      mediaItems: [],
      lastUpdated: new Date().toISOString(),
      createdBy: 'editor',
      verified: false,
    };

    // Add to current location or create new location
    if (!this.editorState.currentLocation) {
      this.createNewLocation(position, gps, [takeoff], []);
    } else {
      this.editorState.currentLocation.takeoffs.push(takeoff);
    }

    // Add visual marker
    this.markers.addTakeoffMarker(takeoff);

    // Update UI
    this.markAsDirty();
    this.editorUI?.refresh();

    console.log(`Added takeoff at GPS: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`);
  }

  private addLandingZone(position: THREE.Vector3, gps: GPS): void {
    if (!this.editorState || !this.markers) return;

    const landingZone: LandingZone = {
      id: `landing_${Date.now()}`,
      title: `Landing ${this.getCurrentLocationLandingCount() + 1}`,
      description: 'New landing zone',
      position: position.clone(),
      gps,
      elevation: position.y,
      type: 'primary',
      size: { width: 100, length: 150 },
      surface: 'grass',
      obstacles: [],
      approach: {
        preferredDirection: 0,
        gradient: 0,
        warnings: [],
      },
      windLimitations: {
        maxSpeed: 35,
        unsafeDirections: [],
      },
      mediaItems: [],
      lastUpdated: new Date().toISOString(),
      createdBy: 'editor',
      verified: false,
    };

    if (!this.editorState.currentLocation) {
      this.createNewLocation(position, gps, [], [landingZone]);
    } else {
      this.editorState.currentLocation.landingZones.push(landingZone);
    }

    this.markers.addLandingMarker(landingZone);
    this.markAsDirty();
    this.editorUI?.refresh();

    console.log(`Added landing zone at GPS: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`);
  }

  private addFlightPhase(position: THREE.Vector3, gps: GPS): void {
    if (!this.editorState || !this.markers) return;

    const phaseType = this.editorState.mode.subtype || 'ridge';
    const phase: FlightPhase = {
      id: `phase_${Date.now()}`,
      type: phaseType as any,
      position: position.clone(),
      gps,
      dimensions: { width: 500, height: 200, length: 800 },
      description: `${phaseType} flight area`,
      altitudeRange: { min: position.y, max: position.y + 200 },
      nextPhases: [],
    };

    if (!this.editorState.currentLocation) {
      // Create new location with flyzone
      const flyzone = {
        id: `flyzone_${Date.now()}`,
        name: 'New Flyzone',
        description: 'Newly created flyzone',
        color: 0x00ff00,
        phases: { [phase.id]: phase },
        lastUpdated: new Date().toISOString(),
        createdBy: 'editor',
      };

      this.createNewLocation(position, gps, [], [], flyzone);
    } else {
      // Add to existing flyzone
      this.editorState.currentLocation.flyzone.phases[phase.id] = phase;
    }

    this.markers.addFlightPhaseMarker(phase);
    this.markAsDirty();
    this.editorUI?.refresh();

    console.log(`Added ${phaseType} phase at GPS: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`);
  }

  private createNewLocation(
    position: THREE.Vector3,
    gps: GPS,
    takeoffs: TakeoffLocation[] = [],
    landingZones: LandingZone[] = [],
    flyzone?: any
  ): void {
    if (!this.editorState) return;

    const bounds = {
      north: gps.latitude + 0.01,
      south: gps.latitude - 0.01,
      east: gps.longitude + 0.01,
      west: gps.longitude - 0.01,
    };

    const newLocation: FlyzoneLocation = {
      id: `location_${Date.now()}`,
      title: 'New Location',
      description: 'Newly created flyzone location',
      region: 'Unknown',
      position: position.clone(),
      gps,
      bounds,
      cameraView: {
        position: new THREE.Vector3(position.x - 500, position.y + 300, position.z + 500),
        lookAt: position.clone(),
        distance: 800,
      },
      takeoffs,
      landingZones,
      flyzone: flyzone || {
        id: `flyzone_${Date.now()}`,
        name: 'Default Flyzone',
        description: 'Default flyzone for location',
        color: 0x00ff00,
        phases: {},
        lastUpdated: new Date().toISOString(),
        createdBy: 'editor',
      },
      popularity: 1,
      lastUpdated: new Date().toISOString(),
      createdBy: 'editor',
      verified: false,
      bestMonths: [],
      averageWindDirection: 0,
      averageWindSpeed: 15,
    };

    this.editorState.currentLocation = newLocation;
    this.editorState.locations.push(newLocation);
  }

  private trySelectMarker(): boolean {
    if (!this.markers || !this.raycaster || !this.editorState) return false;

    // Get all marker objects for raycasting
    const markerObjects: THREE.Object3D[] = [];
    this.markers['markers'].forEach(marker => {
      markerObjects.push(marker);
    });

    if (markerObjects.length === 0) return false;

    const intersects = this.raycaster.intersectObjects(markerObjects, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      let markerGroup = clickedObject;

      // Find the marker group by traversing up the parent hierarchy
      while (markerGroup && !markerGroup.userData.type) {
        markerGroup = markerGroup.parent!;
      }

      if (markerGroup && markerGroup.userData) {
        const { type, id, data } = markerGroup.userData;

        // Deselect all markers first
        this.deselectAllMarkers();

        // Select the clicked marker
        if (this.markers) {
          this.markers.selectMarker(id);
        }

        // Update editor state
        this.editorState.selectedItem = {
          type,
          id,
          data,
        };

        // Update UI
        this.editorUI?.refresh();

        console.log(`Selected ${type}: ${data.title || data.description || id}`);
        return true;
      }
    }

    // No marker selected, deselect all
    this.deselectAllMarkers();
    this.editorState.selectedItem = null;
    this.editorUI?.refresh();

    return false;
  }

  private deselectAllMarkers(): void {
    if (!this.markers || !this.editorState) return;

    // Deselect all existing markers
    this.editorState.locations.forEach(location => {
      location.takeoffs.forEach(takeoff => {
        this.markers!.deselectMarker(takeoff.id);
      });
      location.landingZones.forEach(landing => {
        this.markers!.deselectMarker(landing.id);
      });
      Object.values(location.flyzone.phases).forEach(phase => {
        this.markers!.deselectMarker(phase.id);
      });
    });
  }

  private getCurrentLocationTakeoffCount(): number {
    return this.editorState?.currentLocation?.takeoffs.length || 0;
  }

  private getCurrentLocationLandingCount(): number {
    return this.editorState?.currentLocation?.landingZones.length || 0;
  }

  private markAsDirty(): void {
    if (this.editorState) {
      this.editorState.isDirty = true;
    }
  }

  private async loadExistingLocations(): Promise<void> {
    if (!this.editorState) return;

    try {
      const summaries = await flyzoneAPI.getLocationSummaries();

      for (const summary of summaries) {
        const location = await flyzoneAPI.getLocation(summary.id);
        if (location) {
          this.editorState.locations.push(location);

          // Add visual markers for existing locations
          if (this.markers) {
            location.takeoffs.forEach(takeoff => {
              this.markers!.addTakeoffMarker(takeoff);
            });

            location.landingZones.forEach(landing => {
              this.markers!.addLandingMarker(landing);
            });

            Object.values(location.flyzone.phases).forEach(phase => {
              this.markers!.addFlightPhaseMarker(phase);
            });
          }
        }
      }

      console.log(`Loaded ${this.editorState.locations.length} existing locations`);
    } catch (error) {
      console.error('Failed to load existing locations:', error);
    }
  }

  private setupGUI(gui: any): void {
    if (!gui || !this.editorState) return;

    const editorFolder = gui.addFolder('Flyzone Editor');
    editorFolder.open();

    // Mode selection
    const modes = ['select', 'takeoff', 'landing', 'flyzone', 'edit'];
    editorFolder
      .add({ mode: this.editorState.mode.type }, 'mode', modes)
      .name('Editor Mode')
      .onChange((value: string) => {
        if (this.editorState) {
          this.editorState.mode.type = value as any;
          this.updateCursor();
        }
      });

    // Flyzone subtype for flyzone mode
    const subtypes = ['ridge', 'thermal', 'approach'];
    editorFolder
      .add({ subtype: this.editorState.mode.subtype || 'ridge' }, 'subtype', subtypes)
      .name('Phase Type')
      .onChange((value: string) => {
        if (this.editorState) {
          this.editorState.mode.subtype = value as any;
        }
      });

    // Save/Load controls
    editorFolder
      .add({ save: () => this.saveCurrentLocation() }, 'save')
      .name('Save Location');

    editorFolder
      .add({ load: () => this.loadLocationDialog() }, 'load')
      .name('Load Location');

    editorFolder
      .add({ clear: () => this.clearEditor() }, 'clear')
      .name('Clear All');
  }

  private async saveCurrentLocation(): Promise<void> {
    if (!this.editorState?.currentLocation) {
      console.warn('No location to save');
      return;
    }

    try {
      const saved = await flyzoneAPI.saveLocation({
        location: this.editorState.currentLocation,
      });

      this.editorState.isDirty = false;
      console.log(`Saved location: ${saved.title}`);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  }

  private loadLocationDialog(): void {
    // Implementation would show a dialog to select from existing locations
    console.log('Load location dialog - to be implemented');
  }

  private clearEditor(): void {
    if (!this.editorState || !this.markers) return;

    this.markers.clear();
    this.editorState.currentLocation = null;
    this.editorState.selectedItem = null;
    this.editorState.isDirty = false;
    this.editorUI?.refresh();

    console.log('Editor cleared');
  }

  private setupEventHandlers(renderer: THREE.WebGLRenderer): void {
    // Keyboard shortcuts
    this.eventHandlers.onKeyDown = (event: KeyboardEvent) => {
      if (!this.editorState) return;

      switch (event.key) {
        case 'Escape':
          this.editorState.mode.type = 'select';
          this.updateCursor();
          break;
        case 't':
          if (event.ctrlKey) {
            this.editorState.mode.type = 'takeoff';
            this.updateCursor();
          }
          break;
        case 'l':
          if (event.ctrlKey) {
            this.editorState.mode.type = 'landing';
            this.updateCursor();
          }
          break;
        case 's':
          if (event.ctrlKey) {
            event.preventDefault();
            this.saveCurrentLocation();
          }
          break;
      }
    };

    window.addEventListener('keydown', this.eventHandlers.onKeyDown);
  }

  private onUIAction(action: string, data?: any): void {
    // Handle UI actions from the editor interface
    switch (action) {
      case 'modeChange':
        if (this.editorState) {
          this.editorState.mode = data;
          this.updateCursor();
        }
        break;
      case 'save':
        this.saveCurrentLocation();
        break;
      case 'load':
        this.loadLocationDialog();
        break;
      case 'clear':
        this.clearEditor();
        break;
      // Add more actions as needed
    }
  }

  private startAnimationLoop(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    controls: any
  ): void {
    const animate = () => {
      try {
        this.updatePerformance();

        // Update markers
        if (this.markers) {
          this.markers.update();
        }

        // Update UI
        if (this.editorUI) {
          this.editorUI.update();
        }

        renderer.render(scene, camera);
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

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Clean up event handlers
    const canvas = document.querySelector('canvas');
    if (canvas) {
      if (this.eventHandlers.onMouseMove) {
        canvas.removeEventListener('mousemove', this.eventHandlers.onMouseMove);
      }
      if (this.eventHandlers.onMouseDown) {
        canvas.removeEventListener('mousedown', this.eventHandlers.onMouseDown);
      }
      if (this.eventHandlers.onMouseUp) {
        canvas.removeEventListener('mouseup', this.eventHandlers.onMouseUp);
      }
    }

    if (this.eventHandlers.onKeyDown) {
      window.removeEventListener('keydown', this.eventHandlers.onKeyDown);
    }

    if (this.editorUI) {
      this.editorUI.dispose();
      this.editorUI = undefined;
    }

    if (this.markers) {
      this.markers.dispose();
      this.markers = undefined;
    }

    this.editorState = undefined;
    this.raycaster = undefined;
    this.mouse = undefined;
    this.terrainMesh = undefined;
    this.eventHandlers = {};

    super.dispose();
  }
}

// Create singleton instance
const flyzoneEditorApp = new FlyzoneEditorApp();

// Export in the expected format for the Stories system
const FlyzoneEditor = {
  load: async (options: StoryOptions) => {
    return flyzoneEditorApp.load(options);
  },
  dispose: () => {
    return flyzoneEditorApp.dispose();
  },
  getAppInfo: () => {
    return flyzoneEditorApp.getAppInfo();
  },
};

export default FlyzoneEditor;