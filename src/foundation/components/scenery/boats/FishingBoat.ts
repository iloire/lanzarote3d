import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';
import { MeshBuilder, lowPolyMaterial, ring } from '../../base/lowPolyMesh';
import { ANTIFOULING, Station, WINDOWED, SEG_WINDOWS, buildHull, hullAt } from './lowPolyHull';

export interface FishingBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  cabinColor?: string;
  mastColor?: string;
  scale?: number;
}

const DEFAULTS = {
  hullColor: '#1F5F8B',
  cabinColor: '#FFFFFF',
  mastColor: '#D1D5DB',
};

const WHITE = new THREE.Color('#F4F4F0');
const DECK = new THREE.Color('#9C8B70');
const GLASS = new THREE.Color('#1F2937');
const ORANGE = new THREE.Color('#F97316');
const BLUE = new THREE.Color('#2563EB');
const NETS = new THREE.Color('#5B6B4E');
// Fish crates on the aft deck: x, z, tier, colour
const CRATES: [number, number, number, THREE.Color][] = [
  [-7.4, -1.2, 0, ORANGE],
  [-7.4, 0.1, 0, BLUE],
  [-6.0, -1.2, 0, BLUE],
  [-7.4, -0.55, 1, ORANGE],
];

// Stern to bow: a beamy 20 m trawler, its sheer climbing to a high flared bow
const STATIONS: Station[] = [
  { x: -10, deck: 2.0, keel: -1.0, beam: 3.0 },
  { x: -6, deck: 2.0, keel: -1.6, beam: 3.5 },
  { x: 2, deck: 2.2, keel: -1.6, beam: 3.5 },
  { x: 6.5, deck: 2.6, keel: -1.2, beam: 2.6 },
  { x: 10, deck: 3.3, keel: 0.4, beam: 0.1 },
];
const BULWARK = 0.7;
const MAST_X = -1.2;

/**
 * Canarian fishing boat, built low poly: a blue hull with white sheer and boot stripes, bulwarks
 * round a working deck, a wheelhouse forward with a window band under an overhanging roof, a mast
 * with radar and trawl booms, an A-frame gantry at the stern and fish crates stacked aft. One
 * flat-shaded, vertex-coloured mesh. Bow points +X before the quarter turn that aligns it with
 * the movement's forward axis.
 */
export class FishingBoat extends MovableBoatComponent {
  constructor(options: FishingBoatOptions = {}) {
    super(
      {
        name: 'FishingBoat',
        version: '2.0.0',
        description: 'Fishing boat with realistic floating animation and optional movement',
      },
      {
        ...DEFAULTS,
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: false,
        pattern: MovementPattern.PATROL,
        speed: 0.4,
        radius: 120,
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const options = this.options as FishingBoatOptions;
    const hull = new THREE.Color(options.hullColor ?? DEFAULTS.hullColor);
    const cabin = new THREE.Color(options.cabinColor ?? DEFAULTS.cabinColor);
    const mast = new THREE.Color(options.mastColor ?? DEFAULTS.mastColor);
    const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

    const mesh = new MeshBuilder();
    buildHull(mesh, STATIONS, {
      sheer: WHITE,
      topside: hull,
      boot: WHITE,
      bottom: ANTIFOULING,
      deck: DECK,
    });

    // Bulwarks: a wall standing on each deck edge, capped white
    [-1, 1].forEach(side => {
      STATIONS.slice(0, -1).forEach((a, i) => {
        const b = STATIONS[i + 1]!;
        const [za, zb] = [side * a.beam, side * b.beam];
        mesh.quad(
          v(a.x, a.deck, za),
          v(b.x, b.deck, zb),
          v(b.x, b.deck + BULWARK, zb),
          v(a.x, a.deck + BULWARK, za),
          hull
        );
      });
    });
    const stern = STATIONS[0]!;
    mesh.quad(
      v(stern.x, stern.deck, -stern.beam),
      v(stern.x, stern.deck, stern.beam),
      v(stern.x, stern.deck + BULWARK, stern.beam),
      v(stern.x, stern.deck + BULWARK, -stern.beam),
      hull
    );

    // Wheelhouse with a raked front and a band of windows, under an overhanging roof
    mesh.loft(
      [
        ring(0.5, 2.1, 5.4, 2.2, 0, WINDOWED),
        ring(4.2, 2.2, 5.4, 2.1, 0, WINDOWED),
        ring(5.2, 2.4, 4.9, 1.9, 0, WINDOWED),
      ],
      (_, k) => (SEG_WINDOWS.includes(k) ? GLASS : cabin),
      [cabin, GLASS]
    );
    mesh.box(0.2, 5.6, 5.4, 5.75, 2.45, 0, hull);
    mesh.box(2.6, 3.4, 5.75, 6.15, 0.5, 0, mast); // radar pedestal
    mesh.box(2.5, 3.5, 6.15, 6.3, 1.2, 0, GLASS); // radar bar

    // Mast with crosstree, and trawl booms raised in a V
    mesh.rod(v(MAST_X, 2.2), v(MAST_X, 12), 0.18, mast);
    mesh.rod(v(MAST_X, 10, -1.6), v(MAST_X, 10, 1.6), 0.1, mast);
    [-1, 1].forEach(side => {
      const end = v(MAST_X - 0.3, 9.5, side * 6.5);
      mesh.rod(v(MAST_X, 3, side * 0.3), end, 0.12, mast);
      mesh.rod(v(MAST_X, 12), end, 0.03, mast, 3);
    });

    // Stern A-frame gantry
    [-1, 1].forEach(side => mesh.rod(v(-9.2, 2.0, side * 2.6), v(-9.8, 7, side * 1.6), 0.16, mast));
    mesh.rod(v(-9.8, 7, -1.7), v(-9.8, 7, 1.7), 0.16, mast);

    // Fish crates stacked on the aft deck, and a few net floats
    CRATES.forEach(([x, z, tier, color]) => {
      const y = hullAt(STATIONS, x).deck + tier * 0.6;
      mesh.box(x, x + 1.2, y, y + 0.6, 0.6, z, color);
    });
    [-1.6, 0, 1.6].forEach(z => mesh.box(-4.4, -3.8, 2.05, 2.55, 0.3, z, ORANGE));
    mesh.box(-6.2, -4.8, 2.0, 2.45, 1.0, 1.6, NETS);

    const boat = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    boat.name = 'FishingBoat';

    // Rotate 90 degrees to align with forward axis
    boat.rotateY(Math.PI / 2);

    return boat;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as FishingBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as FishingBoatOptions;

    return {
      name: 'FishingBoat',
      version: '2.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      cabinColor: options.cabinColor,
      mastColor: options.mastColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

export default FishingBoat;
