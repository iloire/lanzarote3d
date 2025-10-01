import * as THREE from 'three';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import Glider, { GliderOptions } from '../components/Glider';
import GuiHelper from '../../../utils/gui';
import { IVehicleWithGUI } from '../../../types/IVehicle';

export interface ParagliderOptions {
  glider: GliderOptions;
  pilot: PilotOptions;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Paraglider - combines a glider wing with a pilot
 *
 * This component composes both the glider wing and pilot character into a single assembly.
 * Implements IVehicleWith GUI for consistent vehicle interface across the application.
 *
 * Note: This class doesn't extend a base component class because it's a composite
 * that assembles two different component types (Glider and Pilot) with
 * different APIs. Instead, it implements the IVehicle interface for consistency.
 */
export class Paraglider implements IVehicleWithGUI {
  private mesh?: THREE.Object3D;
  private glider!: Glider;
  private pilot!: Pilot;
  private pilotMesh!: THREE.Object3D;
  private options: ParagliderOptions;

  constructor(options: ParagliderOptions) {
    this.options = options;
  }

  /**
   * Load and assemble the paraglider
   */
  async load(): Promise<THREE.Object3D> {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'Paraglider';

    // Create glider wing
    this.glider = new Glider(this.options.glider);
    const wing = await this.glider.load();
    wing.translateY(-300);
    wing.translateX(300);
    this.mesh.add(wing);

    // Create pilot
    this.pilot = new Pilot({
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
      ...this.options.pilot,
    });
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 17;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    this.mesh.add(this.pilotMesh);

    return this.mesh;
  }

  /**
   * Get the mesh
   */
  public getMesh(): THREE.Object3D {
    if (!this.mesh) {
      throw Error('mesh not loaded - use load()');
    }
    return this.mesh;
  }

  /**
   * Add GUI controls for this paraglider
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addGuiControls(gui: any): void {
    if (!this.mesh) return;

    if (this.pilotMesh) {
      GuiHelper.addLocationGui(gui, 'Pilot model', this.pilotMesh);
    }
    GuiHelper.addLocationGui(gui, 'Paraglider model', this.mesh);
  }

  /**
   * Control methods - delegate to glider
   */
  public left(): void {
    if (this.glider) {
      this.glider.breakLeft();
    }
  }

  public right(): void {
    if (this.glider) {
      this.glider.breakRight();
    }
  }

  public leftRelease(): void {
    if (this.glider) {
      this.glider.handsUp();
    }
  }

  public rightRelease(): void {
    if (this.glider) {
      this.glider.handsUp();
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.pilot) {
      this.pilot.dispose();
    }
    // Clear references
    this.mesh = undefined;
    this.glider = undefined as any;
    this.pilot = undefined as any;
    this.pilotMesh = undefined as any;
  }
}

export default Paraglider;
