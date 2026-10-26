import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import {
  MeshBuilder,
  Section,
  circle,
  ring,
  lowPolyAircraftMaterial,
  glassColor,
} from './lowPolyMesh';

export interface CessnaOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  propellerColor?: string;
  windowColor?: string;
  /** Cheat line along the fuselage, fin cap, spinner and propeller tips */
  stripeColor?: string;
  scale?: number;
}

const DEFAULTS = {
  bodyColor: '#F4F4F4',
  wingColor: '#E8E8E8',
  propellerColor: '#2C3E50',
  windowColor: '#87CEEB',
  stripeColor: '#FF4500',
};

/** The octagon with its sides split so a cheat line can run along them */
const STRIPED: Section = [
  [0.5, 1],
  [1, 0.5],
  [1, 0],
  [1, -0.18],
  [0.65, -1],
  [-0.65, -1],
  [-1, -0.18],
  [-1, 0],
  [-1, 0.5],
  [-0.5, 1],
];
// Segment k runs from point k to point k + 1
const SEG_TOP = 9;
const SEG_UPPER = [0, 8, 1, 7]; // chamfers and upper sides: where the windows are
const SEG_STRIPE = [2, 6];

type Palette = Record<'body' | 'wing' | 'prop' | 'glass' | 'stripe' | 'dark', THREE.Color>;

// Wing planform: constant chord inboard, tapering outboard of the struts
const HALF_SPAN = 6;
const INBOARD = 2.6;
const wingAt = (z: number) => {
  const t = Math.max(0, (Math.abs(z) - INBOARD) / (HALF_SPAN - INBOARD));
  return {
    le: THREE.MathUtils.lerp(2.0, 1.8, t),
    te: THREE.MathUtils.lerp(0.25, 0.75, t),
    y: THREE.MathUtils.lerp(1.28, 1.45, t),
    thickness: THREE.MathUtils.lerp(0.24, 0.14, t),
  };
};

/**
 * Cessna 172 - single-engine four-seat high-wing trainer, built low poly
 *
 * One flat-shaded, vertex-coloured mesh: the cowled nose with a two-blade propeller, the cabin
 * with wraparound windscreen, side and rear windows under a strut-braced wing, the cheat line
 * down the slim tailcone, a swept fin and fixed tricycle gear on spring legs with wheel fairings.
 * Nose points +X, wing spans Z.
 */
