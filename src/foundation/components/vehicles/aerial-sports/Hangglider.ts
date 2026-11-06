import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import HangGliderWing from '../components/HangGliderWing';

export interface HanggliderOptions extends SimpleComponentOptions {
  sailColor?: string;
  harnessColor?: string;
  helmetColor?: string;
  scale?: number;
}

/** The pilot lies prone this far below the hang point, in metres */
const PILOT_DEPTH = 1.25;

/**
 * Hangglider - a flex wing with its pilot prone in a pod harness, hands on the basebar.
 * Nose points along +X, in metres.
 *
 * It overrides createObject (SimpleThreeComponent) to compose the async wing component.
 * See docs/COMPONENT_COMPOSITION.md for architecture details.
 */
export class Hangglider extends SimpleThreeComponent {
  private wing?: HangGliderWing;

  constructor(options: HanggliderOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hangglider',
      version: '3.0.0',
      description: 'Flex wing hang glider with pilot in prone flying position',
      tags: ['vehicle', 'aircraft', 'hangglider', 'aerial-sports', 'composite'],
    };

    super(metadata, {
      harnessColor: '#141414',
      helmetColor: '#0A0A0A',
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - not used since we override createObject for async composition
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Group();
    group.name = 'Hangglider';

    const options = this.options as HanggliderOptions;

    this.wing = new HangGliderWing(
      options.sailColor ? { sailColor: options.sailColor } : {}
    );
    group.add(await this.wing.load());
    group.add(this.createPilot(options));

    const scale = options.scale || 1;
    group.scale.setScalar(scale);

    this.applyShadows(group);

    return group;
  }

  private material(color: string | undefined, roughness = 0.8, metalness = 0): THREE.Material {
    return resourceManager.getOrCreateMaterial(
      `hangglider_pilot_${color}_${roughness}_${metalness}`,
      () => new THREE.MeshStandardMaterial({ color, roughness, metalness })
    );
  }

  /**
   * Glossy aero helmet: a shell stretched into a tail that trails over the back,
   * with a smoked visor wrapping the face. Faces +X like the pilot.
   */
  private createHelmet(color: string | undefined): THREE.Group {
    const helmet = new THREE.Group();
    helmet.name = 'helmet';

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 14),
      this.material(color, 0.25, 0.4)
    );
    shell.scale.set(1.45, 0.95, 0.92);
    shell.position.x = -0.05;
    helmet.add(shell);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 10),
      this.material('#1C2630', 0.05, 0.9)
    );
    visor.scale.set(0.45, 0.5, 1.05);
    visor.position.set(0.1, -0.01, 0);
    helmet.add(visor);

    return helmet;
  }

  /** Pod harness, helmet and arms reaching forward to the basebar */
  private createPilot(options: HanggliderOptions): THREE.Group {
    const pilot = new THREE.Group();
    pilot.name = 'pilot';
    const harness = this.material(options.harnessColor);

    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.35, 4, 10), harness);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(-0.2, -PILOT_DEPTH, 0);
    pilot.add(pod);

    const helmet = this.createHelmet(options.helmetColor);
    helmet.position.set(0.72, -PILOT_DEPTH + 0.06, 0);
    pilot.add(helmet);

    // Hang strap from the keel down to the harness
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, PILOT_DEPTH), harness);
    strap.position.set(0.15, -PILOT_DEPTH / 2, 0);
    pilot.add(strap);

    [-1, 1].forEach(sign => {
      const shoulder = new THREE.Vector3(0.5, -PILOT_DEPTH + 0.05, sign * 0.17);
      const hand = new THREE.Vector3(0.85, -1.6, sign * 0.4);
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.05, shoulder.distanceTo(hand), 6),
        harness
      );
      arm.position.copy(shoulder).lerp(hand, 0.5);
      arm.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        hand.clone().sub(shoulder).normalize()
      );
      pilot.add(arm);
    });

    return pilot;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HanggliderOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public override dispose(): void {
    this.wing?.dispose();
    this.wing = undefined;
    super.dispose();
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HanggliderOptions;

    return {
      name: 'Hangglider',
      version: '3.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'aerial_sports',
      sailColor: options.sailColor,
      scale: options.scale,
    };
  }
}

export default Hangglider;
