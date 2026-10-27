import * as THREE from 'three';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder, circle } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import { LowPolyBuilding, block, color, cylinder, volume } from './lowPolyBuilding';

export interface RoundBungalowOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  accentColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

export const ROUND_BUNGALOW_DEFAULTS = {
  wallColor: '#F5F3EC',
  roofColor: '#DCD6C8',
  accentColor: '#2F6DB5',
};

const GLASS = new THREE.Color('#2B3A45');

/**
 * A round room: a ring of wall rising to a parapet, the flat roof just below its top. The
 * material is double-sided, so the parapet's inner face shows from above for free.
 */
const roundRoom = (
  mesh: MeshBuilder,
  cx: number,
  cz: number,
  radius: number,
  height: number,
  wall: THREE.Color,
  roof: THREE.Color,
  sides: number
) => {
  cylinder(mesh, cx, cz, radius, -1, height, wall, sides, false);
  mesh.cap(circle(new THREE.Vector3(cx, height - 0.4, cz), radius, sides, 'y'), roof);
};

/** A flat panel on the curve of a round room, centred at `angle` (0 is +z, the front) */
const curvedPanel = (
  mesh: MeshBuilder,
  cx: number,
  cz: number,
  radius: number,
  angle: number,
  y0: number,
  w: number,
  h: number,
  c: THREE.Color
) => {
  const out = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const along = new THREE.Vector3(out.z, 0, -out.x).multiplyScalar(w / 2);
  const centre = new THREE.Vector3(cx, 0, cz).addScaledVector(out, radius + 0.15);
  const p = (s: number, y: number) => centre.clone().addScaledVector(along, s).setY(y);
  mesh.quad(p(-1, y0), p(1, y0), p(1, y0 + h), p(-1, y0 + h), c);
};

/**
 * The bungalows of Urbanización Famara, the 1970s "Noruegos" village behind the beach: whitewashed
 * round rooms under flat roofs, a big one and a smaller one joined by a short wall. ULTRA_LOW,
 * what the towns use, is only the two drums and their roofs. LOW adds the door and windows in
 * the accent colour, MEDIUM a low curved terrace wall.
 */
export const buildRoundBungalow = (
  mesh: MeshBuilder,
  options: RoundBungalowOptions,
  detail: LevelOfDetail
): void => {
  const wall = color(options.wallColor, ROUND_BUNGALOW_DEFAULTS.wallColor);
  const roof = color(options.roofColor, ROUND_BUNGALOW_DEFAULTS.roofColor);
  const accent = color(options.accentColor, ROUND_BUNGALOW_DEFAULTS.accentColor);
  const sides = detail === LevelOfDetail.ULTRA_LOW ? 8 : 12;

  roundRoom(mesh, 0, 0, 6, 4, wall, roof, sides);
  roundRoom(mesh, 7.6, -2.6, 4, 3.4, wall, roof, sides);
  block(mesh, volume(4.4, -1, 3.6, 4.4, -1, 2.9), wall);

  if (detail === LevelOfDetail.ULTRA_LOW) return;

  curvedPanel(mesh, 0, 0, 6, 0.25, 0, 1.4, 2.3, accent);
  [-0.6, -1.4].forEach(a => curvedPanel(mesh, 0, 0, 6, a, 1.1, 1.3, 1.2, GLASS));
  curvedPanel(mesh, 7.6, -2.6, 4, 1.2, 1.1, 1.1, 1, GLASS);

  if (detail < LevelOfDetail.MEDIUM) return;

  // A low terrace wall curving round the front of the big room
  const terrace = circle(new THREE.Vector3(0, 0, 0), 8.5, sides, 'y');
  // circle() starts at +x; a quarter turn on is the front
  for (let i = sides / 4 - 2; i < sides / 4 + 2; i++) {
    const [a, b] = [terrace[i]!, terrace[i + 1]!];
    mesh.quad(a, b, b.clone().setY(1), a.clone().setY(1), wall);
  }
};

/** RoundBungalow - the round, flat-roofed bungalow of Urbanización Famara; see buildRoundBungalow */
export class RoundBungalow extends LowPolyBuilding {
  constructor(options: RoundBungalowOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'RoundBungalow',
      version: '1.0.0',
      description: 'Round, flat-roofed Famara bungalow. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'lanzarote', 'famara', 'residential', 'lod'],
    };

    super(metadata, { ...ROUND_BUNGALOW_DEFAULTS, scale: 1, ...options });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    buildRoundBungalow(mesh, this.options as RoundBungalowOptions, detail);
  }
}

export default RoundBungalow;
