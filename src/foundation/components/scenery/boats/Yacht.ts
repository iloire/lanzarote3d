import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';
import { BOX, MeshBuilder, glassColor, lowPolyMaterial, ring } from '../../base/lowPolyMesh';
import {
  ANTIFOULING,
  STAINLESS,
  Station,
  TEAK,
  WINDOWED,
  SEG_WINDOWS,
  buildHull,
  buildRails,
  hullAt,
} from './lowPolyHull';

export interface YachtOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  trimColor?: string;
  glassColor?: string;
  scale?: number;
}

const DEFAULTS = {
  hullColor: '#F5F5F5',
  trimColor: '#4169E1',
  glassColor: '#87CEEB',
};

const DARK = new THREE.Color('#1F2937');
const CUSHION = new THREE.Color('#E7E0D0');

// Stern to bow: a 30 m motor yacht with a long foredeck and a raked, flared bow
const STATIONS: Station[] = [
  { x: -15, deck: 3.0, keel: -1.3, beam: 4.2 },
  { x: -8, deck: 3.0, keel: -1.8, beam: 4.6 },
  { x: 4, deck: 3.3, keel: -1.8, beam: 4.4 },
  { x: 10, deck: 4.0, keel: -1.0, beam: 3.0 },
  { x: 15, deck: 4.8, keel: 1.0, beam: 0.1 },
];
// Long dark hull windows on the topsides: x from, x to
const HULL_WINDOWS: [number, number][] = [
  [-6, -1.5],
  [0, 4],
];

/**
 * Motor yacht, built low poly: a white hull with a trim-coloured boot stripe and dark hull
 * windows, a teak aft deck and swim platform, a glazed saloon, a flybridge deck edged in the trim
 * colour carrying the helm station under a hardtop with radar mast, a bow sunpad and guard rails
 * all round. One flat-shaded, vertex-coloured mesh. Bow points +X before the quarter turn that
 * aligns it with the movement's forward axis.
 */
export class Yacht extends MovableBoatComponent {
  constructor(options: YachtOptions = {}) {
    super(
      {
        name: 'Yacht',
        version: '2.0.0',
        description: 'Luxury yacht with realistic floating animation and optional movement',
      },
      {
        ...DEFAULTS,
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.1,
        radius: 250,
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
    const options = this.options as YachtOptions;
    const hull = new THREE.Color(options.hullColor ?? DEFAULTS.hullColor);
    const trim = new THREE.Color(options.trimColor ?? DEFAULTS.trimColor);
    const glass = glassColor(options.glassColor ?? DEFAULTS.glassColor);
    const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
    const deckAt = (x: number) => hullAt(STATIONS, x).deck;

    const mesh = new MeshBuilder();
    buildHull(mesh, STATIONS, {
      sheer: hull,
      topside: hull,
      boot: trim,
      bottom: ANTIFOULING,
      deck: span => (span === 0 ? TEAK : hull),
    });
    [-1, 1].forEach(side => {
      HULL_WINDOWS.forEach(([x0, x1]) => {
        const z = (x: number) => side * (hullAt(STATIONS, x).beam * 0.985 + 0.03);
        mesh.quad(
          v(x0, 1.5, z(x0)),
          v(x1, 1.5, z(x1)),
          v(x1, 1.85, z(x1)),
          v(x0, 1.85, z(x0)),
          DARK
        );
      });
    });
    mesh.box(-16, -15, 0.35, 0.65, 3.8, 0, TEAK); // swim platform

    // Saloon: glazed above the window line, aft doors and raked windscreen glass
    mesh.loft(
      [
        ring(-11, 2.9, 6.0, 3.7, 0, WINDOWED),
        ring(3.5, 3.1, 6.0, 3.5, 0, WINDOWED),
        ring(7.0, 3.4, 5.0, 2.6, 0, WINDOWED),
      ],
      (_, k) => (SEG_WINDOWS.includes(k) ? glass : hull),
      [glass, glass]
    );

    // Flybridge deck, its edge in the trim colour, with the helm station under a hardtop
    mesh.loft(
      [ring(-12.5, 6.0, 6.45, 3.9, 0, BOX), ring(4.5, 6.0, 6.45, 3.7, 0, BOX)],
      (_, k) => (k === 3 ? hull : trim),
      [trim, trim]
    );
    mesh.loft(
      [
        ring(-5, 6.45, 8.3, 2.7, 0, WINDOWED),
        ring(1.5, 6.45, 8.3, 2.7, 0, WINDOWED),
        ring(2.8, 6.45, 7.6, 2.4, 0, WINDOWED),
      ],
      (_, k) => (SEG_WINDOWS.includes(k) ? glass : hull),
      [hull, glass]
    );
    mesh.box(-6, 2.5, 8.3, 8.6, 3.0, 0, hull);
    mesh.rod(v(-4.5, 8.6), v(-4.5, 11.2), 0.15, hull);
    mesh.box(-4.8, -4.2, 11.2, 11.4, 1.4, 0, DARK); // radar
    mesh.box(-3.9, -3.3, 8.6, 9.1, 0.3, 0, DARK); // satellite dome

    // Bow sunpad and guard rails
    mesh.box(7.5, 11, deckAt(9.25) - 0.1, deckAt(9.25) + 0.35, 1.6, 0, CUSHION);
    buildRails(mesh, STATIONS, [-14, -10, -6, -2, 2, 6, 10, 13], 1.0, STAINLESS);

    const yacht = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    yacht.name = 'Yacht';

    // Rotate 90 degrees to align with forward axis
    yacht.rotateY(Math.PI / 2);

    return yacht;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as YachtOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as YachtOptions;

    return {
      name: 'Yacht',
      version: '2.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      trimColor: options.trimColor,
      glassColor: options.glassColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

export default Yacht;
