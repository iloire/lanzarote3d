import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import {
  LowPolyBuilding,
  block,
  chimney,
  color,
  cylinder,
  flatRoof,
  hipRoof,
  opening,
  openingRow,
  palm,
  volume,
  walls,
} from './lowPolyBuilding';

export interface VillaOptions extends SimpleComponentOptions {
  wallColor?: string;
  accentColor?: string;
  roofColor?: string;
  windowColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

const DEFAULTS = {
  wallColor: '#F5F5DC',
  accentColor: '#8B4513',
  roofColor: '#DEB887',
  windowColor: '#000080',
};

const GROUND = 9.5;

/**
 * Villa - a broad ground floor with a roof terrace, and a hip-roofed upper floor set back on it
 *
 * ULTRA_LOW is both floors and their roofs; the ground floor's parapet walls in the terrace. LOW
 * adds the front door, picture windows and upper windows. MEDIUM frames them and adds rear and
 * side windows and a chimney. HIGH adds a columned portico over the door, a front terrace,
 * shutters and two palms.
 */
export class Villa extends LowPolyBuilding {
  constructor(options: VillaOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Villa',
      version: '3.0.0',
      description: 'Two-storey villa with a roof terrace and hipped roof. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'luxury', 'residential', 'lod'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const options = this.options as VillaOptions;
    const wall = color(options.wallColor, DEFAULTS.wallColor);
    const accent = color(options.accentColor, DEFAULTS.accentColor);
    const roof = color(options.roofColor, DEFAULTS.roofColor);
    const glass = color(options.windowColor, DEFAULTS.windowColor);
    const framed = detail >= LevelOfDetail.MEDIUM;
    const window = { pane: glass, frame: framed ? wall.clone().multiplyScalar(0.85) : undefined };
    const shuttered = { ...window, shutters: detail >= LevelOfDetail.HIGH ? accent : undefined };

    // Ground floor, flat-roofed as a terrace; the upper floor stands back on it under a hipped roof
    const ground = volume(0, 0, 30, 22, 0, GROUND + 0.9);
    const upper = volume(-4, -3, 18, 14, GROUND, GROUND + 7.5);
    walls(mesh, ground, wall);
    flatRoof(mesh, ground, roof.clone().lerp(wall, 0.5), 0.9);
    walls(mesh, upper, wall);
    hipRoof(mesh, upper, 4.5, 1.2, roof);

    // From afar a building is its massing and roof; openings start at LOW
    if (detail === LevelOfDetail.ULTRA_LOW) return;

    opening(mesh, ground, '+z', 8, 0, 3.2, 6, { pane: accent, frame: window.frame });
    [-10, -3].forEach(u => opening(mesh, ground, '+z', u, 1.6, 5, 4.6, window));
    openingRow(mesh, upper, '+z', 3, GROUND + 2.2, 2.6, 3.4, shuttered, 2.5);

    if (detail < LevelOfDetail.MEDIUM) return;

    openingRow(mesh, ground, '-z', 4, 2, 3, 3.6, window, 2.5);
    openingRow(mesh, upper, '-z', 3, GROUND + 2.2, 2.6, 3.4, window, 2.5);
    [-1, 1].forEach(side => opening(mesh, ground, side < 0 ? '-x' : '+x', 0, 2, 3, 3.6, window));
    chimney(mesh, upper.x1 - 3, upper.z0 + 3, upper.y1, 4.5, wall);

    if (detail < LevelOfDetail.HIGH) return;

    // Portico of four columns carrying a slab over the front door, on a terrace
    const z = ground.z1 + 3.5;
    block(mesh, volume(0, z - 0.5, 30, 6, 0, 0.4), accent.clone().lerp(wall, 0.6));
    block(mesh, volume(8, z, 9, 6, 6.6, 7.2), wall);
    [4.5, 11.5].forEach(x =>
      [z - 2.4, z + 2.4].forEach(cz => cylinder(mesh, x, cz, 0.45, 0.4, 6.6, wall, 6, false))
    );
    palm(mesh, -13, ground.z1 + 8, 9);
    palm(mesh, 13.5, ground.z1 + 9, 8);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as VillaOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as VillaOptions;

    return {
      name: 'Villa',
      version: '3.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'luxury',
      levelOfDetail: LevelOfDetail[this.currentLOD],
      wallColor: options.wallColor,
      accentColor: options.accentColor,
      scale: options.scale,
    };
  }
}

export default Villa;
