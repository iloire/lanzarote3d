import * as THREE from 'three';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import {
  Face,
  LowPolyBuilding,
  Volume,
  block,
  color,
  cone,
  cylinder,
  opening,
  openingRow,
  panel,
  strip,
  volume,
  walls,
} from './lowPolyBuilding';

export interface BarnOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  trimColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

const DEFAULTS = {
  wallColor: '#F5DEB3',
  roofColor: '#DEB887',
  doorColor: '#654321',
  trimColor: '#FFFFFF',
};

const PANE = new THREE.Color('#2B2B2B');
const HAY = new THREE.Color('#D9B65D');
const EAVE = 11;
const KNEE = { inset: 2.5, y: 17 };
const RIDGE = 20.5;

/**
 * A gambrel roof over a volume, ridge along z: steep lower slopes to a knee, shallow upper ones to
 * the ridge, closed at both ends by pentagonal gables in the wall colour
 */
const gambrelRoof = (
  mesh: MeshBuilder,
  v: Volume,
  overhang: number,
  roof: THREE.Color,
  gable: THREE.Color
) => {
  const xm = (v.x0 + v.x1) / 2;
  const profile = [
    [v.x0, EAVE],
    [v.x0 + KNEE.inset, KNEE.y],
    [xm, RIDGE],
    [v.x1 - KNEE.inset, KNEE.y],
    [v.x1, EAVE],
  ];
  const at = (i: number, z: number) => new THREE.Vector3(profile[i]![0], profile[i]![1], z);
  const [za, zb] = [v.z0 - overhang, v.z1 + overhang];
  for (let i = 0; i < profile.length - 1; i++) {
    mesh.quad(at(i, za), at(i + 1, za), at(i + 1, zb), at(i, zb), roof);
  }
  [v.z0, v.z1].forEach(z => {
    for (let i = 1; i < profile.length - 1; i++) mesh.tri(at(0, z), at(i, z), at(i + 1, z), gable);
  });
};

/**
 * Barn - a gambrel-roofed barn with big doors in its front gable
 *
 * ULTRA_LOW is just the walls and roof. LOW adds the double door and hayloft door. MEDIUM frames
 * them in the trim colour with X braces and adds windows down both sides. HIGH adds a silo and
 * hay bales.
 */
export class Barn extends LowPolyBuilding {
  constructor(options: BarnOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Barn',
      version: '3.0.0',
      description: 'Gambrel-roofed barn with gable doors. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'rural', 'agricultural', 'traditional', 'lod'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const options = this.options as BarnOptions;
    const wall = color(options.wallColor, DEFAULTS.wallColor);
    const roof = color(options.roofColor, DEFAULTS.roofColor);
    const door = color(options.doorColor, DEFAULTS.doorColor);
    const trim = color(options.trimColor, DEFAULTS.trimColor);
    const framed = detail >= LevelOfDetail.MEDIUM;

    const body = volume(0, 0, 20, 30, 0, EAVE);
    walls(mesh, body, wall);
    gambrelRoof(mesh, body, 0.8, roof, wall);

    // From afar a building is its massing and roof; openings start at LOW
    if (detail === LevelOfDetail.ULTRA_LOW) return;

    const front: Face = '+z';
    opening(mesh, body, front, 0, 0, 8, 8.5, { pane: door, frame: framed ? trim : undefined });
    opening(mesh, body, front, 0, 12.5, 3, 3.5, { pane: door, frame: framed ? trim : undefined });

    if (detail < LevelOfDetail.MEDIUM) return;

    // X braces across each leaf of the double door, and the split between them
    [-2, 2].forEach(u => {
      strip(mesh, body, front, [u - 1.8, 0.3], [u + 1.8, 8.2], 0.35, trim);
      strip(mesh, body, front, [u + 1.8, 0.3], [u - 1.8, 8.2], 0.35, trim);
    });
    panel(mesh, body, front, 0, 0, 0.3, 8.5, trim, 0.3);
    (['+x', '-x'] as Face[]).forEach(face =>
      openingRow(
        mesh,
        body,
        face,
        4,
        5.5,
        1.8,
        2.2,
        { pane: PANE, frame: trim, frameWidth: 0.3 },
        3
      )
    );

    if (detail < LevelOfDetail.HIGH) return;

    // Silo with a conical cap beside the barn, and hay bales by the door
    cylinder(mesh, 14, -8, 3.2, 0, 21, wall.clone().multiplyScalar(0.9), 8, false);
    cone(mesh, 14, -8, 3.5, 21, 3, roof, 8);
    [
      [-7, 19, 0],
      [-4.8, 19.4, 0],
      [-6, 19.2, 1.4],
    ].forEach(([x, z, y]) => block(mesh, volume(x!, z!, 2, 1.4, y!, y! + 1.4), HAY));
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as BarnOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as BarnOptions;

    return {
      name: 'Barn',
      version: '3.0.0',
      type: 'building',
      subtype: 'agricultural',
      levelOfDetail: LevelOfDetail[this.currentLOD],
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default Barn;
