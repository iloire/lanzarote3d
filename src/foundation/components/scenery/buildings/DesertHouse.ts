import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import {
  LowPolyBuilding,
  block,
  chimney,
  color,
  flatRoof,
  opening,
  palm,
  volume,
  walls,
} from './lowPolyBuilding';

export interface DesertHouseOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  accentColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

export const DESERT_HOUSE_DEFAULTS = {
  wallColor: '#F5DEB3',
  roofColor: '#DEB887',
  doorColor: '#8B4513',
  windowColor: '#4682B4',
  accentColor: '#D2691E',
};

/**
 * The Lanzarote house, shared with DesertHouseWithPool: two flat-roofed cubes behind parapets, the
 * main one taller with a lower annexe to the side. ULTRA_LOW is just those. LOW adds the door,
 * front windows and the island's white chimney. MEDIUM frames the windows in the accent colour and
 * adds rear and side windows and a courtyard wall with a gate. HIGH adds a pergola over the annexe
 * door and a palm in the courtyard.
 */
export const buildDesertHouse = (
  mesh: MeshBuilder,
  options: DesertHouseOptions,
  detail: LevelOfDetail
): void => {
  const wall = color(options.wallColor, DESERT_HOUSE_DEFAULTS.wallColor);
  const roof = color(options.roofColor, DESERT_HOUSE_DEFAULTS.roofColor);
  const door = color(options.doorColor, DESERT_HOUSE_DEFAULTS.doorColor);
  const glass = color(options.windowColor, DESERT_HOUSE_DEFAULTS.windowColor);
  const accent = color(options.accentColor, DESERT_HOUSE_DEFAULTS.accentColor);
  const framed = detail >= LevelOfDetail.MEDIUM;
  const window = { pane: glass, frame: framed ? accent : undefined, frameWidth: 0.35 };

  const main = volume(-2, 0, 14, 16, 0, 11);
  const annexe = volume(7.5, -1, 5, 10, 0, 7.5);
  walls(mesh, main, wall);
  walls(mesh, annexe, wall);
  flatRoof(mesh, main, roof);
  flatRoof(mesh, annexe, roof, 0.6);

  // From afar a building is its massing and roof; openings start at LOW
  if (detail === LevelOfDetail.ULTRA_LOW) return;

  opening(mesh, main, '+z', 2.5, 0, 2.2, 4.2, { pane: door, frame: framed ? accent : undefined });
  opening(mesh, main, '+z', -3.5, 2.8, 2.2, 2.2, window);
  opening(mesh, annexe, '+z', 0, 2.4, 1.6, 1.8, window);
  chimney(mesh, -6.5, -5, 10.2, 2.4, wall);

  if (detail < LevelOfDetail.MEDIUM) return;

  [-4, 2].forEach(u => opening(mesh, main, '-z', u, 2.8, 2, 2, window));
  opening(mesh, main, '-x', 2, 2.8, 2, 2, window);
  opening(mesh, annexe, '+x', 0, 2.4, 1.6, 1.8, window);

  // Courtyard wall across the front, with a gate opposite the door
  const z = main.z1 + 5;
  block(mesh, volume(-5, z, 8, 0.6, 0, 2.2), wall);
  block(mesh, volume(6, z, 8, 0.6, 0, 2.2), wall);
  [main.x0 + 0.3, annexe.x1 - 0.3].forEach(x =>
    block(mesh, volume(x, (main.z1 + z) / 2, 0.6, 5, 0, 2.2), wall)
  );

  if (detail < LevelOfDetail.HIGH) return;

  // Pergola shading the annexe front
  const pz = annexe.z1 + 1.8;
  [annexe.x0 + 0.4, annexe.x1 - 0.4].forEach(x =>
    block(mesh, volume(x, pz + 1.4, 0.3, 0.3, 0, 5.2), accent)
  );
  [-1.2, 0, 1.2].forEach(dz =>
    block(
      mesh,
      volume((annexe.x0 + annexe.x1) / 2, pz + dz, annexe.x1 - annexe.x0, 0.25, 5.2, 5.45),
      accent
    )
  );

  palm(mesh, -6, main.z1 + 2.6, 7.5);
};

/**
 * DesertHouse - the whitewashed, flat-roofed Lanzarote house; see buildDesertHouse
 */
export class DesertHouse extends LowPolyBuilding {
  constructor(options: DesertHouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DesertHouse',
      version: '3.0.0',
      description: 'Flat-roofed Lanzarote house with a white chimney. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'desert', 'lanzarote', 'residential', 'lod'],
    };

    super(metadata, {
      ...DESERT_HOUSE_DEFAULTS,
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    buildDesertHouse(mesh, this.options as DesertHouseOptions, detail);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DesertHouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as DesertHouseOptions;

    return {
      name: 'DesertHouse',
      version: '3.0.0',
      type: 'building',
      subtype: 'residential',
      levelOfDetail: LevelOfDetail[this.currentLOD],
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default DesertHouse;
