import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { TerrainBase } from '../../shared/TerrainBase';
import { flyzoneAPI } from '../api/flyzone-api';
import {
  FlyzoneLocation,
  WeatherAnalysis,
  TakeoffRecommendation,
  CurrentWeather,
} from '../types/flyzone-types';
import { FlyzoneVisualizerUI } from './flyzone-visualizer-ui';
import { FlyzoneMarkers } from '../editor/flyzone-markers';
import { WindVisualization } from './wind-visualization';
import './flyzone-visualizer.css';

/**
 * Flyzone Visualizer - Weather-based takeoff recommendations and visualization
 *
 * Features:
 * - Real-time wind condition input
 * - Weather-based takeoff scoring and recommendations
 * - Visual wind direction indicators
 * - Pilot skill level filtering
 * - Interactive flyzone exploration
 * - Safety warnings and advice
 */

export interface VisualizerState {
  currentWeather: CurrentWeather | null;
  weatherAnalysis: WeatherAnalysis | null;
  selectedRecommendation: TakeoffRecommendation | null;
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  showWindVisualization: boolean;
  filterByScore: number; // Minimum score to show
  locations: FlyzoneLocation[];
}

class FlyzoneVisualizerApp extends TerrainBase {
  private visualizerState: VisualizerState | undefined;
  private visualizerUI: FlyzoneVisualizerUI | undefined;
  private markers: FlyzoneMarkers | undefined;
  private windVisualization: WindVisualization | undefined;
  private animationId: number | undefined;
  private raycaster: THREE.Raycaster | undefined;
  private mouse: THREE.Vector2 | undefined;

