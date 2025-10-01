import * as THREE from 'three';
import LegacyPilotVoxel, { PilotVoxelOptions } from '../../characters/LegacyPilotVoxel';
import LegacyGlider, { GliderOptions } from '../components/Glider';
import GuiHelper from '../../../utils/gui';

export interface ParagliderVoxelOptions {
  glider: GliderOptions;
  pilot: PilotVoxelOptions;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * ParagliderVoxel - voxel-style paraglider with simplified pilot
 *
 * This component composes both the glider wing and voxel pilot into a single assembly.
 * Uses voxel-based (blocky/Minecraft-style) graphics for the pilot character.
 * Note: This class doesn't extend a base component class because it needs to compose
 * two different component types (LegacyGlider and LegacyPilotVoxel) with different APIs.
 */
export class ParagliderVoxel {
  private mesh?: THREE.Object3D;
  private glider!: LegacyGlider;
  private pilot!: LegacyPilotVoxel;
  private pilotMesh!: THREE.Object3D;
  private options: ParagliderVoxelOptions;

  constructor(options: ParagliderVoxelOptions) {
    this.options = options;
  }

  /**
   * Load and assemble the voxel paraglider
   */
  async load(): Promise<THREE.Object3D> {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'ParagliderVoxel';

    // Create glider wing
    this.glider = new LegacyGlider(this.options.glider);
    const wing = await this.glider.load();
    wing.translateY(-300);
    wing.translateX(300);
    this.mesh.add(wing);

    // Create voxel pilot
    this.pilot = new LegacyPilotVoxel(this.options.pilot);
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 350;
    this.pilotMesh.position.y = -600;
    this.pilotMesh.position.z = 0;
    const scale = 150;
    this.pilotMesh.scale.set(scale, scale, scale);
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

export default ParagliderVoxel;
