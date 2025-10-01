import * as THREE from 'three';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import HangGliderWing from '../components/HangGliderWing';
import GuiHelper from '../../../utils/gui';

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
 * This component no longer extends AutoFlier - use FlyingBehavior when autonomous flight is needed.
 * Provides just the visual model without path-following logic.
 */
class HangGliderModel {
  wing!: HangGliderWing;
  pilot!: Pilot;
  private pilotOptions?: PilotOptions;
  private wingColor?: string;
  private wingspan?: number;
  private scale?: number;
  private castShadow?: boolean;
  private receiveShadow?: boolean;
  private mesh?: THREE.Group;

  constructor(options: HanggliderOptions = {}) {
    this.pilotOptions = options.pilotOptions;
    this.wingColor = options.wingColor;
    this.wingspan = options.wingspan;
    this.scale = options.scale || 1;
    this.castShadow = options.castShadow;
    this.receiveShadow = options.receiveShadow;
  }

  async load(): Promise<THREE.Group> {
    const group = new THREE.Group();

    // Create wing
    this.wing = new HangGliderWing({
      wingColor: this.wingColor,
      wingspan: this.wingspan,
    });
    const wingMesh = await this.wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;

    // Create pilot
    this.pilot = new Pilot({
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow,
      ...this.pilotOptions,
    });
    const pilotMesh = await this.pilot.load();
    const pilotScale = 0.03;
    pilotMesh.scale.set(pilotScale, pilotScale, pilotScale);
    pilotMesh.position.x = -5;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    group.add(pilotMesh);
    group.add(wingMesh);

    // Rotate the entire hangglider model 90 degrees to the left + 180 degrees (total 270 degrees)
    group.rotateY(-Math.PI / 2 + Math.PI);

    // Apply scale
    if (this.scale !== 1) {
      group.scale.set(this.scale, this.scale, this.scale);
    }

    // Apply shadow settings
    if (this.castShadow !== undefined || this.receiveShadow !== undefined) {
      group.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (this.castShadow !== undefined) child.castShadow = this.castShadow;
          if (this.receiveShadow !== undefined) child.receiveShadow = this.receiveShadow;
        }
      });
    }

    this.mesh = group;
    return group;
  }

  /**
   * Add GUI controls for this hangglider
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGuiControls(gui: any): void {
    if (!this.mesh) return;

    const pilot = this.mesh.children.find((child: THREE.Object3D) => child.name === 'pilot');
    if (pilot) {
      GuiHelper.addLocationGui(gui, 'Hanglider pilot', pilot);
    }
    GuiHelper.addLocationGui(gui, 'Hanglider', this.mesh);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    }
  }
}

export default HangGliderModel;