  constructor() {
    super({
      name: 'Flyzone Visualizer',
      description: 'Weather-based takeoff recommendations and flyzone visualization',
      requiredComponents: ['scene', 'camera', 'renderer', 'controls', 'gui', 'terrain', 'water', 'sky'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: {
          enabled: false, // Clear visibility for analysis
        },
      },
      terrain: {
        style: 'satellite', // Use satellite imagery for better geographic reference
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

      const { camera, scene, renderer, controls, gui } = options;

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

      // Initialize visualizer state
      await this.initializeVisualizerState();

      // Setup interaction
      this.setupInteraction(renderer, camera, scene);

      // Initialize UI components
      this.visualizerUI = new FlyzoneVisualizerUI(this.visualizerState!, this.onUIAction.bind(this));
      this.markers = new FlyzoneMarkers(scene);
      this.windVisualization = new WindVisualization(scene);

      // Setup GUI controls
      this.setupGUI(gui);

      // Load flyzone locations
      await this.loadFlyzoneLocations();

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

  private async initializeVisualizerState(): Promise<void> {
    this.visualizerState = {
      currentWeather: null,
      weatherAnalysis: null,
      selectedRecommendation: null,
      userLevel: 'intermediate',
      showWindVisualization: true,
      filterByScore: 40, // Show recommendations with score >= 40
      locations: [],
    };
  }

  private setupInteraction(renderer: THREE.WebGLRenderer, camera: THREE.Camera, scene: THREE.Scene): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      if (!this.mouse) return;

      const rect = renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onMouseClick = (event: MouseEvent) => {
      if (event.button === 0) { // Left click
        // Try to handle marker selection, but don't prevent camera controls
        const handled = this.handleClick(camera, scene);

        // Only prevent camera controls if we actually selected something
        if (handled) {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    // Use normal event listeners (not capture) to allow camera controls to work first
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
  }

  private handleClick(camera: THREE.Camera, scene: THREE.Scene): boolean {
    if (!this.raycaster || !this.mouse || !this.visualizerState || !this.markers) return false;

    this.raycaster.setFromCamera(this.mouse, camera);

    // Check for marker intersections
    const markerObjects: THREE.Object3D[] = [];
    this.markers['markers'].forEach(marker => {
      markerObjects.push(marker);
    });

    const intersects = this.raycaster.intersectObjects(markerObjects, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      let markerData = null;

      // Find the marker data from the parent group
      let parent = clickedObject.parent;
      while (parent && !parent.userData.type) {
        parent = parent.parent;
      }

      if (parent && parent.userData.type === 'takeoff') {
        markerData = parent.userData;
        this.selectTakeoffLocation(markerData.data);
        return true; // We handled a marker selection
      }
    }

    return false; // No marker was selected, allow camera controls
  }

  private selectTakeoffLocation(takeoff: any): void {
    if (!this.visualizerState?.weatherAnalysis) return;

    // Find the recommendation for this takeoff
    const recommendation = this.visualizerState.weatherAnalysis.recommendations.find(
      rec => rec.takeoff.id === takeoff.id
    );

    if (recommendation) {
      this.visualizerState.selectedRecommendation = recommendation;
      this.visualizerUI?.refresh();

      // Highlight selected marker
      if (this.markers) {
        // Deselect all markers first
        this.visualizerState.weatherAnalysis.recommendations.forEach(rec => {
          this.markers!.deselectMarker(rec.takeoff.id);
        });

        // Select clicked marker
        this.markers.selectMarker(takeoff.id);
      }

      console.log(`Selected takeoff: ${takeoff.title} (Score: ${recommendation.score})`);
    }
  }

  private async loadFlyzoneLocations(): Promise<void> {
    if (!this.visualizerState) return;

    try {
      const summaries = await flyzoneAPI.getLocationSummaries();

      for (const summary of summaries) {
        const location = await flyzoneAPI.getLocation(summary.id);
        if (location) {
          this.visualizerState.locations.push(location);

          // Add visual markers for takeoffs only (focus on takeoff selection)
          if (this.markers) {
            location.takeoffs.forEach(takeoff => {
              this.markers!.addTakeoffMarker(takeoff);
            });
          }
        }
      }

      console.log(`Loaded ${this.visualizerState.locations.length} flyzone locations`);
    } catch (error) {
      console.error('Failed to load flyzone locations:', error);
    }
  }

  private async analyzeWeatherConditions(windDirection: number, windSpeed: number): Promise<void> {
    if (!this.visualizerState) return;

    try {
      const weatherRequest = {
        windDirection,
        windSpeed,
        userLevel: this.visualizerState.userLevel,
      };

      const analysis = await flyzoneAPI.getWeatherRecommendations(weatherRequest);

      this.visualizerState.currentWeather = analysis.currentWeather;
      this.visualizerState.weatherAnalysis = analysis;
      this.visualizerState.selectedRecommendation = null;

      // Update wind visualization
      if (this.windVisualization && this.visualizerState.showWindVisualization) {
        this.windVisualization.updateWindDirection(windDirection, windSpeed);
      }

      // Update marker colors based on scores
      this.updateMarkersByScore(analysis.recommendations);

      // Update UI
      this.visualizerUI?.refresh();

      console.log(`Weather analysis complete: ${analysis.recommendations.length} recommendations`);
    } catch (error) {
      console.error('Failed to analyze weather conditions:', error);
    }
  }

  private updateMarkersByScore(recommendations: TakeoffRecommendation[]): void {
    if (!this.markers) return;

    recommendations.forEach(rec => {
      // Color code markers based on score
      const marker = this.markers!['markers'].get(rec.takeoff.id);
      if (marker) {
        let color = 0x888888; // Gray for poor conditions

        if (rec.score >= 80) {
          color = 0x00ff00; // Green for excellent
        } else if (rec.score >= 60) {
          color = 0xffff00; // Yellow for good
        } else if (rec.score >= 40) {
          color = 0xff8800; // Orange for marginal
        } else {
          color = 0xff0000; // Red for poor
        }

        // Update marker material color
        marker.traverse(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
            child.material.color.setHex(color);
          }
        });
      }
    });
  }

  private setupGUI(gui: any): void {
    if (!gui || !this.visualizerState) return;

    const visualizerFolder = gui.addFolder('Flyzone Visualizer');
    visualizerFolder.open();

    // Weather input
    const weatherFolder = visualizerFolder.addFolder('Current Weather');
    weatherFolder.open();

    const weatherControls = {
      windDirection: 45,
      windSpeed: 20,
      analyze: () => this.analyzeWeatherConditions(weatherControls.windDirection, weatherControls.windSpeed),
    };

    weatherFolder
      .add(weatherControls, 'windDirection', 0, 360, 1)
      .name('Wind Direction (°)');

    weatherFolder
      .add(weatherControls, 'windSpeed', 0, 50, 1)
      .name('Wind Speed (km/h)');

    weatherFolder
      .add(weatherControls, 'analyze')
      .name('Analyze Conditions');

    // User settings
    const settingsFolder = visualizerFolder.addFolder('Settings');
    settingsFolder.open();

    settingsFolder
      .add(this.visualizerState, 'userLevel', ['beginner', 'intermediate', 'advanced', 'expert'])
      .name('Pilot Level')
      .onChange(() => {
        if (this.visualizerState?.currentWeather) {
          this.analyzeWeatherConditions(
            this.visualizerState.currentWeather.windDirection,
            this.visualizerState.currentWeather.windSpeed
          );
        }
      });

    settingsFolder
      .add(this.visualizerState, 'filterByScore', 0, 100, 5)
      .name('Min Score Filter')
      .onChange(() => {
        this.visualizerUI?.refresh();
      });

    settingsFolder
      .add(this.visualizerState, 'showWindVisualization')
      .name('Show Wind')
      .onChange((value: boolean) => {
        if (this.windVisualization) {
          this.windVisualization.setVisible(value);
        }
      });
  }

  private setupEventHandlers(renderer: THREE.WebGLRenderer): void {
    // Keyboard shortcuts
    const onKeyDown = (event: KeyboardEvent) => {
      if (!this.visualizerState) return;

      switch (event.key) {
        case 'w':
          if (event.ctrlKey) {
            this.visualizerState.showWindVisualization = !this.visualizerState.showWindVisualization;
            if (this.windVisualization) {
              this.windVisualization.setVisible(this.visualizerState.showWindVisualization);
            }
          }
          break;
        case '1':
          this.visualizerState.userLevel = 'beginner';
          this.visualizerUI?.refresh();
          break;
        case '2':
          this.visualizerState.userLevel = 'intermediate';
          this.visualizerUI?.refresh();
          break;
        case '3':
          this.visualizerState.userLevel = 'advanced';
          this.visualizerUI?.refresh();
          break;
        case '4':
          this.visualizerState.userLevel = 'expert';
          this.visualizerUI?.refresh();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
  }

  private onUIAction(action: string, data?: any): void {
    switch (action) {
      case 'analyzeWeather':
        if (data.windDirection !== undefined && data.windSpeed !== undefined) {
          this.analyzeWeatherConditions(data.windDirection, data.windSpeed);
        }
        break;
      case 'selectRecommendation':
        if (data.recommendation) {
          this.selectTakeoffLocation(data.recommendation.takeoff);
        }
        break;
      case 'userLevelChange':
        if (this.visualizerState) {
          this.visualizerState.userLevel = data.level;
          if (this.visualizerState.currentWeather) {
            this.analyzeWeatherConditions(
              this.visualizerState.currentWeather.windDirection,
              this.visualizerState.currentWeather.windSpeed
            );
          }
        }
        break;
      case 'filterChange':
        if (this.visualizerState) {
          this.visualizerState.filterByScore = data.minScore;
          this.visualizerUI?.refresh();
        }
        break;
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

        // Update wind visualization
        if (this.windVisualization) {
          this.windVisualization.update();
        }

        // Update UI
        if (this.visualizerUI) {
          this.visualizerUI.update();
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

    if (this.visualizerUI) {
      this.visualizerUI.dispose();
      this.visualizerUI = undefined;
    }

    if (this.markers) {
      this.markers.dispose();
      this.markers = undefined;
    }

    if (this.windVisualization) {
      this.windVisualization.dispose();
      this.windVisualization = undefined;
    }

    this.visualizerState = undefined;
    this.raycaster = undefined;
    this.mouse = undefined;

    super.dispose();
  }
}

// Create singleton instance
const flyzoneVisualizerApp = new FlyzoneVisualizerApp();

// Export in the expected format for the Stories system
const FlyzoneVisualizer = {
  load: async (options: StoryOptions) => {
    return flyzoneVisualizerApp.load(options);
  },
  dispose: () => {
    return flyzoneVisualizerApp.dispose();
  },
  getAppInfo: () => {
    return flyzoneVisualizerApp.getAppInfo();
  },
};

export default FlyzoneVisualizer;