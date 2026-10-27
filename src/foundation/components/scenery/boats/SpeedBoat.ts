import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';
import { MeshBuilder, lowPolyMaterial, ring } from '../../base/lowPolyMesh';
import { STAINLESS, Station, buildHull, buildRails, hullAt } from './lowPolyHull';

export interface SpeedBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  accentColor?: string;
  engineColor?: string;
  scale?: number;
}

const DEFAULTS = {
  hullColor: '#FF4500',
  accentColor: '#FFFFFF',
  engineColor: '#333333',
};

const BLACK = new THREE.Color('#111111');
const COCKPIT = new THREE.Color('#4B5563');
const CUSHION = new THREE.Color('#E7E0D0');
const GLASS = new THREE.Color('#1E3A4F');

// Stern to bow: a deep-V planing hull, low aft and rising to a sharp entry
const STATIONS: Station[] = [
  { x: -8, deck: 1.3, keel: -0.6, beam: 2.6 },
  { x: -3, deck: 1.35, keel: -0.75, beam: 2.8 },
  { x: 3, deck: 1.5, keel: -0.7, beam: 2.6 },
  { x: 7, deck: 1.8, keel: -0.3, beam: 1.7 },
  { x: 10, deck: 2.1, keel: 0.5, beam: 0.05 },
];
const COCKPIT_SPANS = 2; // the first two spans are the open cockpit

/**
 * Sport speedboat, built low poly: a deep-V hull in the hull colour with a black racing stripe
 * and white bottom, an open cockpit behind a wraparound windscreen, helm console, bucket seats and
 * a stern bench, bow rails, and twin outboards on the transom. One flat-shaded, vertex-coloured
 * mesh. Bow points +X before the quarter turn that aligns it with the movement's forward axis.
 */
export class SpeedBoat extends MovableBoatComponent {
  constructor(options: SpeedBoatOptions = {}) {
    super(
      {
        name: 'SpeedBoat',
        version: '2.0.0',
        description: 'Speed boat with realistic floating animation and optional movement',
      },
      {
        ...DEFAULTS,
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.15,
        radius: 300,
        forwardAxis: '-z', // The bow points along −z after the model's quarter turn
        faceDirection: false, // FORWARD pattern handles its own rotation
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const options = this.options as SpeedBoatOptions;
    const hull = new THREE.Color(options.hullColor ?? DEFAULTS.hullColor);
    const accent = new THREE.Color(options.accentColor ?? DEFAULTS.accentColor);
    const engine = new THREE.Color(options.engineColor ?? DEFAULTS.engineColor);
    const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

    const mesh = new MeshBuilder();
    buildHull(mesh, STATIONS, {
      sheer: accent,
      topside: hull,
      boot: BLACK,
      bottom: accent,
      deck: span => (span < COCKPIT_SPANS ? COCKPIT : accent),
    });

    // Helm console with the wraparound windscreen ahead of it
    const deckAt = (x: number) => hullAt(STATIONS, x).deck;
    mesh.box(0.2, 1.8, deckAt(1), 2.5, 0.75, 0.9, accent);
    mesh.box(1.0, 1.7, 2.5, 2.65, 0.6, 0.9, BLACK); // dash
    const screen = [-2.3, -1.0, 1.0, 2.3].map((z, i) => {
      const x = i === 0 || i === 3 ? 2.1 : 3.0;
      return { base: v(x, deckAt(x), z), top: v(x - 0.55, deckAt(x) + 1.0, z * 0.95) };
    });
    screen.slice(0, -1).forEach((a, i) => {
      const b = screen[i + 1]!;
      mesh.quad(a.base, b.base, b.top, a.top, GLASS);
    });

    // Bucket seats behind the console and a bench across the stern
    [-1.1, 1.1].forEach(z => {
      mesh.box(-1.4, -0.3, 1.3, 1.95, 0.5, z, CUSHION);
      mesh.box(-1.6, -1.3, 1.3, 2.7, 0.5, z, CUSHION);
    });
    mesh.box(-7.6, -6.2, 1.3, 1.95, 2.2, 0, CUSHION);
    mesh.box(-7.9, -7.5, 1.3, 2.6, 2.3, 0, CUSHION);

    buildRails(mesh, STATIONS, [4, 6, 8], 0.55, STAINLESS);

    // Twin outboards: cowl, leg and skeg hanging off the transom
    [-1, 1].forEach(side => {
      const z = side * 1.0;
      mesh.loft(
        [
          ring(-8.0, 1.2, 2.5, 0.42, z),
          ring(-8.9, 1.35, 2.6, 0.38, z),
          ring(-9.3, 1.6, 2.4, 0.2, z),
        ],
        () => engine,
        [engine, engine]
      );
      mesh.box(-8.9, -8.3, -0.7, 1.3, 0.13, z, engine);
      mesh.box(-9.0, -8.2, -0.75, -0.6, 0.18, z, engine); // cavitation plate
      mesh.rod(v(-8.4, -0.55, z), v(-8.5, -0.55, z), 0.22, BLACK, 3); // propeller hub
    });

    const speedboat = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    speedboat.name = 'SpeedBoat';

    // Rotate 90 degrees to align with forward axis
    speedboat.rotateY(Math.PI / 2);

    return speedboat;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as SpeedBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as SpeedBoatOptions;

    return {
      name: 'SpeedBoat',
      version: '2.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      accentColor: options.accentColor,
      engineColor: options.engineColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

export default SpeedBoat;
