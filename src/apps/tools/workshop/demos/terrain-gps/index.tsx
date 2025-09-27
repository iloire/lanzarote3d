import * as THREE from 'three';
import { TerrainBase } from '../../../../shared/TerrainBase';
import { StoryOptions } from '../../../../shared/types';
import { getDefaultTheme } from '../../../../../foundation/themes';
import { ThemeEngine } from '../../../../../foundation/systems/ThemeEngine';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../../../../foundation/utils/OrbitControlsHelper';
import { getAppConfig } from '../../../../config/app-registry';

/**
 * Terrain GPS Coordinate Mapper - Interactive tool for mapping 3D terrain to GPS coordinates
 *
 * Features:
 * - Click on terrain to get 3D coordinates
 * - Real-time GPS coordinate translation
 * - Visual feedback for clicked points
 * - Coordinate adjustment controls
 * - Export coordinate mapping data
 *
 * Controls:
 * - Mouse: Orbit, zoom, pan
 * - Click: Get coordinates at point
 * - R: Reset view
 * - C: Clear all markers
 */
class TerrainGPSMapperApp extends TerrainBase {
  private animationId: number | undefined;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private markers: THREE.Group;
  private uiContainer: HTMLElement | undefined;
  private coordinateList: Array<{
    terrain: THREE.Vector3;
    gps: { lat: number; lon: number };
    marker: THREE.Object3D;
  }> = [];

  // GPS bounds for Lanzarote island (corrected with Google Maps verification)
  // Point 2 error: Our app 0.138° too far north, 0.240° too far west
  // Correction: Subtract 0.138° from latitude, add 0.240° to longitude
  private gpsBounds = {
    north: 30.088378 - 0.138281,  // 29.950097°N (Google Maps verified correction)
    south: 29.708378 - 0.138281,  // 29.570097°N (Google Maps verified correction)
    east: -13.238296 + 0.240353,  // -12.997943°W (Google Maps verified correction)
    west: -13.658296 + 0.240353   // -13.417943°W (Google Maps verified correction)
  };