export class Cessna extends SimpleThreeComponent {
  constructor(options: CessnaOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Cessna',
      version: '2.0.0',
      description: 'Small single-engine general aviation aircraft',
      tags: ['vehicle', 'aircraft', 'cessna', 'general-aviation'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const options = this.options as CessnaOptions;
    const colors: Palette = {
      body: new THREE.Color(options.bodyColor ?? DEFAULTS.bodyColor),
      wing: new THREE.Color(options.wingColor ?? DEFAULTS.wingColor),
      prop: new THREE.Color(options.propellerColor ?? DEFAULTS.propellerColor),
      glass: glassColor(options.windowColor ?? DEFAULTS.windowColor),
      stripe: new THREE.Color(options.stripeColor ?? DEFAULTS.stripeColor),
      dark: new THREE.Color('#1A1A1A'),
    };

    const mesh = new MeshBuilder();
    this.buildFuselage(mesh, colors);
    this.buildWingAndTail(mesh, colors);
    this.buildGear(mesh, colors);

    const cessna = new THREE.Mesh(mesh.build(), lowPolyAircraftMaterial());
    cessna.name = 'Cessna';
    return cessna;
  }

  private buildFuselage(mesh: MeshBuilder, colors: Palette): void {
    // Stations nose to tail: x, bottom, top, half width
    const stations: [number, number, number, number][] = [
      [4.15, -0.32, 0.32, 0.36], // cowl front
      [3.85, -0.55, 0.45, 0.5],
      [3.0, -0.62, 0.55, 0.56], // firewall, windscreen starts
      [1.9, -0.66, 1.15, 0.58], // roof under the wing
      [0.65, -0.62, 1.15, 0.58], // door post
      [0.45, -0.6, 1.15, 0.57],
      [-0.8, -0.42, 1.0, 0.5], // end of the rear windows
      [-3.0, -0.05, 0.55, 0.26],
      [-4.6, 0.18, 0.45, 0.08],
    ];
    const windscreen = 2;
    const sideWindows = 3;
    const rearWindows = 5;

    mesh.loft(
      stations.map(([x, bottom, top, w]) => ring(x, bottom, top, w, 0, STRIPED)),
      (s, k) => {
        if (SEG_STRIPE.includes(k)) return colors.stripe;
        const upper = SEG_UPPER.includes(k);
        if (s === windscreen && (upper || k === SEG_TOP)) return colors.glass;
        if (s === sideWindows && upper) return colors.glass;
        if (s === rearWindows && (upper || k === SEG_TOP)) return colors.glass;
        return colors.body;
      },
      [colors.dark, colors.body]
    );

    // Spinner and two-blade propeller
    mesh.cone(new THREE.Vector3(4.15, 0.02, 0), 0.55, 0.24, 8, colors.stripe);
    mesh.propeller({
      hub: new THREE.Vector3(4.3, 0.02, 0),
      radius: 1.0,
      blades: 2,
      phase: 0.35,
      rootChord: 0.16,
      tipChord: 0.1,
      color: colors.prop,
      tipColor: colors.stripe,
    });
  }

  private buildWingAndTail(mesh: MeshBuilder, colors: Palette): void {
    const up = new THREE.Vector3(0, 1, 0);

    mesh.surface(
      [-HALF_SPAN, -INBOARD, 0, INBOARD, HALF_SPAN].map(z => {
        const { le, te, y, thickness } = wingAt(z);
        return { le: new THREE.Vector3(le, y, z), te: new THREE.Vector3(te, y, z), thickness };
      }),
      up,
      colors.wing
    );

    // Struts from the wing down to the lower fuselage
    [-1, 1].forEach(side => {
      const z = side * 3.3;
      const top = new THREE.Vector3(1.25, wingAt(z).y - 0.08, z);
      mesh.strut(top, new THREE.Vector3(0.95, -0.5, side * 0.56), 0.16, 0.05, colors.wing);
    });

    mesh.surface(
      [-1.8, 0, 1.8].map(z => {
        const t = Math.abs(z) / 1.8;
        return {
          le: new THREE.Vector3(THREE.MathUtils.lerp(-3.45, -3.8, t), 0.38, z),
          te: new THREE.Vector3(THREE.MathUtils.lerp(-4.55, -4.45, t), 0.38, z),
          thickness: THREE.MathUtils.lerp(0.1, 0.06, t),
        };
      }),
      up,
      colors.wing
    );

    // Swept fin with its dorsal fillet, capped in the stripe colour
    mesh.surface(
      [
        {
          le: new THREE.Vector3(-2.5, 0.5, 0),
          te: new THREE.Vector3(-4.6, 0.5, 0),
          thickness: 0.12,
        },
        {
          le: new THREE.Vector3(-3.6, 1.0, 0),
          te: new THREE.Vector3(-4.62, 1.0, 0),
          thickness: 0.1,
        },
        {
          le: new THREE.Vector3(-4.1, 1.75, 0),
          te: new THREE.Vector3(-4.82, 1.75, 0),
          thickness: 0.07,
        },
        {
          le: new THREE.Vector3(-4.3, 2.05, 0),
          te: new THREE.Vector3(-4.9, 2.05, 0),
          thickness: 0.06,
        },
      ],
      new THREE.Vector3(0, 0, 1),
      span => (span === 2 ? colors.stripe : colors.wing)
    );
  }

  private buildGear(mesh: MeshBuilder, colors: Palette): void {
    const wheel = (centre: THREE.Vector3, radius: number) => {
      const halfWidth = new THREE.Vector3(0, 0, 0.07);
      mesh.loft(
        [
          circle(centre.clone().sub(halfWidth), radius, 8, 'z'),
          circle(centre.clone().add(halfWidth), radius, 8, 'z'),
        ],
        () => colors.dark,
        [colors.dark, colors.dark]
      );
    };
    // Wheel fairing around a wheel at x, y, z: a short teardrop, wider at the front
    const fairing = (x: number, y: number, z: number, size: number) => {
      const st: [number, number, number, number][] = [
        [0.37, -0.05, 0.09, 0.04],
        [0.15, -0.23, 0.27, 0.15],
        [-0.3, -0.19, 0.21, 0.13],
        [-0.55, -0.05, 0.07, 0.03],
      ];
      mesh.loft(
        st.map(([dx, b, t, w]) => ring(x + dx * size, y + b * size, y + t * size, w * size, z)),
        () => colors.body,
        [colors.body, colors.body]
      );
    };

    // Main gear: spring-steel legs splayed out from the belly
    [-1, 1].forEach(side => {
      const hub = new THREE.Vector3(0.05, -1.37, side * 1.25);
      mesh.strut(new THREE.Vector3(0.3, -0.55, side * 0.5), hub, 0.1, 0.04, colors.body);
      wheel(hub, 0.26);
      fairing(hub.x, hub.y, hub.z, 1);
    });

    // Nose gear
    const noseHub = new THREE.Vector3(3.5, -1.4, 0);
    mesh.strut(new THREE.Vector3(3.45, -0.5, 0), noseHub, 0.08, 0.06, colors.body);
    wheel(noseHub, 0.22);
    fairing(noseHub.x, noseHub.y, noseHub.z, 0.85);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as CessnaOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as CessnaOptions;

    return {
      name: 'Cessna',
      version: '2.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'general_aviation',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
    };
  }
}

export default Cessna;
