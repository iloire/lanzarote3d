import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { PilotVoxel, PilotVoxelOptions } from '../../characters/PilotVoxel';
import Glider, { GliderOptions } from '../components/Glider';
import { createPirateFlag } from '../components/PirateFlag';

export interface ParagliderVoxelOptions extends SimpleComponentOptions {
  glider: GliderOptions;
  pilot: PilotVoxelOptions;
  /** Hang an open pirate flag on a pole under the pilot's harness */
  pirateFlag?: boolean;
}

/**
 * ParagliderVoxel - voxel-style paraglider with simplified pilot
 *
 * It overrides createObject (SimpleThreeComponent) to compose its async
 * sub-components (Glider + PilotVoxel).
 * Uses voxel-based (blocky/Minecraft-style) graphics for the pilot character.
 *
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class ParagliderVoxel extends SimpleThreeComponent {
  private glider?: Glider;
  private pilot?: PilotVoxel;
  private pilotMesh?: THREE.Object3D;
  private pilotSwing?: THREE.Object3D;

  constructor(options: ParagliderVoxelOptions) {
    const metadata: ComponentMetadata = {
      name: 'ParagliderVoxel',
      version: '2.0.0',
      description: 'Voxel-style paraglider with blocky pilot graphics',
      tags: ['vehicle', 'aircraft', 'paraglider', 'aerial-sports', 'voxel', 'composite'],
    };

    super(metadata, options);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - not used since we override createObject for async composition
    return new THREE.BoxGeometry(1, 1, 1);
  }

  /**
   * Override createObject to compose async sub-components, the standard
   * approach for vehicles that combine multiple loadable components.
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Object3D();
    group.name = 'ParagliderVoxel';

    const options = this.options as ParagliderVoxelOptions;

    // Glider wing, hung from the pilot's carabiners
    this.glider = new Glider(options.glider);
    const wing = await this.glider.load();
    wing.position.set(300, 100, 0);
    group.add(wing);

    // Create voxel pilot
    this.pilot = new PilotVoxel(options.pilot);
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 350;
    this.pilotMesh.position.y = -600;
    this.pilotMesh.position.z = 0;
    const scale = 150;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.rotation.y = Math.PI / 2; // Rotate pilot 90 degrees left
    group.add(this.pilotMesh);

    // The pilot hangs from a pivot at the carabiners, the wing's origin, where wing and harness
    // really are hinged, so the risers stay attached however the pilot swings. The pivot's
    // frame is turned back to the paraglider's outer one: X right, Y up, -Z forward.
    const hangPoint = new THREE.Object3D();
    hangPoint.position.copy(wing.position);
    hangPoint.rotation.y = -Math.PI / 2;
    group.add(hangPoint);
    this.pilotSwing = new THREE.Object3D();
    this.pilotSwing.name = 'pilot-swing';
    hangPoint.add(this.pilotSwing);
    group.updateMatrixWorld(true);
    this.pilotSwing.attach(this.pilotMesh);
    // The brake handles are in the pilot's fists; their lines follow them as the pilot swings
    wing
      .getObjectByName('brakes')
      ?.children.filter(child => child.name === 'brake-handle')
      .forEach(handle => this.pilotSwing?.attach(handle));

    // Under the seat, so it swings with the pilot and streams back behind them
    if (options.pirateFlag) {
      const flag = createPirateFlag();
      flag.position.set(0, -700, 150);
      this.pilotSwing.add(flag);
    }

    // Rotate entire group 90 degrees left to align with forward axis
    group.rotation.y = Math.PI / 2;

    return group;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as ParagliderVoxelOptions;

    if (!options.glider) {
      issues.push('Glider configuration is required');
    }

    if (!options.pilot) {
      issues.push('Pilot configuration is required');
    }

    return issues;
  }

  public override dispose(): void {
    // Dispose sub-components first
    if (this.pilot) {
      // PilotVoxel doesn't have dispose, just clear reference
      this.pilot = undefined;
    }
    if (this.glider) {
      // Glider doesn't have dispose, just clear reference
      this.glider = undefined;
    }

    // Clear references
    this.pilotMesh = undefined;
    this.pilotSwing = undefined;

    // Call parent dispose
    super.dispose();
  }

  /** The pivot the pilot hangs from, at the carabiners; rotate it to swing the pilot */
  public getPilotSwing(): THREE.Object3D | undefined {
    return this.pilotSwing;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as ParagliderVoxelOptions;

    return {
      name: 'ParagliderVoxel',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'aerial_sports',
      style: 'voxel',
      gliderConfig: options.glider,
      pilotConfig: options.pilot,
    };
  }
}

export default ParagliderVoxel;
