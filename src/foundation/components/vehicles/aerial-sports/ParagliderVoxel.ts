import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import LegacyPilotVoxel, { PilotVoxelOptions } from '../../characters/LegacyPilotVoxel';
import Glider, { GliderOptions } from '../components/Glider';

export interface ParagliderVoxelOptions extends SimpleComponentOptions {
  glider: GliderOptions;
  pilot: PilotVoxelOptions;
}

/**
 * ParagliderVoxel - voxel-style paraglider with simplified pilot
 *
 * This component uses Pattern B (SimpleThreeComponent + createObject override)
 * for async composition of multiple sub-components (Glider + LegacyPilotVoxel).
 * Uses voxel-based (blocky/Minecraft-style) graphics for the pilot character.
 *
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class ParagliderVoxel extends SimpleThreeComponent {
  private glider?: Glider;
  private pilot?: LegacyPilotVoxel;
  private pilotMesh?: THREE.Object3D;

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
   * Override createObject to compose async sub-components.
   * This is Pattern B from COMPONENT_COMPOSITION.md - the standard pattern
   * for vehicles that combine multiple loadable components.
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Object3D();
    group.name = 'ParagliderVoxel';

    const options = this.options as ParagliderVoxelOptions;

    // Create and load glider wing
    this.glider = new Glider(options.glider);
    const wing = await this.glider.load();
    wing.translateY(-300);
    wing.translateX(300);
    group.add(wing);

    // Create voxel pilot
    this.pilot = new LegacyPilotVoxel(options.pilot);
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 350;
    this.pilotMesh.position.y = -600;
    this.pilotMesh.position.z = 0;
    const scale = 150;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.rotateY(Math.PI / 2);
    group.add(this.pilotMesh);

    return group;
  }

  /**
   * Control methods - delegate to glider for brake inputs.
   * These methods are called by ParagliderInputController.
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
      // LegacyPilotVoxel doesn't have dispose, just clear reference
      this.pilot = undefined;
    }
    if (this.glider) {
      // Glider doesn't have dispose, just clear reference
      this.glider = undefined;
    }

    // Clear references
    this.pilotMesh = undefined;

    // Call parent dispose
    super.dispose();
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
