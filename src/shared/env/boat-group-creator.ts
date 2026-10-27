import * as THREE from 'three';
import { SmallSailBoat, FishingBoat, Yacht, SpeedBoat } from '../../foundation/components/scenery';
import { ComponentRegistry } from '../../foundation/systems/ComponentRegistry';
import { Berth, BoatConfig, BoatGroupConfig } from './boat-group-types';
import { calculateBoatPositions, generateMixedRecreationalBoats } from './boat-group-utils';
import { addBoatWake } from '../../foundation/components/effects/BoatWake';

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

    // Boats under way leave a wake, sized from the boat before it is scaled
    if (boatConfig.enableMovement) {
      addBoatWake(boatMesh);
    }

    // Apply scaling
    boatMesh.scale.set(scale, scale, scale);

    // Position the boat
    boatMesh.position.copy(position);

    // Its heading, or a random one for variety. FloatingBehavior took the rotation it found at
    // load as the one to sway about, so it needs telling about the new one.
    boatMesh.rotation.y = boatConfig.heading ?? Math.random() * Math.PI * 2;
    boatMesh.userData.originalRotationY = boatMesh.rotation.y;

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
   * Moor boats at berths, one boat per berth, held still so they only bob
   */
  async createMooredBoats(boats: BoatConfig[], berths: Berth[]): Promise<THREE.Object3D[]> {
    const count = Math.min(boats.length, berths.length);
    const meshes = await Promise.all(
      berths
        .slice(0, count)
        .map((berth, i) =>
          this.createSingleBoat(
            { ...boats[i]!, enableMovement: false, heading: berth.heading },
            berth.position
          )
        )
    );
    return meshes.filter((mesh): mesh is THREE.Object3D => mesh !== null);
  }

  /**
   * Create a mixed recreational boating scene
   */
  async createRecreationalBoats(
    water: THREE.Mesh,
    center: THREE.Vector3,
    count: number = 8,
    formation: 'circle' | 'random' = 'random',
    scaleFactor: number = 1
  ): Promise<THREE.Object3D[]> {
    const boats = generateMixedRecreationalBoats(count).map(boat => ({
      ...boat,
      scale: (boat.scale ?? 2.5) * scaleFactor,
    }));

    return this.createBoatGroup(water, boats, {
      center,
      formation,
      spacing: 90,
      groupRadius: 190,
    });
  }
}
