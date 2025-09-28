import * as THREE from 'three';
import locations from './locations';
// import VideoFrame from "../components/video-frame";
import { StoryOptions } from '../../shared/types';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Location as FlyLocation } from './helpers/types';
import {
  setupPopupContainer,
  VISIBILITY_THRESHOLDS,
  MarkerType,
  createCustomFlyZone,
  createMarker,
  setupLabelRenderer,
} from './helpers';
import { createSimpleMarker } from './markers/marker-creator';

import { getConfig, updateConfig } from './config/flyzone-config';

import { createRuler } from './helpers/ruler';
import { createUI } from './ui/UI';
import { navigateTo } from './navigation/camera';
import { setupMouseClickHandler } from './events/mouse';
import { setupAnimationLoop } from './animation/loop';
import { toggleLandingMarkers } from './markers/toggle';
import './styles/ruler.css';
import { Marker as MarkerHelper } from './markers/markers';
import { createWindArrowsForTakeoff } from './helpers/wind';
import './styles/popup.css';
import { TerrainBase } from '../../shared/TerrainBase';

/**
 * FlyZones App - Flight zone visualization with interactive markers and controls
 * Sixth app converted to use AppBase architecture
 */
class FlyZonesApp extends TerrainBase {
  private markers: MarkerHelper[] = [];
  private landingMarkers: THREE.Object3D[] = [];
  private landingMarkersVisible = true;
  private currentLocation: FlyLocation | undefined;
  private popupContainer: HTMLElement | undefined;
  private labelRenderer: any | undefined;
  private ruler: any | undefined;
  private animationId: number | undefined;
  private cleanupMouseHandler: (() => void) | undefined;
  private resizeHandler: (() => void) | undefined;