  constructor() {
    const appConfig = getAppConfig('terrain-gps');
    super({
      name: appConfig?.name || 'Terrain GPS Mapper',
      description: appConfig?.description || 'Interactive terrain to GPS coordinate mapping tool',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: false,
        fog: { enabled: true },
      },
      performance: {
        monitoring: true,
        logIntervalMs: 10000,
      },
    });

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.markers = new THREE.Group();
  }

  private createCompassRose(scene: THREE.Scene): void {
    const compassGroup = new THREE.Group();

    // Position compass rose at a visible location
    compassGroup.position.set(0, 500, 0);

    // Create directional arrows - 5 times bigger
    const arrowLength = 1000;  // 5 times bigger: 200 * 5 = 1000
    const arrowColors = {
      north: 0xff0000,   // Red for North
      south: 0x0000ff,   // Blue for South
      east: 0x00ff00,    // Green for East
      west: 0xffff00     // Yellow for West
    };

    // Create simple circles for direction indicators - 5 times bigger
    const circleGeometry = new THREE.SphereGeometry(150, 16, 8);  // 5 times bigger: 30 * 5 = 150

    // North circle (positive Z direction)
    const northCircle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: arrowColors.north }));
    northCircle.position.set(0, 0, arrowLength);
    compassGroup.add(northCircle);

    // South circle (negative Z direction)
    const southCircle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: arrowColors.south }));
    southCircle.position.set(0, 0, -arrowLength);
    compassGroup.add(southCircle);

    // East circle (positive X direction)
    const eastCircle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: arrowColors.east }));
    eastCircle.position.set(arrowLength, 0, 0);
    compassGroup.add(eastCircle);

    // West circle (negative X direction)
    const westCircle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: arrowColors.west }));
    westCircle.position.set(-arrowLength, 0, 0);
    compassGroup.add(westCircle);

    // Add connecting lines
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-arrowLength * 1.2, 0, 0),
      new THREE.Vector3(arrowLength * 1.2, 0, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    const horizontalLine = new THREE.Line(lineGeometry, lineMaterial);
    compassGroup.add(horizontalLine);

    const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -arrowLength * 1.2),
      new THREE.Vector3(0, 0, arrowLength * 1.2)
    ]);
    const verticalLine = new THREE.Line(verticalLineGeometry, lineMaterial);
    compassGroup.add(verticalLine);

    scene.add(compassGroup);

    console.log('🧭 Compass rose added:');
    console.log('  🔴 Red circle = North (+Z direction)');
    console.log('  🔵 Blue circle = South (-Z direction)');
    console.log('  🟢 Green circle = East (+X direction)');
    console.log('  🟡 Yellow circle = West (-X direction)');
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      this.initializeCore(options);
      await this.initializeEnvironment(options);

      const { camera, scene, renderer, terrain, controls } = options;

      controls.enabled = true;

      // Set up camera for perfect top-down north-facing view
      // Position camera VERY high above terrain center, looking straight down
      const initialPos = new THREE.Vector3(0, 50000, 0);  // VERY high altitude for full island overview
      const lookAtPos = new THREE.Vector3(0, 0, 0);       // Look at terrain center

      camera.position.copy(initialPos);
      camera.lookAt(lookAtPos);

      // Configure controls with NO BOUNDARIES for free navigation
      OrbitControlsHelper.focusOnTarget(controls, lookAtPos, {
        ...ORBIT_CONTROLS_PRESETS['aerial'],
        maxDistance: Infinity,   // No maximum zoom out limit
        minDistance: 100,        // Keep minimum to prevent going underground
        maxPolarAngle: Math.PI,  // Allow full rotation
        minPolarAngle: 0,        // Allow full rotation
      });

      console.log('📍 Camera positioned for north-facing top-down view:');
      console.log(`  Position: (${initialPos.x}, ${initialPos.y}, ${initialPos.z})`);
      console.log(`  Looking at: (${lookAtPos.x}, ${lookAtPos.y}, ${lookAtPos.z})`);
      console.log('🧭 North = +Z (red circle), South = -Z (blue circle)');

      // Apply default theme
      const theme = getDefaultTheme();
      await ThemeEngine.apply(options, theme);

      // Add markers group to scene
      scene.add(this.markers);

      // Add compass rose for orientation debugging
      this.createCompassRose(scene);

      // Set up mouse interaction
      this.setupMouseInteraction(renderer, camera, scene, terrain);

      // Create UI
      this.createUI();

      // Set up keyboard controls
      this.setupKeyboardControls();

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls);

      renderer.render(scene, camera);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);
      console.log('🎮 Click on terrain to get GPS coordinates, R to reset view, C to clear markers');
    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private setupMouseInteraction(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
    terrain: any
  ): void {
    const canvas = renderer.domElement;

    // ANALYZE TERRAIN GEOMETRY FOR CORRECT BOUNDS AND ORIENTATION
    console.log('🗺️ TERRAIN ANALYSIS:');
    console.log('Terrain object:', terrain);

    if (terrain && terrain.geometry) {
      terrain.geometry.computeBoundingBox();
      const bbox = terrain.geometry.boundingBox;
      console.log('📐 Actual terrain bounds:', {
        x: [bbox.min.x, bbox.max.x],
        y: [bbox.min.y, bbox.max.y],
        z: [bbox.min.z, bbox.max.z],
        size: {
          width: bbox.max.x - bbox.min.x,
          depth: bbox.max.z - bbox.min.z,
          height: bbox.max.y - bbox.min.y
        }
      });
    }

    const onMouseClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      this.raycaster.setFromCamera(this.mouse, camera);

      // Find intersections with terrain
      const intersects = this.raycaster.intersectObject(terrain, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.addCoordinateMarker(point);
      }
    };

    canvas.addEventListener('click', onMouseClick);
  }

  private addCoordinateMarker(terrainPoint: THREE.Vector3): void {
    // Create visual marker
    const markerGeometry = new THREE.SphereGeometry(50, 16, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(terrainPoint);

    // Add text label
    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
      position: absolute;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 5px;
      border-radius: 3px;
      font-size: 11px;
      pointer-events: none;
      z-index: 1000;
    `;

    // Calculate GPS coordinates from terrain position
    const gpsCoords = this.terrainToGPS(terrainPoint);

    // Store coordinate data
    const coordData = {
      terrain: terrainPoint.clone(),
      gps: gpsCoords,
      marker: marker,
    };
    this.coordinateList.push(coordData);

    this.markers.add(marker);

    // Update UI
    this.updateUI();

    // Log to console for debugging
    console.log(`🎯 Terrain Point:`, {
      x: terrainPoint.x.toFixed(2),
      y: terrainPoint.y.toFixed(2),
      z: terrainPoint.z.toFixed(2)
    });
    console.log(`🌍 GPS Coordinates:`, {
      lat: gpsCoords.lat.toFixed(6),
      lon: gpsCoords.lon.toFixed(6)
    });
  }

  private terrainToGPS(terrainPoint: THREE.Vector3): { lat: number; lon: number } {
    // SIMPLIFIED DISTANCE-WEIGHTED INTERPOLATION
    // Use the three Google Maps verified points with distance-based weighting

    const ref1 = { terrainX: -699.8, terrainZ: -3874.2, lat: 29.118769, lon: -13.657281 }; // Point 1 (Google verified)
    const ref2 = { terrainX: -11024.7, terrainZ: 19349.4, lat: 28.841001, lon: -13.786740 }; // Point 2 (Google verified)
    const ref3 = { terrainX: 14130.0, terrainZ: -13759.5, lat: 29.238464, lon: -13.470252 }; // Point 3 (Google verified)

    // Calculate distances from input point to each reference point
    const dist1 = Math.sqrt(Math.pow(terrainPoint.x - ref1.terrainX, 2) + Math.pow(terrainPoint.z - ref1.terrainZ, 2));
    const dist2 = Math.sqrt(Math.pow(terrainPoint.x - ref2.terrainX, 2) + Math.pow(terrainPoint.z - ref2.terrainZ, 2));
    const dist3 = Math.sqrt(Math.pow(terrainPoint.x - ref3.terrainX, 2) + Math.pow(terrainPoint.z - ref3.terrainZ, 2));

    // Handle exact matches
    if (dist1 < 50) return { lat: ref1.lat, lon: ref1.lon };
    if (dist2 < 50) return { lat: ref2.lat, lon: ref2.lon };
    if (dist3 < 50) return { lat: ref3.lat, lon: ref3.lon };

    // Calculate inverse distance weights
    const weight1 = 1 / (dist1 * dist1); // Squared inverse distance
    const weight2 = 1 / (dist2 * dist2);
    const weight3 = 1 / (dist3 * dist3);
    const totalWeight = weight1 + weight2 + weight3;

    // Weighted average interpolation
    const latitude = (ref1.lat * weight1 + ref2.lat * weight2 + ref3.lat * weight3) / totalWeight;
    const longitude = (ref1.lon * weight1 + ref2.lon * weight2 + ref3.lon * weight3) / totalWeight;

    // Debug logging for distance-weighted interpolation
    console.log(`🔍 Distance-Weighted Interpolation:`, {
      terrain: { x: terrainPoint.x.toFixed(1), z: terrainPoint.z.toFixed(1) },
      distances: {
        ref1: dist1.toFixed(1),
        ref2: dist2.toFixed(1),
        ref3: dist3.toFixed(1)
      },
      weights: {
        ref1: weight1.toFixed(6),
        ref2: weight2.toFixed(6),
        ref3: weight3.toFixed(6),
        total: totalWeight.toFixed(6)
      },
      calculated: { lat: latitude.toFixed(6), lon: longitude.toFixed(6) },
      references: [ref1, ref2, ref3]
    });

    return { lat: latitude, lon: longitude };
  }

  private setupKeyboardControls(): void {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'c':
          this.clearAllMarkers();
          break;
        case 'r':
          // Reset to perfect top-down north-facing view
          this.resetCameraView();
          break;
        case 'e':
          this.exportCoordinateData();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
  }

  private clearAllMarkers(): void {
    this.markers.clear();
    this.coordinateList = [];
    this.updateUI();
    console.log('🧹 Cleared all coordinate markers');
  }

  private resetCameraView(): void {
    if (!this.sceneManager?.camera || !this.sceneManager?.controls) {
      console.warn('⚠️ Camera or controls not available for reset');
      return;
    }

    const camera = this.sceneManager.camera;
    const controls = this.sceneManager.controls;

    // Reset to perfect top-down north-facing view
    const resetPos = new THREE.Vector3(0, 50000, 0);
    const lookAtPos = new THREE.Vector3(0, 0, 0);

    camera.position.copy(resetPos);
    camera.lookAt(lookAtPos);

    // Reset controls target
    OrbitControlsHelper.focusOnTarget(controls, lookAtPos, {
      maxDistance: Infinity,
      minDistance: 100,
      maxPolarAngle: Math.PI,
      minPolarAngle: 0,
    });

    console.log('📍 Camera view reset to perfect top-down north-facing position');
    console.log(`  Position: (${resetPos.x}, ${resetPos.y}, ${resetPos.z})`);
  }

  private exportCoordinateData(): void {
    const data = {
      exportTimestamp: new Date().toISOString(),
      terrainBounds: {
        minX: -4000, maxX: 4000,
        minZ: -4000, maxZ: 4000,
        notes: "Current estimated bounds - need actual geometry bounds"
      },
      gpsBounds: this.gpsBounds,
      coordinates: this.coordinateList.map((coord, index) => ({
        id: `point${index + 1}`,
        terrain: {
          x: coord.terrain.x,
          y: coord.terrain.y,
          z: coord.terrain.z
        },
        gps: {
          latitude: coord.gps.lat,
          longitude: coord.gps.lon
        },
        timestamp: new Date().toISOString(),
        status: "needs_verification"
      })),
      mappingParameters: {
        coordinateTransform: {
          longitude: "west + xNorm * (east - west)",
          latitude: "south + (1.0 - zNorm) * (north - south)",
          notes: "Z-axis flipped due to terrain orientation"
        },
        orientationNotes: "Blue(South) at top, Yellow(West) at left - terrain rotated 180°"
      }
    };

    console.log('📊 Coordinate Mapping Data for lanzarote-terrain-gps-mapping.json:', data);

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      alert('Coordinate mapping data copied to clipboard!\nPaste this into the calibrationPoints section of lanzarote-terrain-gps-mapping.json');
    });
  }

  private createUI(): void {
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-width: 400px;
      line-height: 1.4;
    `;

    this.updateUI();
    document.body.appendChild(this.uiContainer);
  }

  private updateUI(): void {
    if (!this.uiContainer) return;

    this.uiContainer.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #4fc3f7;">🗺️ Terrain GPS Mapper</h3>

      <div style="margin-bottom: 10px;">
        <strong>Instructions:</strong><br>
        • Click on terrain to place GPS markers<br>
        • Use mouse to navigate around<br>
        • Press C to clear all markers<br>
        • Press E to export coordinate data
      </div>

      <div style="margin-bottom: 10px; border-top: 1px solid #555; padding-top: 10px;">
        <strong>Current GPS Bounds:</strong><br>
        North: ${this.gpsBounds.north}°<br>
        South: ${this.gpsBounds.south}°<br>
        West: ${this.gpsBounds.west}°<br>
        East: ${this.gpsBounds.east}°
      </div>

      <div style="margin-bottom: 10px; border-top: 1px solid #555; padding-top: 10px;">
        <strong>Marked Points (${this.coordinateList.length}):</strong><br>
        ${this.coordinateList.map((coord, i) => `
          <div style="font-size: 10px; margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
            <strong>Point ${i + 1}:</strong><br>
            Terrain: (${coord.terrain.x.toFixed(1)}, ${coord.terrain.y.toFixed(1)}, ${coord.terrain.z.toFixed(1)})<br>
            GPS: ${coord.gps.lat.toFixed(6)}°N, ${coord.gps.lon.toFixed(6)}°W
          </div>
        `).join('')}
      </div>

      <div style="border-top: 1px solid #555; padding-top: 10px; font-size: 11px; color: #ccc;">
        This tool helps map 3D terrain coordinates to real GPS coordinates.<br>
        Click on known landmarks to build accurate coordinate mapping.
      </div>
    `;
  }

  private startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any
  ): void {
    const animate = () => {
      try {
        this.updatePerformance();
        OrbitControlsHelper.update(controls);
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

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
      this.uiContainer = undefined;
    }

    this.coordinateList = [];
    this.markers.clear();

    super.dispose();
  }
}

// Create singleton instance
const terrainGPSMapperApp = new TerrainGPSMapperApp();

// Export in the expected format for the Workshop system
const TerrainGPSMapper = {
  load: async (options: StoryOptions) => {
    return terrainGPSMapperApp.load(options);
  },
  dispose: () => {
    return terrainGPSMapperApp.dispose();
  },
  getAppInfo: () => {
    return terrainGPSMapperApp.getAppInfo();
  },
};

export default TerrainGPSMapper;