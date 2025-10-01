import * as THREE from 'three';
import TandemPilot, { TandemPilotOptions } from '../../characters/TandemPilot';
import LegacyGlider, { GliderOptions } from '../components/Glider';
import { IVehicle } from '../../../types/IVehicle';

export interface TandemOptions {
  glider: GliderOptions;
  pilot: TandemPilotOptions;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Tandem - tandem paraglider with two pilots
 *
 * This component composes both the glider wing and tandem pilot (pilot + passenger)
 * into a single assembly. Implements IVehicle for consistent vehicle interface.
 *
 * Note: This class doesn't extend a base component class because it's a composite
 * that assembles two different component types (LegacyGlider and TandemPilot) with
 * different configurations. Instead, it implements the IVehicle interface for consistency.
 */
export class Tandem implements IVehicle {
  private mesh?: THREE.Object3D;
  private glider!: LegacyGlider;
  private pilot!: TandemPilot;
  private pilotMesh!: THREE.Object3D;
  private options: TandemOptions;

  constructor(options: TandemOptions) {
    this.options = options;
  }

  /**
   * Load and assemble the tandem paraglider
   */
  async load(): Promise<THREE.Object3D> {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'Tandem';

    // Create glider wing
    this.glider = new LegacyGlider(this.options.glider);
    const wing = this.glider.createWing();
    wing.position.y = 2800;
    wing.position.x = 300;
    this.mesh.add(wing);

    // Create tandem pilot (pilot + passenger)
    this.pilot = new TandemPilot(this.options.pilot);
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
   * Clean up resources
   */
  public dispose(): void {
    // Clear references
    this.mesh = undefined;
    this.glider = undefined as any;
    this.pilot = undefined as any;
    this.pilotMesh = undefined as any;
  }
}

export default Tandem;