  constructor() {
    super({
      name: 'FlyZones',
      description:
        'Flight zone visualization with interactive markers, landing spots, and navigation controls',
      requiredComponents: [
        'scene',
        'camera',
        'renderer',
        'controls',
        'gui',
        'terrain',
        'water',
        'sky',
      ],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Clear visibility for flight zone visualization
        },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 15000, // Log performance every 15 seconds
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from TerrainBase
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, controls, gui, terrain } = options;

      // Setup scene components
      this.setupScene(scene);
      this.setupLabelRenderer();

      // Load all locations and markers
      await this.loadLocations(scene, camera, controls);

      // Setup GUI controls
      this.setupGUIControls(gui, camera);

      // Setup tools and UI
      this.setupTools(scene, camera, renderer);
      this.setupUI(camera, controls);

      // Setup controls and navigation
      this.setupControls(controls);
      this.setInitialPosition(camera, controls);

      // Setup event handlers
      this.setupEventHandlers(renderer, camera, scene, controls);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully with ${this.markers.length} markers`);
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupLabelRenderer(): void {
    this.popupContainer = setupPopupContainer();
    this.labelRenderer = setupLabelRenderer();

    // Make sure labelRenderer is properly sized
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.labelRenderer.domElement);
  }

  private setupScene(scene: THREE.Scene): void {
    // Add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light (like sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1000, 1000, 1000);
    scene.add(directionalLight);

    // Set background color (sky blue)
    scene.background = new THREE.Color(0x87ceeb);

    // Add a simple ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(50000, 50000);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7e4f, // Green color for ground
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -10; // Slightly below origin
    scene.add(ground);
  }

  private async loadLocations(scene: THREE.Scene, camera: any, controls: any): Promise<void> {
    // Loading available locations
    if (locations.length === 0) {
      this.handleError(new Error('No locations found!'), 'loading locations');

      // Add a fallback object if no locations
      const dummyGeometry = new THREE.BoxGeometry(500, 500, 500);
      const dummyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const dummyCube = new THREE.Mesh(dummyGeometry, dummyMaterial);
      dummyCube.position.set(0, 250, 0);
      scene.add(dummyCube);
      return;
    }

    // Processing locations
    for (const location of locations as FlyLocation[]) {
      try {
        // Create a simple sphere to represent the location
        const locationMarker = await createSimpleMarker({
          position: location.position,
          color: 0x00ff00,
          size: 300,
        });

        // Add the marker to the scene
        scene.add(locationMarker);

        // Create a label for the location
        const labelDiv = document.createElement('div');
        labelDiv.className = 'location-label';
        labelDiv.textContent = location.title;

        const label = new CSS2DObject(labelDiv);
        label.position.copy(location.position);
        label.position.y += 400; // Offset the label above the marker
        scene.add(label);

        // Add to markers array
        this.markers.push({
          type: MarkerType.LOCATION,
          position: location.position,
          object: locationMarker,
          label: label,
          data: location,
          pin: locationMarker,
        });

        // Create takeoff markers
        if (location.takeoffs && location.takeoffs.length > 0) {
          for (const takeoff of location.takeoffs) {
            try {
              // Create a takeoff marker
              const navigateToWrapper = (position: THREE.Vector3, location?: FlyLocation) => {
                navigateTo(position, camera, controls, location);
              };

              const takeoffMarker = await createMarker(
                takeoff.position,
                takeoff.title,
                takeoff.description,
                takeoff.mediaItems,
                MarkerType.TAKEOFF,
                scene,
                this.popupContainer as HTMLDivElement,
                navigateToWrapper,
                this.currentLocation,
                camera,
                takeoff.conditions
              );

              // Add to markers array
              this.markers.push({
                type: MarkerType.TAKEOFF,
                position: takeoff.position,
                object: takeoffMarker as unknown as THREE.Object3D,
                data: takeoff,
                pin: takeoffMarker as unknown as THREE.Object3D,
                setVisibility: (visible: boolean) => {
                  if (takeoffMarker) {
                    takeoffMarker.visible = visible;
                  }
                },
              });

              // Create wind arrows for this takeoff
              const windArrows = createWindArrowsForTakeoff(takeoff.position, takeoff.conditions);
              windArrows.forEach(arrow => scene.add(arrow));
            } catch (error) {
              this.handleError(error as Error, `loading takeoff ${takeoff.title}`);
            }
          }
        }

        // Create landing markers
        if (location.landingSpots && location.landingSpots.length > 0) {
          for (const landing of location.landingSpots) {
            try {
              // Create improved landing marker with color based on type
              const isPrimary = landing.type === 'primary';
              const markerColor = isPrimary ? 0x00ff00 : 0xffaa00; // Green for primary, orange for secondary

              // Create main cylinder with better proportions
              const landingGeometry = new THREE.CylinderGeometry(120, 180, 40, 20);
              const landingMaterial = new THREE.MeshLambertMaterial({
                color: markerColor,
                transparent: true,
                opacity: 0.8,
              });
              const landingMarker = new THREE.Mesh(landingGeometry, landingMaterial);

              // Add glow effect
              const glowGeometry = new THREE.CylinderGeometry(140, 200, 44, 20);
              const glowMaterial = new THREE.MeshBasicMaterial({
                color: markerColor,
                transparent: true,
                opacity: 0.3,
              });
              const glowMarker = new THREE.Mesh(glowGeometry, glowMaterial);

              // Position markers
              landingMarker.position.copy(landing.position);
              glowMarker.position.copy(landing.position);

              // Create a group for the landing marker
              const landingGroup = new THREE.Group();
              landingGroup.add(glowMarker);
              landingGroup.add(landingMarker);

              scene.add(landingGroup);

              // Create a label for the landing with improved styling
              const landingLabelDiv = document.createElement('div');
              landingLabelDiv.className = 'landing-label';
              landingLabelDiv.textContent = `${landing.title} ${isPrimary ? '🎯' : '⚠️'}`;
              landingLabelDiv.style.background = isPrimary
                ? 'rgba(0, 255, 0, 0.8)'
                : 'rgba(255, 170, 0, 0.8)';
              landingLabelDiv.style.color = 'white';
              landingLabelDiv.style.padding = '4px 8px';
              landingLabelDiv.style.borderRadius = '4px';
              landingLabelDiv.style.fontSize = '14px';
              landingLabelDiv.style.fontWeight = 'bold';

              const landingLabel = new CSS2DObject(landingLabelDiv);
              landingLabel.position.copy(landing.position);
              landingLabel.position.y += 120; // Offset the label above the marker
              scene.add(landingLabel);

              // Add to markers array
              this.markers.push({
                type: MarkerType.LANDING,
                position: landing.position,
                object: landingGroup,
                label: landingLabel,
                data: landing,
                pin: landingGroup,
              });

              // Add to landing markers array for toggling visibility
              this.landingMarkers.push(landingGroup);
              this.landingMarkers.push(landingLabel);
            } catch (error) {
              this.handleError(error as Error, `loading landing spot ${landing.title}`);
            }
          }
        }

        // Create flyzone visualization if available
        if (location.flyzone) {
          try {
            // Create a custom flyzone visualization
            const flyzone = await createCustomFlyZone(location.flyzone);

            // Add the flyzone to the scene
            scene.add(flyzone);

            // Add to markers array
            this.markers.push({
              type: MarkerType.LOCATION,
              position: location.position,
              object: flyzone,
              data: location.flyzone,
              pin: flyzone,
            });
          } catch (error) {
            this.handleError(error as Error, `loading flyzone for ${location.title}`);
          }
        }
      } catch (error) {
        this.handleError(error as Error, `loading location ${location.title}`);
      }
    }
  }

  private setupGUIControls(gui: any, camera: any): void {
    if (!gui) return;

    const config = getConfig();
    const flyzonesFolder = gui.addFolder('Flyzones');

    // Display settings
    const displayFolder = flyzonesFolder.addFolder('Display');

    displayFolder
      .add(config.display, 'flyzone')
      .name('Show Flyzones')
      .onChange((value: boolean) => {
        updateConfig({ display: { flyzone: value } });
        // Update visibility of existing flyzones
        this.markers.forEach(marker => {
          if (marker.object && marker.position) {
            marker.object.visible =
              value &&
              camera.position.distanceTo(marker.position) < VISIBILITY_THRESHOLDS.DETAIL_VIEW;
          }
        });
      });

    displayFolder
      .add(config.display, 'markers')
      .name('Show Markers')
      .onChange((value: boolean) => {
        updateConfig({ display: { markers: value } });
        this.markers.forEach(marker => {
          if (marker.pin) {
            marker.pin.visible = value;
          }
        });
      });

    displayFolder
      .add(config.display, 'labels')
      .name('Show Labels')
      .onChange((value: boolean) => {
        updateConfig({ display: { labels: value } });
        // Update label visibility
        this.markers.forEach(marker => {
          if (marker.pin) {
            const label = marker.pin.children.find(child => child instanceof CSS2DObject);
            if (label) label.visible = value;
          }
        });
      });

    // Colors settings
    const colorsFolder = flyzonesFolder.addFolder('Colors');
    colorsFolder.addColor(config.colors, 'takeoff').name('Takeoff Zone');
    colorsFolder.addColor(config.colors, 'landing').name('Landing Zone');
    colorsFolder.addColor(config.colors, 'ridge').name('Ridge Zone');
    colorsFolder.addColor(config.colors, 'approach').name('Approach Zone');

    // Opacity settings
    const opacityFolder = flyzonesFolder.addFolder('Opacity');
    opacityFolder.add(config.opacity, 'boxes', 0, 1).name('Boxes');
    opacityFolder.add(config.opacity, 'lines', 0, 1).name('Lines');
  }

  private setupTools(scene: THREE.Scene, camera: any, renderer: any): void {
    // Create ruler tool
    this.ruler = createRuler({
      scene,
      camera,
      renderer,
      labelRenderer: this.labelRenderer,
    });
  }

  private toggleRuler(): void {
    if (this.ruler && this.ruler.isActive()) {
      this.ruler.deactivate();
      document.getElementById('ruler-toggle-btn')?.classList.remove('active');
    } else if (this.ruler) {
      this.ruler.activate();
      document.getElementById('ruler-toggle-btn')?.classList.add('active');
    }
  }

  private setLandingMarkersVisible(visible: boolean): void {
    this.landingMarkersVisible = visible;
  }

  private setupUI(camera: any, controls: any): void {
    // Create UI
    createUI({
      locations: locations as FlyLocation[],
      landingMarkersVisible: this.landingMarkersVisible,
      onNavigate: (position, location) => {
        this.currentLocation = location;
        navigateTo(position, camera, controls, location);
      },
      onToggleLandings: visible =>
        toggleLandingMarkers(this.landingMarkers, visible, v => this.setLandingMarkersVisible(v)),
      onToggleRuler: () => this.toggleRuler(),
      showRulerButton: true,
    });
  }

  private setupControls(controls: any): void {
    // Initialize controls settings
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.maxDistance = 50000;
      controls.minDistance = 100;
    }
  }

  private setInitialPosition(camera: any, controls: any): void {
    // Set initial position
    const flyLocations = locations as FlyLocation[];
    const initialPosition =
      flyLocations.length > 0 && flyLocations[0]?.position
        ? flyLocations[0].position.clone()
        : new THREE.Vector3(14000, 8000, 14000);

    navigateTo(
      initialPosition,
      camera,
      controls,
      flyLocations.length > 0 ? flyLocations[0] : undefined
    );
  }

  private setupEventHandlers(renderer: any, camera: any, scene: THREE.Scene, controls: any): void {
    // Setup window resize handler
    this.resizeHandler = () => {
      if (this.labelRenderer) {
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.resizeHandler);

    // Setup mouse click handler
    this.cleanupMouseHandler = setupMouseClickHandler(renderer, camera, scene);

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera, controls);
  }

  private startAnimationLoop(renderer: any, scene: THREE.Scene, camera: any, controls: any): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Continue animation loop
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };

    // Use the existing setupAnimationLoop function
    setupAnimationLoop(
      renderer,
      scene,
      camera,
      controls,
      this.labelRenderer,
      this.markers,
      this.landingMarkersVisible
    );

    // Start our monitoring loop
    animate();
  }

  public override dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Cleanup mouse handler
    if (this.cleanupMouseHandler) {
      this.cleanupMouseHandler();
      this.cleanupMouseHandler = undefined;
    }

    // Cleanup resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Cleanup ruler
    if (this.ruler) {
      this.ruler.deactivate();
      this.ruler = undefined;
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

    // Cleanup popup container
    if (this.popupContainer && this.popupContainer.parentNode) {
      this.popupContainer.parentNode.removeChild(this.popupContainer);
      this.popupContainer = undefined;
    }

    // Clear markers and landing markers arrays
    this.markers.forEach(marker => {
      if (marker.object) {
        marker.object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material: THREE.Material) => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    });
    this.markers.length = 0;

    this.landingMarkers.forEach(marker => {
      marker.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.landingMarkers.length = 0;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const flyZonesApp = new FlyZonesApp();

// Export in the expected format for the Stories system
const FlyZones = {
  load: async (options: StoryOptions) => {
    return flyZonesApp.load(options);
  },
  dispose: () => {
    return flyZonesApp.dispose();
  },
  getAppInfo: () => {
    return flyZonesApp.getAppInfo();
  },
};

export default FlyZones;
