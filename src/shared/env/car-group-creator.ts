import * as THREE from 'three';
import { Car } from '../../foundation/components/vehicles/Car';
import { AutonomousCar } from '../../foundation/components/vehicles/AutonomousCar';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { CarConfig, CarGroupConfig } from './car-group-types';
import { TerrainDrivingMode } from '../../foundation/systems/behaviors/TerrainFollowingBehavior';
import { MovementPattern } from '../../foundation/systems/behaviors/MovingBehavior';
import {
  calculateCarPositions,
  generateParkingLotCars,
  generateConvoy,
  generatePatrolFleet,
  generateTrafficCars,
  generateMixedCars,
} from './car-group-utils';

/**
 * Car Group Creator - handles the creation and management of car groups with terrain adaptation
 *
 * This system creates cars that automatically adapt to terrain height and can move around
 * specific areas following realistic driving patterns.
 */
export class CarGroupCreator {
  private scene: THREE.Scene;
  private componentRegistry: ComponentRegistry;

  constructor(scene: THREE.Scene, componentRegistry: ComponentRegistry) {
    this.scene = scene;
    this.componentRegistry = componentRegistry;
  }

  /**
   * Create a single car with the given configuration
   */
  private async createSingleCar(
    carConfig: CarConfig,
    position: THREE.Vector3,
    terrain?: THREE.Mesh
  ): Promise<THREE.Object3D | null> {
    let car: Car | AutonomousCar;
    let carMesh: THREE.Object3D;
    let scale = carConfig.scale || 1.0;

    // Create car based on type
    switch (carConfig.type) {
      case 'Car':
        car = new Car({
          pattern: carConfig.pattern,
          speed: carConfig.speed,
          radius: carConfig.radius,
          autoStartMoving: carConfig.enableMovement,
          bodyColor: carConfig.bodyColor,
          roofColor: carConfig.roofColor,
          windowColor: carConfig.windowColor,
          wheelColor: carConfig.wheelColor,
          scale: carConfig.scale,
          faceDirection: carConfig.faceDirection,
          forwardAxis: carConfig.forwardAxis,
        });
        carMesh = await this.componentRegistry.register(car, 'car');
        break;

      case 'AutonomousCar':
        car = new AutonomousCar({
          terrain,
          drivingMode: carConfig.drivingMode,
          explorationRadius: carConfig.explorationRadius,
          maxSlope: carConfig.maxSlope,
          heightOffset: carConfig.heightOffset,
          showDebugInfo: carConfig.showDebugInfo || false,
          cruiseSpeed: carConfig.speed,
          bodyColor: carConfig.bodyColor,
          roofColor: carConfig.roofColor,
          windowColor: carConfig.windowColor,
          wheelColor: carConfig.wheelColor,
          scale: carConfig.scale,
        });
        carMesh = await this.componentRegistry.register(car, 'autonomouscar');
        break;

      default:
        console.warn(`Unknown car type: ${carConfig.type}`);
        return null;
    }

    // Apply scaling
    carMesh.scale.set(scale, scale, scale);

    // Position the car at terrain level
    carMesh.position.copy(position);

    // Add some random rotation for variety (cars can face different directions)
    carMesh.rotation.y = Math.random() * Math.PI * 2;

    // Add to scene
    this.scene.add(carMesh);

    // Start autonomous driving if it's an autonomous car
    if (carConfig.type === 'AutonomousCar' && carConfig.enableMovement) {
      (car as AutonomousCar).startAutonomousDriving();
    }

    return carMesh;
  }

  /**
   * Create a group of cars with precise control over types, positions, and movement
   */
  async createCarGroup(
    terrain: THREE.Mesh,
    cars: CarConfig[],
    groupConfig: CarGroupConfig
  ): Promise<THREE.Object3D[]> {
    const carMeshes: THREE.Object3D[] = [];

    // Update group config with terrain
    const configWithTerrain = { ...groupConfig, terrain };

    // Calculate positions based on formation type
    const positions = calculateCarPositions(cars.length, configWithTerrain);

    // Create each car with its specific configuration
    for (let i = 0; i < cars.length; i++) {
      const carConfig = cars[i];
      const position = positions[i];

      const carMesh = await this.createSingleCar(carConfig, position, terrain);
      if (carMesh) {
        carMeshes.push(carMesh);
      }
    }

    return carMeshes;
  }

