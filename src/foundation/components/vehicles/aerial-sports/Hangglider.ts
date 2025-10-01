import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { Pilot, type PilotOptions } from '../../characters/Pilot';
import HangGliderWing from '../components/HangGliderWing';

export interface HanggliderOptions extends SimpleComponentOptions {
  pilotOptions?: PilotOptions;
  wingColor?: string;
  wingspan?: number;
  scale?: number;
}

/**
 * Hangglider - combines wing and pilot into a single aircraft
 *
 * This component uses Pattern B (SimpleThreeComponent + createObject override)
 * for async composition of multiple sub-components (HangGliderWing + Pilot).
 *
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class Hangglider extends SimpleThreeComponent {
  private wing?: HangGliderWing;
  private pilot?: Pilot;
  private pilotMesh?: THREE.Object3D;

  constructor(options: HanggliderOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hangglider',
      version: '2.0.0',
      description: 'Recreational hangglider with pilot in prone flying position',
      tags: ['vehicle', 'aircraft', 'hangglider', 'aerial-sports', 'composite'],
    };

    super(metadata, {
      wingColor: '#FF6B35', // Orange
      wingspan: 100,
      scale: 1,
      ...options,
    });
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
    const group = new THREE.Group();
    group.name = 'Hangglider';

    const options = this.options as HanggliderOptions;

    // Create and load wing component
    this.wing = new HangGliderWing({
      wingColor: options.wingColor,
      wingspan: options.wingspan,
    });
    const wingMesh = await this.wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;
    group.add(wingMesh);

    // Create and load pilot component
    this.pilot = new Pilot({
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
      ...options.pilotOptions,
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
    const scale = options.scale || 1;
    if (scale !== 1) {
      group.scale.set(scale, scale, scale);
    }

    // Apply shadow settings via helper method from base class
    this.applyShadows(group);

    return group;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HanggliderOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.wingspan && options.wingspan <= 0) {
      issues.push('Wingspan must be greater than 0');
    }

    return issues;
  }

  public override dispose(): void {
    // Dispose sub-components first
    if (this.pilot) {
      this.pilot.dispose();
    }
    if (this.wing) {
      this.wing.dispose();
    }

    // Clear references
    this.wing = undefined;
    this.pilot = undefined;
    this.pilotMesh = undefined;

    // Call parent dispose
    super.dispose();
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HanggliderOptions;

    return {
      name: 'Hangglider',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'aerial_sports',
      wingColor: options.wingColor,
      wingspan: options.wingspan,
      scale: options.scale,
    };
  }
}

export default Hangglider;
