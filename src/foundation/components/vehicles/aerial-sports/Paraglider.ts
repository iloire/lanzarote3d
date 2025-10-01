import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import Glider, { GliderOptions } from '../components/Glider';

export interface ParagliderOptions extends SimpleComponentOptions {
  glider: GliderOptions;
  pilot: PilotOptions;
}

/**
 * Paraglider - combines a glider wing with a pilot
 *
 * This component uses Pattern B (SimpleThreeComponent + createObject override)
 * for async composition of multiple sub-components (Glider + Pilot).
 *
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class Paraglider extends SimpleThreeComponent {
  private glider?: Glider;
  private pilot?: Pilot;
  private pilotMesh?: THREE.Object3D;

  constructor(options: ParagliderOptions) {
    const metadata: ComponentMetadata = {
      name: 'Paraglider',
      version: '2.0.0',
      description: 'Paraglider with pilot and RAM-air parachute wing',
      tags: ['vehicle', 'aircraft', 'paraglider', 'aerial-sports', 'composite'],
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
    group.name = 'Paraglider';

    const options = this.options as ParagliderOptions;

    // Create and load glider wing
    this.glider = new Glider(options.glider);
    const wing = await this.glider.load();
    wing.translateY(-300);
    wing.translateX(300);
    group.add(wing);

    // Create and load pilot
    this.pilot = new Pilot({
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
      ...options.pilot,
    });
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.position.x = 17;
    this.pilotMesh.position.z = -0.4;
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
    const options = this.options as ParagliderOptions;

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
      this.pilot.dispose();
    }
    if (this.glider) {
      // Glider doesn't have dispose, just clear reference
      this.glider = undefined;
    }

    // Clear references
    this.pilot = undefined;
    this.pilotMesh = undefined;

    // Call parent dispose
    super.dispose();
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as ParagliderOptions;

    return {
      name: 'Paraglider',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'aerial_sports',
      gliderConfig: options.glider,
      pilotConfig: options.pilot,
    };
  }
}

export default Paraglider;