  /**
   * Create a parking lot with mixed car types
   */
  async createParkingLot(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const cars = generateParkingLotCars(size);
    const config = {
      small: { spacing: 25, radius: 60 },
      medium: { spacing: 25, radius: 80 },
      large: { spacing: 25, radius: 120 },
    }[size];

    return this.createCarGroup(terrain, cars, {
      center,
      formation: 'parking',
      spacing: config.spacing,
      groupRadius: config.radius,
      terrain,
    });
  }

  /**
   * Create a convoy with coordinated movement
   */
  async createConvoy(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const cars = generateConvoy(size);
    const spacing = size === 'small' ? 40 : size === 'medium' ? 35 : 30;

    return this.createCarGroup(terrain, cars, {
      center,
      formation: 'convoy',
      spacing,
      lineDirection: new THREE.Vector3(1, 0, 0),
      terrain,
    });
  }

  /**
   * Create a patrol fleet with autonomous vehicles
   */
  async createPatrolFleet(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'single' | 'team' | 'fleet' = 'team'
  ): Promise<THREE.Object3D[]> {
    const cars = generatePatrolFleet(size);
    const spacing = size === 'single' ? 0 : size === 'team' ? 50 : 60;

    return this.createCarGroup(terrain, cars, {
      center,
      formation: size === 'single' ? 'random' : 'line',
      spacing,
      groupRadius: 100,
      terrain,
    });
  }

  /**
   * Create traffic simulation with mixed car types
   */
  async createTrafficFlow(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    size: 'light' | 'moderate' | 'heavy' = 'moderate'
  ): Promise<THREE.Object3D[]> {
    const cars = generateTrafficCars(size);
    const spacing = size === 'light' ? 60 : size === 'moderate' ? 45 : 30;

    return this.createCarGroup(terrain, cars, {
      center,
      formation: 'random',
      spacing,
      groupRadius: 150,
      terrain,
    });
  }

  /**
   * Create a mixed recreational car scene
   */
  async createMixedCars(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    count: number = 6,
    formation: 'circle' | 'random' | 'grid' = 'random'
  ): Promise<THREE.Object3D[]> {
    const cars = generateMixedCars(count);

    return this.createCarGroup(terrain, cars, {
      center,
      formation,
      spacing: 40,
      groupRadius: 120,
      terrain,
    });
  }

  /**
   * Create cars in a circular formation
   */
  async createCircularFormation(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    cars: CarConfig[],
    radius: number = 80
  ): Promise<THREE.Object3D[]> {
    return this.createCarGroup(terrain, cars, {
      center,
      formation: 'circle',
      spacing: 30,
      groupRadius: radius,
      terrain,
    });
  }

  /**
   * Create cars in a grid formation (like a large parking area)
   */
  async createGridFormation(
    terrain: THREE.Mesh,
    center: THREE.Vector3,
    cars: CarConfig[],
    spacing: number = 25,
    rowCount: number = 3
  ): Promise<THREE.Object3D[]> {
    return this.createCarGroup(terrain, cars, {
      center,
      formation: 'grid',
      spacing,
      rowCount,
      colCount: Math.ceil(cars.length / rowCount),
      terrain,
    });
  }

  /**
   * Create a highway/road convoy
   */
  async createHighwayTraffic(
    terrain: THREE.Mesh,
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    carCount: number = 5
  ): Promise<THREE.Object3D[]> {
    // Calculate direction from start to end
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
    const distance = startPoint.distanceTo(endPoint);
    const spacing = distance / (carCount + 1);

    const cars: CarConfig[] = [];
    for (let i = 0; i < carCount; i++) {
      const isAutonomous = Math.random() < 0.4; // 40% autonomous on highways
      cars.push({
        type: isAutonomous ? 'AutonomousCar' : 'Car',
        enableMovement: true,
        pattern: MovementPattern.LINEAR,
        speed: 0.15 + Math.random() * 0.1,
        radius: 300,
        scale: 0.9 + Math.random() * 0.2,
        bodyColor: ['#FFFFFF', '#000000', '#C0C0C0', '#800000', '#000080'][
          Math.floor(Math.random() * 5)
        ],
        drivingMode: isAutonomous ? TerrainDrivingMode.EXPLORATION : undefined,
        explorationRadius: isAutonomous ? 200 : undefined,
      });
    }

    return this.createCarGroup(terrain, cars, {
      center: startPoint,
      formation: 'line',
      spacing,
      lineDirection: direction,
      terrain,
    });
  }
}
