import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder, ring, lowPolyMaterial, glassColor } from '../../base/lowPolyMesh';

export interface HerculesOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  propellerColor?: string;
  windowColor?: string;
  /** Propeller tip bands */
  stripeColor?: string;
  scale?: number;
  /** Darker rear loading ramp under the upswept tail */
  showCargoDoor?: boolean;
}

const DEFAULTS = {
  bodyColor: '#5A6268',
  wingColor: '#4A5158',
  propellerColor: '#2C3E50',
  windowColor: '#87CEEB',
  stripeColor: '#FFD700',
};

// OCTAGON segments, k running from point k to point k + 1
const SEG_TOP = 7;
const SEG_UPPER = [0, 6];
const SEG_LOWER = [2, 4];
const SEG_BOTTOM = 3;

// Wing planform: constant chord over the centre section out past the engines, then tapering
const HALF_SPAN = 18;
const CENTRE_SECTION = 7;
const wingAt = (z: number) => {
  const t = Math.max(0, (Math.abs(z) - CENTRE_SECTION) / (HALF_SPAN - CENTRE_SECTION));
  return {
    le: THREE.MathUtils.lerp(3.2, 2.4, t),
    te: THREE.MathUtils.lerp(-1.4, 0, t),
    y: THREE.MathUtils.lerp(2.15, 2.6, t),
    thickness: THREE.MathUtils.lerp(0.6, 0.22, t),
  };
};
const ENGINE_Z = [-9.4, -4.6, 4.6, 9.4];
const PROP_RADIUS = 1.9;

/**
 * Hercules C-130 - four-engine turboprop military transport, built low poly
 *
 * One flat-shaded, vertex-coloured mesh: the blunt-nosed fuselage with its stepped windscreen and
 * upswept tail over the loading ramp, main-gear sponsons, a high tapered wing, four nacelles with
 * chin intakes and four-blade propellers, and the tall dorsal-filleted fin. Nose points +X, wing
 * spans Z. The gear is retracted, since it is only ever seen flying.
 */
