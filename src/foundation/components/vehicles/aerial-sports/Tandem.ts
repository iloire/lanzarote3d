import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import TandemPilot, { TandemPilotOptions } from '../../characters/TandemPilot';
import Glider, { GliderOptions } from '../components/Glider';

export interface TandemOptions extends SimpleComponentOptions {
  glider: GliderOptions;
  pilot: TandemPilotOptions;
}

/**
 * Tandem - tandem paraglider with two pilots (instructor + passenger)
 *
 * This component uses Pattern B (SimpleThreeComponent + createObject override)
 * for async composition of multiple sub-components (Glider + TandemPilot).
 *
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class Tandem extends SimpleThreeComponent {
  private glider?: Glider;
  private pilot?: TandemPilot;
  private pilotMesh?: THREE.Object3D;

  constructor(options: TandemOptions) {
    const metadata: ComponentMetadata = {
      name: 'Tandem',
      version: '2.0.0',
      description: 'Tandem paraglider with instructor and passenger pilots',
      tags: ['vehicle', 'aircraft', 'paraglider', 'tandem', 'aerial-sports', 'composite'],
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
    group.name = 'Tandem';

    const options = this.options as TandemOptions;

    // Create and load glider wing
    this.glider = new Glider(options.glider);
    const wing = this.glider.createWing();
    wing.position.y = 2800;
    wing.position.x = 300;
    group.add(wing);

    // Create and load tandem pilot (instructor + passenger)
    this.pilot = new TandemPilot(options.pilot);
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 17;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    group.add(this.pilotMesh);

    return group;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as TandemOptions;

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
      // TandemPilot doesn't have dispose, just clear reference
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
    const options = this.options as TandemOptions;

    return {
      name: 'Tandem',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'aerial_sports',
      variant: 'tandem',
      gliderConfig: options.glider,
      pilotConfig: options.pilot,
    };
  }
}

export default Tandem;
