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
  private camera: THREE.Camera | undefined;
  private controls: any;
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

      // Store references for later use
      this.camera = camera;
      this.controls = controls;

      // Initialize API
      await flyzoneAPI.initialize();

      // Set perfect top-down north-facing view for satellite mapping (like satellite-terrain demo)
      // Position camera VERY high above terrain center, looking straight down
      const initialPos = new THREE.Vector3(0, 50000, 0);  // VERY high altitude for full island overview
      const lookAtPos = new THREE.Vector3(0, 0, 0);       // Look at terrain center

      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Enable orbital controls for camera movement
      controls.enabled = true;
      controls.target.copy(lookAtPos);
      controls.maxDistance = Infinity;   // No maximum zoom out limit
      controls.minDistance = 100;       // Minimum zoom in limit
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

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

    // Clear selected item from state
    this.editorState.selectedItem = null;
    this.editorUI?.refresh();
  }

  private deleteSelectedItem(item: any): void {
    if (!item || !this.editorState?.currentLocation || !this.markers) return;

    const location = this.editorState.currentLocation;
    const confirmed = confirm(`Are you sure you want to delete this ${item.type}?`);

    if (!confirmed) return;

    try {
      switch (item.type) {
        case 'takeoff':
          const takeoffIndex = location.takeoffs.findIndex(t => t.id === item.id);
          if (takeoffIndex >= 0) {
            location.takeoffs.splice(takeoffIndex, 1);
            this.markers.removeMarker(item.id);
          }
          break;

        case 'landing':
          const landingIndex = location.landingZones.findIndex(l => l.id === item.id);
          if (landingIndex >= 0) {
            location.landingZones.splice(landingIndex, 1);
            this.markers.removeMarker(item.id);
          }
          break;

        case 'phase':
          if (location.flyzone.phases[item.id]) {
            delete location.flyzone.phases[item.id];
            this.markers.removeMarker(item.id);
          }
          break;
      }

      // Clear selection and mark dirty
      this.editorState.selectedItem = null;
      this.markLocationDirty();
      this.editorUI?.refresh();

      console.log(`Deleted ${item.type}: ${item.data.title || item.id}`);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  }

  private saveSelectedItemChanges(item: any): void {
    if (!item || !this.editorState?.currentLocation) return;

    try {
      const location = this.editorState.currentLocation;

      // The item data has already been updated by the UI
      // We just need to ensure it's properly saved in the location structure
      switch (item.type) {
        case 'takeoff':
          const takeoffIndex = location.takeoffs.findIndex(t => t.id === item.id);
          if (takeoffIndex >= 0) {
            location.takeoffs[takeoffIndex] = { ...item.data };
          }
          break;

        case 'landing':
          const landingIndex = location.landingZones.findIndex(l => l.id === item.id);
          if (landingIndex >= 0) {
            location.landingZones[landingIndex] = { ...item.data };
          }
          break;

        case 'phase':
          if (location.flyzone.phases[item.id]) {
            location.flyzone.phases[item.id] = { ...item.data };
          }
          break;
      }

      // Mark as saved and update location
      this.markLocationDirty();
      this.editorUI?.refresh();

      console.log(`Saved changes to ${item.type}: ${item.data.title || item.id}`);
    } catch (error) {
      console.error('Failed to save item changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  }

  private focusOnSelectedItem(item: any): void {
    if (!item?.data || !this.camera || !this.controls) return;

    try {
      // Get the position from the item data
      let position: THREE.Vector3;

      if (item.data.position) {
        position = new THREE.Vector3(
          item.data.position.x,
          item.data.position.y,
          item.data.position.z
        );
      } else if (item.data.gps) {
        // Simple GPS to world conversion (approximate for Lanzarote)
        // This is a simplified conversion, actual GPS conversion would require proper projection
        const lat = item.data.gps.latitude;
        const lon = item.data.gps.longitude;
        const x = (lon - 13.5) * 111320 * Math.cos(lat * Math.PI / 180); // Rough conversion
        const z = -(lat - 29.0) * 111320; // Rough conversion (negative for Three.js Z-axis)
        position = new THREE.Vector3(x, item.data.elevation || 0, z);
      } else {
        console.warn('No position data found for item:', item);
        return;
      }

      // Calculate camera position - offset from the target
      const offset = new THREE.Vector3(300, 200, 300);
      const cameraPosition = position.clone().add(offset);

      // Animate camera to focus on the item
      const startPosition = this.camera.position.clone();
      const startTarget = new THREE.Vector3();
      if (this.controls.target) {
        startTarget.copy(this.controls.target);
      }

      const duration = 1000; // 1 second animation
      const startTime = Date.now();

      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);

        // Interpolate camera position
        this.camera!.position.lerpVectors(startPosition, cameraPosition, eased);

        // Interpolate target
        if (this.controls.target) {
          this.controls.target.lerpVectors(startTarget, position, eased);
        }

        this.controls.update();

        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };

      animateCamera();
      console.log(`Focused camera on ${item.type}: ${item.data.title || item.id}`);
    } catch (error) {
      console.error('Failed to focus on item:', error);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private markLocationDirty(): void {
    if (this.editorState) {
      this.editorState.isDirty = true;
    }
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
        case 'e':
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            this.exportToJSON();
          }
          break;
        case 'i':
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            this.importFromJSON();
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
      case 'export-json':
        this.exportToJSON();
        break;
      case 'import-json':
        this.importFromJSON();
        break;
      case 'clear':
        this.clearEditor();
        break;
      case 'deleteSelected':
        this.deleteSelectedItem(data?.item);
        break;
      case 'saveSelectedItem':
        this.saveSelectedItemChanges(data?.item);
        break;
      case 'deselectItem':
        this.deselectAllMarkers();
        break;
      case 'focusSelected':
        this.focusOnSelectedItem(data?.item);
        break;
      case 'selectedItemChanged':
        this.markLocationDirty();
        break;
      case 'locationChanged':
        this.markLocationDirty();
        break;
    }
  }

  private exportToJSON(): void {
    if (!this.editorState) {
      alert('No editor state to export');
      return;
    }

    try {
      // Create export data with current location and all locations
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          tool: 'Flyzone Editor',
          description: 'Flyzone location data export',
        },
        currentLocation: this.editorState.currentLocation,
        allLocations: this.editorState.locations,
        editorSettings: {
          mode: this.editorState.mode,
          isDirty: this.editorState.isDirty,
        },
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, (key, value) => {
        // Custom serializer to handle Three.js Vector3 objects
        if (value && typeof value === 'object' && value.isVector3) {
          return { x: value.x, y: value.y, z: value.z };
        }
        return value;
      }, 2);

      // Create and trigger download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `flyzone-data-${timestamp}.json`;

      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log(`✅ Exported flyzone data to ${filename}`);
      alert(`Successfully exported flyzone data to ${filename}`);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export data. Please check the console for details.');
    }
  }

  private importFromJSON(): void {
    if (!this.editorState || !this.markers) {
      alert('Editor not ready for import');
      return;
    }

    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = e.target?.result as string;
          const importData = JSON.parse(jsonContent);

          // Validate import data structure
          if (!this.validateImportData(importData)) {
            alert('Invalid file format. Please select a valid flyzone data export file.');
            return;
          }

          // Confirm import (this will replace current data)
          const confirmed = confirm(
            'This will replace all current data. Are you sure you want to import this file?\n\n' +
            `File: ${file.name}\n` +
            `Export Date: ${importData.metadata?.exportDate || 'Unknown'}\n` +
            `Locations: ${importData.allLocations?.length || 0}`
          );

          if (!confirmed) return;

          // Clear current data
          this.clearEditor();

          // Import the data
          this.processImportData(importData);

          console.log(`✅ Imported flyzone data from ${file.name}`);
          alert(`Successfully imported flyzone data from ${file.name}`);
        } catch (error) {
          console.error('Failed to import JSON:', error);
          alert('Failed to import file. Please check that it\'s a valid JSON file.');
        }
      };

      reader.readAsText(file);
    };

    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  private validateImportData(data: any): boolean {
    // Basic structure validation
    if (!data || typeof data !== 'object') return false;

    // Check for required top-level properties
    if (!data.metadata || !data.hasOwnProperty('currentLocation') || !Array.isArray(data.allLocations)) {
      return false;
    }

    // Validate metadata
    if (!data.metadata.exportDate || !data.metadata.version) {
      return false;
    }

    // Validate locations array structure (basic check)
    if (data.allLocations.length > 0) {
      const sampleLocation = data.allLocations[0];
      if (!sampleLocation.id || !sampleLocation.title || !sampleLocation.gps) {
        return false;
      }
    }

    return true;
  }

  private processImportData(importData: any): void {
    if (!this.editorState || !this.markers) return;

    try {
      // Restore locations
      this.editorState.locations = importData.allLocations.map((location: any) => {
        // Convert plain objects back to Vector3 where needed
        if (location.position && typeof location.position === 'object') {
          location.position = new THREE.Vector3(
            location.position.x,
            location.position.y,
            location.position.z
          );
        }

        // Convert takeoff positions
        if (location.takeoffs) {
          location.takeoffs.forEach((takeoff: any) => {
            if (takeoff.position && typeof takeoff.position === 'object') {
              takeoff.position = new THREE.Vector3(
                takeoff.position.x,
                takeoff.position.y,
                takeoff.position.z
              );
            }
          });
        }

        // Convert landing zone positions
        if (location.landingZones) {
          location.landingZones.forEach((landing: any) => {
            if (landing.position && typeof landing.position === 'object') {
              landing.position = new THREE.Vector3(
                landing.position.x,
                landing.position.y,
                landing.position.z
              );
            }
          });
        }

        // Convert flyzone phase positions
        if (location.flyzone && location.flyzone.phases) {
          Object.values(location.flyzone.phases).forEach((phase: any) => {
            if (phase.position && typeof phase.position === 'object') {
              phase.position = new THREE.Vector3(
                phase.position.x,
                phase.position.y,
                phase.position.z
              );
            }
          });
        }

        return location;
      });

      // Restore current location
      if (importData.currentLocation) {
        const currentLocation = importData.currentLocation;

        // Convert current location position
        if (currentLocation.position && typeof currentLocation.position === 'object') {
          currentLocation.position = new THREE.Vector3(
            currentLocation.position.x,
            currentLocation.position.y,
            currentLocation.position.z
          );
        }

        this.editorState.currentLocation = currentLocation;
      }

      // Restore editor settings
      if (importData.editorSettings) {
        this.editorState.mode = importData.editorSettings.mode || { type: 'select' };
        this.editorState.isDirty = importData.editorSettings.isDirty || false;
      }

      // Add visual markers for all imported locations
      this.editorState.locations.forEach(location => {
        // Add takeoff markers
        location.takeoffs.forEach(takeoff => {
          this.markers!.addTakeoffMarker(takeoff);
        });

        // Add landing markers
        location.landingZones.forEach(landing => {
          this.markers!.addLandingMarker(landing);
        });

        // Add flight phase markers
        Object.values(location.flyzone.phases).forEach(phase => {
          this.markers!.addFlightPhaseMarker(phase);
        });
      });

      // Update UI and cursor
      this.updateCursor();
      this.editorUI?.refresh();

      console.log(`Imported ${this.editorState.locations.length} locations`);
    } catch (error) {
      console.error('Error processing import data:', error);
      throw error;
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