export class Hercules extends SimpleThreeComponent {
  constructor(options: HerculesOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hercules C-130',
      version: '2.0.0',
      description: 'Four-engine military transport aircraft with distinctive high-wing design',
      tags: ['vehicle', 'aircraft', 'hercules', 'c130', 'military', 'transport', 'cargo'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      showCargoDoor: true,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const options = this.options as HerculesOptions;
    const body = new THREE.Color(options.bodyColor ?? DEFAULTS.bodyColor);
    const wing = new THREE.Color(options.wingColor ?? DEFAULTS.wingColor);
    const prop = new THREE.Color(options.propellerColor ?? DEFAULTS.propellerColor);
    const glass = glassColor(options.windowColor ?? DEFAULTS.windowColor);
    const stripe = new THREE.Color(options.stripeColor ?? DEFAULTS.stripeColor);
    const radome = body.clone().multiplyScalar(0.8);
    const ramp = body.clone().multiplyScalar(0.7);
    const intake = new THREE.Color('#141414');

    const mesh = new MeshBuilder();
    this.buildFuselage(mesh, { body, glass, radome, ramp }, options.showCargoDoor !== false);
    this.buildWingAndTail(mesh, wing);
    ENGINE_Z.forEach(z => this.buildEngine(mesh, z, { body, prop, stripe, intake }));

    const hercules = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    hercules.name = 'Hercules-C130';
    return hercules;
  }

  private buildFuselage(
    mesh: MeshBuilder,
    colors: { body: THREE.Color; glass: THREE.Color; radome: THREE.Color; ramp: THREE.Color },
    showCargoDoor: boolean
  ): void {
    // Stations nose to tail: x, bottom, top, half width
    const stations: [number, number, number, number][] = [
      [13.6, -0.35, 0.35, 0.3], // radome tip
      [12.8, -1.05, 0.75, 1.05],
      [11.8, -1.5, 1.15, 1.5], // windscreen starts
      [10.9, -1.75, 1.8, 1.75], // cockpit roof
      [9.2, -1.8, 1.8, 1.8],
      [-6, -1.8, 1.8, 1.8], // upsweep starts
      [-9, -0.9, 1.8, 1.65],
      [-12, 0.6, 1.7, 1.1], // ramp hinge to tail cone
      [-13.6, 1.1, 1.6, 0.4],
    ];
    const windscreen = 2;
    const rampSection = 5;

    mesh.loft(
      stations.map(([x, bottom, top, w]) => ring(x, bottom, top, w)),
      (s, k) => {
        if (s === 0) return colors.radome;
        if (s === windscreen && (k === SEG_TOP || SEG_UPPER.includes(k))) return colors.glass;
        const underside = k === SEG_BOTTOM || SEG_LOWER.includes(k);
        if (showCargoDoor && s === rampSection && underside) return colors.ramp;
        return colors.body;
      },
      [colors.radome, colors.body]
    );

    // Main-gear sponsons bulging from the lower fuselage sides
    [-1.75, 1.75].forEach(z => {
      mesh.loft(
        [
          ring(3.4, -1.35, -0.95, 0.2, z),
          ring(2.2, -1.9, -0.3, 0.55, z),
          ring(-3.8, -1.9, -0.3, 0.55, z),
          ring(-5.2, -1.5, -0.65, 0.2, z),
        ],
        () => colors.body,
        [colors.body, colors.body]
      );
    });
  }

  private buildWingAndTail(mesh: MeshBuilder, color: THREE.Color): void {
    const up = new THREE.Vector3(0, 1, 0);

    mesh.surface(
      [-HALF_SPAN, -CENTRE_SECTION, 0, CENTRE_SECTION, HALF_SPAN].map(z => {
        const { le, te, y, thickness } = wingAt(z);
        return { le: new THREE.Vector3(le, y, z), te: new THREE.Vector3(te, y, z), thickness };
      }),
      up,
      color
    );

    // Horizontal stabiliser across the tail cone
    mesh.surface(
      [-6.5, 0, 6.5].map(z => {
        const t = Math.abs(z) / 6.5;
        const y = 1.4 + t * 0.1;
        return {
          le: new THREE.Vector3(THREE.MathUtils.lerp(-10.9, -12.3, t), y, z),
          te: new THREE.Vector3(THREE.MathUtils.lerp(-13.4, -13.6, t), y, z),
          thickness: THREE.MathUtils.lerp(0.28, 0.12, t),
        };
      }),
      up,
      color
    );

    // Tall fin, its long leading edge running into the dorsal fillet
    mesh.surface(
      [
        {
          le: new THREE.Vector3(-8.4, 1.5, 0),
          te: new THREE.Vector3(-13.3, 1.5, 0),
          thickness: 0.4,
        },
        { le: new THREE.Vector3(-11.4, 4, 0), te: new THREE.Vector3(-13.5, 4, 0), thickness: 0.28 },
        { le: new THREE.Vector3(-12.3, 7, 0), te: new THREE.Vector3(-13.8, 7, 0), thickness: 0.15 },
      ],
      new THREE.Vector3(0, 0, 1),
      color
    );
  }

  private buildEngine(
    mesh: MeshBuilder,
    z: number,
    colors: { body: THREE.Color; prop: THREE.Color; stripe: THREE.Color; intake: THREE.Color }
  ): void {
    const { le, te } = wingAt(z);

    // Nacelle hanging under the wing, deep at the front for the chin intake
    mesh.loft(
      [
        ring(le + 1.7, 1.25, 2.3, 0.5, z),
        ring(le + 1.1, 0.95, 2.4, 0.62, z),
        ring(le - 1.0, 1.0, 2.45, 0.62, z),
        ring(te - 0.2, 1.5, 2.3, 0.45, z),
        ring(te - 1.2, 1.95, 2.15, 0.12, z),
      ],
      () => colors.body,
      [colors.intake, colors.body]
    );

    // Six-sided spinner in front of the intake, four pitched blades in an X with banded tips
    const hubY = 1.95;
    mesh.cone(new THREE.Vector3(le + 1.7, hubY, z), 0.8, 0.38, 6, colors.prop);
    mesh.propeller({
      hub: new THREE.Vector3(le + 2.0, hubY, z),
      radius: PROP_RADIUS,
      blades: 4,
      phase: Math.PI / 4,
      rootChord: 0.32,
      tipChord: 0.18,
      color: colors.prop,
      tipColor: colors.stripe,
    });
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HerculesOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HerculesOptions;

    return {
      name: 'Hercules C-130',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'military_transport',
      engines: 4,
      propellerType: 'turboprop',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
      showCargoDoor: options.showCargoDoor,
    };
  }
}

export default Hercules;
