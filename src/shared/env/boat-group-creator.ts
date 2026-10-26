import * as THREE from 'three';
import { SmallSailBoat, FishingBoat, Yacht, SpeedBoat } from '../../foundation/components/scenery';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { BoatConfig, BoatGroupConfig } from './boat-group-types';
import { calculateBoatPositions, generateMixedRecreationalBoats } from './boat-group-utils';

type BoatComponent =
  | InstanceType<typeof SmallSailBoat>
  | InstanceType<typeof FishingBoat>
  | InstanceType<typeof Yacht>
  | InstanceType<typeof SpeedBoat>;

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
    position: THREE.Vector3
  ): Promise<THREE.Object3D | null> {
    let boat: BoatComponent;
    let boatMesh: THREE.Object3D;
    const scale = boatConfig.scale || 2.5;

    // Create boat based on type
    switch (boatConfig.type) {
      case 'SmallSailBoat':
        boat = new SmallSailBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement,
        });
        boatMesh = await this.componentRegistry.register(boat, 'smallsailboat');
        break;

      case 'FishingBoat':
        boat = new FishingBoat({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement,
        });
        boatMesh = await this.componentRegistry.register(boat, 'fishingboat');
        break;

      case 'Yacht':
        boat = new Yacht({
          enableMovement: boatConfig.enableMovement,
          pattern: boatConfig.pattern,
          speed: boatConfig.speed,
          radius: boatConfig.radius,
          autoStartMoving: boatConfig.enableMovement,
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
        });
        boatMesh = await this.componentRegistry.register(boat, 'speedboat');
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

      const boatMesh = await this.createSingleBoat(boatConfig, position);
      if (boatMesh) {
        boatMeshes.push(boatMesh);
      }
    }

    return boatMeshes;
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
      groupRadius: 190,
    });
  }
}
