import * as THREE from 'three';
import { Car, CarOptions } from './Car';
import {
  TerrainFollowingBehavior,
  TerrainFollowingOptions,
  TerrainDrivingMode,
} from '../../systems/behaviors/TerrainFollowingBehavior';

export interface AutonomousCarOptions extends Omit<CarOptions, 'pattern' | 'speed' | 'radius'> {
  // Autonomous driving options
  drivingMode?: TerrainDrivingMode;
  maxSpeed?: number;
  cruiseSpeed?: number;
  terrain?: THREE.Mesh;
  destination?: THREE.Vector3;
  explorationRadius?: number;

  // Terrain navigation options
  sampleRadius?: number;
  maxSlope?: number;
  heightOffset?: number;

  // Behavior options
  pathUpdateInterval?: number;
  stuckThreshold?: number;
  reverseProbability?: number;

  // Visual indicators
  showDebugInfo?: boolean;
  showPath?: boolean;
}

/**
 * AutonomousCar - Self-driving car that navigates 3D terrain
 * Extends the Car component with autonomous navigation capabilities
 */
export class AutonomousCar extends Car {
  private terrainBehavior: TerrainFollowingBehavior | null = null;
  private autonomousOptions: AutonomousCarOptions;
  private debugGroup: THREE.Group | null = null;

  constructor(options: AutonomousCarOptions = {}) {
    // Set up base car options
    const carOptions: CarOptions = {
      bodyColor: options.bodyColor || '#2E8B57', // Sea green for autonomous cars
      roofColor: options.roofColor || '#1F5F3F',
      windowColor: options.windowColor || '#87CEEB',
      wheelColor: options.wheelColor || '#222222',
      scale: options.scale || 1,
      // Disable the base movement system - we'll use terrain following
      enableMovement: false,
      autoStartMoving: false,
      faceDirection: true,
      forwardAxis: 'x',
    };

    super(carOptions);
    this.autonomousOptions = options;

    // Initialize terrain following behavior
    this.initializeAutonomousNavigation();
  }

  /**
   * Initialize the autonomous navigation system
   */
  private initializeAutonomousNavigation(): void {
    const terrainOptions: TerrainFollowingOptions = {
      mode: this.autonomousOptions.drivingMode || TerrainDrivingMode.EXPLORATION,
      terrain: this.autonomousOptions.terrain,
      destination: this.autonomousOptions.destination,
      explorationRadius: this.autonomousOptions.explorationRadius || 500,
      speed: this.autonomousOptions.cruiseSpeed || 0.3,
      faceDirection: true,
      forwardAxis: 'x',
      autoStart: false, // We'll start manually after setup

      // Terrain navigator options
      terrainNavigator: {
        sampleRadius: this.autonomousOptions.sampleRadius || 50,
        maxSlope: this.autonomousOptions.maxSlope || Math.PI / 6, // 30 degrees
        heightOffset: this.autonomousOptions.heightOffset || 5,
        smoothingFactor: 0.1,
      },

      // Behavior options
      pathUpdateInterval: this.autonomousOptions.pathUpdateInterval || 1000,
      stuckThreshold: this.autonomousOptions.stuckThreshold || 5,
      reverseProbability: this.autonomousOptions.reverseProbability || 0.3,
    };

    this.terrainBehavior = new TerrainFollowingBehavior(terrainOptions);
  }

  /**
   * Override the async load method to set up terrain navigation
   */
  override async load(): Promise<THREE.Object3D> {
    const carMesh = await super.load();

    // Set up terrain navigation
    if (this.terrainBehavior) {
      this.terrainBehavior.attachTo(carMesh);

      // Add debug visualization if requested
      if (this.autonomousOptions.showDebugInfo) {
        this.createDebugVisualization(carMesh);
      }
    }

    return carMesh;
  }

