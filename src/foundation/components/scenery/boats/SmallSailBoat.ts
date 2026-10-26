import * as THREE from 'three';
import { MovableBoatComponent, MovableBoatComponentOptions } from '../../base/MovableBoatComponent';
import { MovementPattern } from '../../../systems/behaviors/MovingBehavior';
import { BOX, MeshBuilder, lowPolyMaterial, ring } from '../../base/lowPolyMesh';
import {
  ANTIFOULING,
  STAINLESS,
  Station,
  TEAK,
  WINDOWED,
  SEG_WINDOWS,
  buildHull,
  buildRails,
  buildSail,
} from './lowPolyHull';

export interface SmallSailBoatOptions extends MovableBoatComponentOptions {
  hullColor?: string;
  sailColor?: string;
  scale?: number;
}

const DEFAULTS = {
  hullColor: '#FFFFFF',
  sailColor: '#F4F1EA',
};

const NAVY = new THREE.Color('#1E3A5F');
const SPAR = new THREE.Color('#B8BEC6');
const PORTHOLE = new THREE.Color('#1F2937');

// Stern to bow: a cruiser of 10 with a raked stem and a slightly raised sheer forward
const STATIONS: Station[] = [
  { x: -5, deck: 0.75, keel: -0.35, beam: 1.5 },
  { x: -2, deck: 0.75, keel: -0.6, beam: 1.8 },
  { x: 1, deck: 0.8, keel: -0.6, beam: 1.75 },
  { x: 3.5, deck: 0.95, keel: -0.45, beam: 1.2 },
  { x: 5, deck: 1.1, keel: 0, beam: 0.05 },
];
const MAST_X = 1.6;
const MAST_TOP = 10.6;

/**
 * Small cruising sailboat, built low poly: a navy-striped hull with a teak deck, a coachroof with
 * portlights, a sloop rig of mast, boom, mainsail and jib with stays and shrouds, and guard rails
 * forward. One flat-shaded, vertex-coloured mesh. Bow points +X before the quarter turn that
 * aligns it with the movement's forward axis.
 */
export class SmallSailBoat extends MovableBoatComponent {
  constructor(options: SmallSailBoatOptions = {}) {
    super(
      {
        name: 'SmallSailBoat',
        version: '2.0.0',
        description: 'Small sail boat with realistic floating animation and optional movement',
      },
      {
        ...DEFAULTS,
        scale: 1,
        // Movement defaults - disabled by default, can be enabled via options
        enableMovement: true,
        pattern: MovementPattern.CIRCULAR,
        speed: 0.08,
        radius: 150,
        forwardAxis: 'z', // Boats have bow pointing in +Z direction after rotation
        faceDirection: true, // FORWARD pattern handles its own rotation
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const options = this.options as SmallSailBoatOptions;
    const hull = new THREE.Color(options.hullColor ?? DEFAULTS.hullColor);
    const sail = new THREE.Color(options.sailColor ?? DEFAULTS.sailColor);

    const mesh = new MeshBuilder();
    buildHull(mesh, STATIONS, {
      sheer: NAVY,
      topside: hull,
      boot: NAVY,
      bottom: ANTIFOULING,
      deck: TEAK,
    });

    // Coachroof with a band of portlights
    mesh.loft(
      [
        ring(-1.2, 0.7, 1.35, 0.95, 0, WINDOWED),
        ring(2.0, 0.7, 1.35, 0.95, 0, WINDOWED),
        ring(2.8, 0.75, 1.15, 0.6, 0, WINDOWED),
      ],
      (s, k) => (s === 0 && SEG_WINDOWS.includes(k) ? PORTHOLE : hull),
      [hull, hull]
    );
    // Cockpit coaming aft
    mesh.loft(
      [ring(-4.6, 0.7, 1.05, 1.15, 0, BOX), ring(-1.2, 0.7, 1.05, 1.3, 0, BOX)],
      (_, k) => (k === 3 ? TEAK : hull),
      [hull, hull]
    );

    // Sloop rig
    const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
    mesh.rod(v(MAST_X, 1.3), v(MAST_X, MAST_TOP), 0.09, SPAR);
    mesh.rod(v(MAST_X, 2.1), v(-3.6, 2.1), 0.07, SPAR);
    buildSail(
      mesh,
      v(MAST_X - 0.1, 2.25),
      v(MAST_X - 0.1, MAST_TOP - 0.3),
      v(-3.5, 2.25),
      0.35,
      sail
    );
    buildSail(mesh, v(4.7, 1.3), v(MAST_X + 0.1, MAST_TOP - 2), v(0.5, 1.6, 0.5), 0.45, sail);

    // Forestay, backstay and shrouds
    mesh.rod(v(4.9, 1.15), v(MAST_X, MAST_TOP - 1.8), 0.025, STAINLESS, 3);
    mesh.rod(v(-4.9, 0.8), v(MAST_X, MAST_TOP), 0.025, STAINLESS, 3);
    [-1, 1].forEach(side =>
      mesh.rod(v(MAST_X - 0.3, 0.8, side * 1.7), v(MAST_X, MAST_TOP - 2.5), 0.025, STAINLESS, 3)
    );
    buildRails(mesh, STATIONS, [2.4, 3.6], 0.5, STAINLESS);

    const boat = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    boat.name = 'SmallSailBoat';

    // Rotate 90 degrees to align with forward axis
    boat.rotateY(Math.PI / 2);

    return boat;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as SmallSailBoatOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as SmallSailBoatOptions;

    return {
      name: 'SmallSailBoat',
      version: '2.0.0',
      type: 'boat',
      hullColor: options.hullColor,
      sailColor: options.sailColor,
      scale: options.scale,
      isFloating: this.isFloating(),
    };
  }
}

export default SmallSailBoat;
