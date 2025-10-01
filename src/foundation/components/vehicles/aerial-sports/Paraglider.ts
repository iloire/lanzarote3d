import * as THREE from 'three';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import LegacyGlider, { GliderOptions } from '../components/Glider';
import GuiHelper from '../../../utils/gui';

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
 * Note: This class doesn't extend a base component class because it needs to compose
 * two different component types (LegacyGlider and modern Pilot) with different APIs.
 */
export class Paraglider {
  private mesh?: THREE.Object3D;
  private glider!: LegacyGlider;
  private pilot!: Pilot;
  private pilotMesh!: THREE.Object3D;
  private axesHelper!: THREE.AxesHelper;
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
    this.glider = new LegacyGlider(this.options.glider);
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

    // Add axes helper
    this.axesHelper = new THREE.AxesHelper(100);
    this.axesHelper.visible = false;
    this.mesh.add(this.axesHelper);

    return this.mesh;
  }

  // Control methods
  public showAxesHelper(): void {
    if (this.axesHelper) {
      this.axesHelper.visible = true;
    }
  }

  public toggleAxesHelper(): void {
    if (this.axesHelper) {
      this.axesHelper.visible = !this.axesHelper.visible;
    }
  }

  public left(): void {
    if (this.glider) {
      this.glider.breakLeft();
    }
    if (this.pilot) {
      this.pilot.breakLeft();
    }
  }

  public leftRelease(): void {
    if (this.pilot) {
      this.pilot.breakLeftRelease();
    }
  }

  public right(): void {
    if (this.glider) {
      this.glider.breakRight();
    }
    if (this.pilot) {
      this.pilot.breakRight();
    }
  }

  public rightRelease(): void {
    if (this.pilot) {
      this.pilot.breakRightRelease();
    }
  }

  public speedBar(): void {
    if (this.pilot) {
      this.pilot.speedBar();
    }
  }

  public releaseSpeedBar(): void {
    if (this.pilot) {
      this.pilot.releaseSpeedBar();
    }
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
    if (this.pilot) {
      this.pilot.dispose();
    }
    // Clear references
    this.mesh = undefined;
    this.glider = undefined as any;
    this.pilot = undefined as any;
    this.pilotMesh = undefined as any;
    this.axesHelper = undefined as any;
  }
}

export default Paraglider;
