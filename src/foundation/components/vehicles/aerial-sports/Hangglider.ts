import * as THREE from 'three';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import HangGliderWing from '../components/HangGliderWing';
import GuiHelper from '../../../utils/gui';
import { IVehicleWithGUI } from '../../../types/IVehicle';

export interface HanggliderOptions {
  pilotOptions?: PilotOptions;
  wingColor?: string;
  wingspan?: number;
  scale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Hangglider component - combines wing and pilot
 *
 * This component composes both the hangglider wing and pilot character into a single assembly.
 * Implements IVehicleWithGUI for consistent vehicle interface across the application.
 *
 * Note: This class doesn't extend a base component class because it's a composite
 * that assembles two different component types (HangGliderWing and Pilot) with
 * different configurations. Instead, it implements the IVehicle interface for consistency.
 * Use FlyingBehavior when autonomous flight is needed.
 */
export class Hangglider implements IVehicleWithGUI {
  private mesh?: THREE.Group;
  private wing!: HangGliderWing;
  private pilot!: Pilot;
  private pilotMesh!: THREE.Object3D;
  private options: HanggliderOptions;

  constructor(options: HanggliderOptions = {}) {
    this.options = options;
  }

  /**
   * Load and assemble the hangglider
   */
  async load(): Promise<THREE.Group> {
    const group = new THREE.Group();
    group.name = 'Hangglider';

    // Create wing
    this.wing = new HangGliderWing({
      wingColor: this.options.wingColor,
      wingspan: this.options.wingspan,
    });
    const wingMesh = await this.wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;
    group.add(wingMesh);

    // Create pilot
    this.pilot = new Pilot({
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
      ...this.options.pilotOptions,
    });
    this.pilotMesh = await this.pilot.load();
    const pilotScale = 0.03;
    this.pilotMesh.scale.set(pilotScale, pilotScale, pilotScale);
    this.pilotMesh.position.x = -5;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    group.add(this.pilotMesh);

    // Rotate the entire hangglider model 90 degrees to the left + 180 degrees (total 270 degrees)
    group.rotateY(-Math.PI / 2 + Math.PI);

    // Apply scale
    const scale = this.options.scale || 1;
    if (scale !== 1) {
      group.scale.set(scale, scale, scale);
    }

    // Apply shadow settings
    if (this.options.castShadow !== undefined || this.options.receiveShadow !== undefined) {
      group.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (this.options.castShadow !== undefined) child.castShadow = this.options.castShadow;
          if (this.options.receiveShadow !== undefined) child.receiveShadow = this.options.receiveShadow;
        }
      });
    }

    this.mesh = group;
    return group;
  }

  /**
   * Get the mesh
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      throw Error('mesh not loaded - use load()');
    }
    return this.mesh;
  }

  /**
   * Add GUI controls for this hangglider
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addGuiControls(gui: any): void {
    if (!this.mesh) return;

    if (this.pilotMesh) {
      GuiHelper.addLocationGui(gui, 'Hangglider pilot', this.pilotMesh);
    }
    GuiHelper.addLocationGui(gui, 'Hangglider', this.mesh);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.pilot) {
      this.pilot.dispose();
    }
    if (this.wing) {
      this.wing.dispose();
    }
    // Clear references
    this.mesh = undefined;
    this.wing = undefined as any;
    this.pilot = undefined as any;
    this.pilotMesh = undefined as any;
  }
}

export default Hangglider;
