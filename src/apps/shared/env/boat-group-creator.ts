import * as THREE from 'three';
import { SmallSailBoat, FishingBoat, Yacht, SpeedBoat, PatrolBoat } from '../../../foundation/components/scenery';
import { MovementPattern } from '../../../foundation/systems/behaviors/MovingBehavior';
import { ComponentRegistry } from '../../../foundation/systems/ComponentRegistry';
import { BoatConfig, BoatGroupConfig } from './boat-group-types';
import {
  calculateBoatPositions,
  generateMarinaBoats,
  generatePatrolFleet,
  generateRacingFleet,
  generateMixedRecreationalBoats
} from './boat-group-utils';

/**
 * Boat Group Creator - handles the creation and management of boat groups
 */
export class BoatGroupCreator {
  private scene: THREE.Scene;
  private componentRegistry: ComponentRegistry;

  constructor(scene: THREE.Scene, componentRegistry: ComponentRegistry) {
    this.scene = scene;
    this.componentRegistry = componentRegistry;
  }

  /**
   * Create a single boat with the given configuration
   */
  private async createSingleBoat(
    boatConfig: BoatConfig,
    position: THREE.Vector3,
    water: THREE.Mesh
  ): Promise<THREE.Object3D | null> {
    let boat: any;
    let boatMesh: THREE.Object3D;
    let scale = boatConfig.scale || 2.5;

    // Create boat based on type
    switch (boatConfig.type) {
      case 'SmallSailBoat':
        boat = new SmallSailBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement
        });
        boatMesh = await this.componentRegistry.register(boat, 'smallsailboat');
        break;

      case 'FishingBoat':
        boat = new FishingBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement
        });
        boatMesh = await this.componentRegistry.register(boat, 'fishingboat');
        break;

      case 'Yacht':
        boat = new Yacht({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement
        });
        boatMesh = await this.componentRegistry.register(boat, 'yacht');
        break;

      case 'SpeedBoat':
        boat = new SpeedBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement,
          ...(boatConfig.colors || {})
        });
        boatMesh = await this.componentRegistry.register(boat, 'speedboat');
        break;

      case 'PatrolBoat':
        boat = new PatrolBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement,
          ...(boatConfig.colors || {})
        });
        boatMesh = await this.componentRegistry.register(boat, 'patrolboat');
        break;

      default:
        console.warn(`Unknown boat type: ${boatConfig.type}`);
        return null;
    }

    // Apply scaling
    boatMesh.scale.set(scale, scale, scale);

    // Position the boat
    boatMesh.position.copy(position);

    // Add some random rotation for variety
    boatMesh.rotation.y = Math.random() * Math.PI * 2;

    // Add to scene
    this.scene.add(boatMesh);

    return boatMesh;
  }

  /**
   * Create a group of boats with precise control over types, positions, and movement
   */
  async createBoatGroup(
    water: THREE.Mesh,
    boats: BoatConfig[],
    groupConfig: BoatGroupConfig
  ): Promise<THREE.Object3D[]> {
    const boatMeshes: THREE.Object3D[] = [];

    // Calculate positions based on formation type
    const positions = calculateBoatPositions(boats.length, groupConfig);

    // Create each boat with its specific configuration
    for (let i = 0; i < boats.length; i++) {
      const boatConfig = boats[i];
      const position = positions[i];

      const boatMesh = await this.createSingleBoat(boatConfig, position, water);
      if (boatMesh) {
        boatMeshes.push(boatMesh);
      }
    }

    return boatMeshes;
  }

  /**
   * Create a marina/harbor formation with mixed boat types
   */
  async createMarina(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const boats = generateMarinaBoats(size);
    const config = {
      small: { spacing: 40, radius: 80 },
      medium: { spacing: 50, radius: 120 },
      large: { spacing: 60, radius: 180 }
    }[size];

    return this.createBoatGroup(water, boats, {
      center,
      formation: 'harbor',
      spacing: config.spacing,
      groupRadius: config.radius
    });
  }

  /**
   * Create a patrol fleet with coordinated movement
   */
  async createPatrolFleet(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'single' | 'formation' | 'fleet' = 'formation'
  ): Promise<THREE.Object3D[]> {
    const boats = generatePatrolFleet(size);
    const spacing = size === 'single' ? 0 : (size === 'formation' ? 80 : 100);

    return this.createBoatGroup(water, boats, {
      center,
      formation: 'line',
      spacing,
      lineDirection: new THREE.Vector3(1, 0, 0)
    });
  }

  /**
   * Create a racing fleet with fast-moving boats
   */
  async createRacingFleet(
    water: THREE.Mesh,
    center: THREE.Vector3,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<THREE.Object3D[]> {
    const boats = generateRacingFleet(size);
    const spacing = size === 'small' ? 30 : (size === 'medium' ? 35 : 40);

    return this.createBoatGroup(water, boats, {
      center,
      formation: 'line',
      spacing,
      lineDirection: new THREE.Vector3(1, 0, 0)
    });
  }

  /**
   * Create a mixed recreational boating scene
   */
  async createRecreationalBoats(
    water: THREE.Mesh,
    center: THREE.Vector3,
    count: number = 8,
    formation: 'circle' | 'random' = 'random'
  ): Promise<THREE.Object3D[]> {
    const boats = generateMixedRecreationalBoats(count);

    return this.createBoatGroup(water, boats, {
      center,
      formation,
      spacing: 90,
      groupRadius: 190
    });
  }

  /**
   * Create boats in a circular formation
   */
  async createCircularFormation(
    water: THREE.Mesh,
    center: THREE.Vector3,
    boats: BoatConfig[],
    radius: number = 100
  ): Promise<THREE.Object3D[]> {
    return this.createBoatGroup(water, boats, {
      center,
      formation: 'circle',
      spacing: 80,
      groupRadius: radius
    });
  }

  /**
   * Create boats in a grid formation
   */
  async createGridFormation(
    water: THREE.Mesh,
    center: THREE.Vector3,
    boats: BoatConfig[],
    spacing: number = 60,
    rowCount: number = 3
  ): Promise<THREE.Object3D[]> {
    return this.createBoatGroup(water, boats, {
      center,
      formation: 'grid',
      spacing,
      rowCount,
      colCount: Math.ceil(boats.length / rowCount)
    });
  }
}