  /**
   * Override the legacy synchronous load method
   */
  override loadSync(): THREE.Object3D {
    const carMesh = super.loadSync();

    // Set up terrain navigation
    if (this.terrainBehavior) {
      this.terrainBehavior.attachTo(carMesh);

      // Add debug visualization if requested
      if (this.autonomousOptions.showDebugInfo) {
        this.createDebugVisualization(carMesh);
      }
    }

    return carMesh;
  }

  /**
   * Start autonomous driving
   */
  startAutonomousDriving(): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.start();
    }
  }

  /**
   * Stop autonomous driving
   */
  stopAutonomousDriving(): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.stop();
    }
  }

  /**
   * Set the terrain for navigation
   */
  override setTerrain(terrain: THREE.Mesh): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.setTerrain(terrain);
    }
  }

  /**
   * Set driving mode
   */
  setDrivingMode(mode: TerrainDrivingMode): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.setMode(mode);
    }
  }

  /**
   * Set destination for navigation
   */
  setDestination(destination: THREE.Vector3): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.setDestination(destination);
    }
  }

  /**
   * Create debug visualization for navigation
   */
  private createDebugVisualization(carMesh: THREE.Object3D): void {
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'AutonomousCarDebug';

    // Create target indicator (small sphere)
    const targetGeometry = new THREE.SphereGeometry(2, 8, 8);
    const targetMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    });
    const targetIndicator = new THREE.Mesh(targetGeometry, targetMaterial);
    targetIndicator.name = 'targetIndicator';
    this.debugGroup.add(targetIndicator);

    // Create path line
    const pathGeometry = new THREE.BufferGeometry();
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.5,
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    pathLine.name = 'pathLine';
    this.debugGroup.add(pathLine);

    // Add debug group to car
    carMesh.add(this.debugGroup);

    // Update debug visualization periodically
    this.startDebugUpdate();
  }

  /**
   * Start updating debug visualization
   */
  private startDebugUpdate(): void {
    const updateDebug = () => {
      if (this.debugGroup && this.terrainBehavior) {
        const status = this.terrainBehavior.getNavigationStatus();

        // Update target indicator
        const targetIndicator = this.debugGroup.getObjectByName('targetIndicator') as THREE.Mesh;
        if (targetIndicator) {
          targetIndicator.position.copy(status.currentTarget);
          targetIndicator.material = new THREE.MeshBasicMaterial({
            color: status.isStuck ? 0xff0000 : status.isReversing ? 0xffff00 : 0x00ff00,
            transparent: true,
            opacity: 0.7,
          });
        }

        // Update path line (simplified - just line to target)
        const pathLine = this.debugGroup.getObjectByName('pathLine') as THREE.Line;
        if (pathLine && this.debugGroup.parent) {
          const carPos = this.debugGroup.parent.position;
          const positions = [
            carPos.x,
            carPos.y + 5,
            carPos.z,
            status.currentTarget.x,
            status.currentTarget.y + 5,
            status.currentTarget.z,
          ];
          pathLine.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
          );
        }
      }

      // Schedule next update
      requestAnimationFrame(updateDebug);
    };

    updateDebug();
  }

  /**
   * Get navigation status for external monitoring
   */
  getNavigationStatus() {
    return this.terrainBehavior?.getNavigationStatus() || null;
  }

  /**
   * Override getInfo to include autonomous driving information
   */
  public override getInfo(): Record<string, any> {
    const baseInfo = super.getInfo();
    const navigationStatus = this.getNavigationStatus();

    return {
      ...baseInfo,
      type: 'autonomous-car',
      autonomous: {
        drivingMode: this.autonomousOptions.drivingMode,
        isActive: this.terrainBehavior?.isActive() || false,
        navigationStatus,
      },
    };
  }

  /**
   * Override dispose to clean up terrain behavior
   */
  public override dispose(): void {
    if (this.terrainBehavior) {
      this.terrainBehavior.dispose();
      this.terrainBehavior = null;
    }

    if (this.debugGroup) {
      this.debugGroup.parent?.remove(this.debugGroup);
      this.debugGroup = null;
    }

    super.dispose();
  }
}

export default AutonomousCar;
