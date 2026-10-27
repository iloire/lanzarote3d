import * as THREE from 'three';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import {
  LowPolyBuilding,
  band,
  block,
  chimney,
  color,
  cylinder,
  flatRoof,
  opening,
  openingRow,
  volume,
  walls,
} from './lowPolyBuilding';

export interface TownhouseOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  trimColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

const DEFAULTS = {
  wallColor: '#FFFACD',
  roofColor: '#DEB887',
  doorColor: '#228B22',
  windowColor: '#4169E1',
  trimColor: '#FFFFFF',
};

const FLOOR = 5.6;
const TANK = new THREE.Color('#2F3437');

/**
 * Townhouse - a narrow three-storey town house with a flat roof behind a parapet
 *
 * ULTRA_LOW is just the block and roof. LOW adds the door and a grid of front windows. MEDIUM
 * frames them and adds a cornice, string course, plinth, doorstep, rear windows and a chimney.
 * HIGH adds shutters in the door colour, a first-floor balcony and a rooftop water tank.
 */
export class Townhouse extends LowPolyBuilding {
  constructor(options: TownhouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Townhouse',
      version: '3.0.0',
      description: 'Narrow three-storey town house with a flat roof. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'urban', 'multi-story', 'residential', 'lod'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const options = this.options as TownhouseOptions;
    const wall = color(options.wallColor, DEFAULTS.wallColor);
    const roof = color(options.roofColor, DEFAULTS.roofColor);
    const door = color(options.doorColor, DEFAULTS.doorColor);
    const glass = color(options.windowColor, DEFAULTS.windowColor);
    const trim = color(options.trimColor, DEFAULTS.trimColor);

    const framed = detail >= LevelOfDetail.MEDIUM;
    const shuttered = detail >= LevelOfDetail.HIGH;
    const window = {
      pane: glass,
      frame: framed ? trim : undefined,
      frameWidth: 0.3,
    };
    const upper = { ...window, shutters: shuttered ? door : undefined };

    const body = volume(0, 0, 12, 15, 0, 3 * FLOOR + 0.8);
    walls(mesh, body, wall);
    flatRoof(mesh, body, roof);

    // From afar a building is its massing and roof; openings start at LOW
    if (detail === LevelOfDetail.ULTRA_LOW) return;

    // Front: door between two windows, then two floors of three
    opening(mesh, body, '+z', 0, 0, 2.4, 4.2, { pane: door, frame: framed ? trim : undefined });
    [-3.8, 3.8].forEach(u => opening(mesh, body, '+z', u, 1.6, 1.8, 2.4, window));
    [1, 2].forEach(floor =>
      openingRow(mesh, body, '+z', 3, floor * FLOOR + 1.4, 1.8, 2.8, upper, 1.2)
    );

    if (detail < LevelOfDetail.MEDIUM) return;

    [0, 1, 2].forEach(floor =>
      openingRow(mesh, body, '-z', floor === 0 ? 2 : 3, floor * FLOOR + 1.4, 1.8, 2.6, window, 1.2)
    );
    band(mesh, body, 3 * FLOOR - 0.6, 0.6, trim); // cornice
    band(mesh, body, FLOOR - 0.2, 0.4, trim); // string course
    band(mesh, body, 0, 0.8, wall.clone().multiplyScalar(0.8)); // plinth
    block(mesh, volume(0, body.z1 + 0.6, 3.4, 1.2, 0, 0.4), trim); // doorstep
    chimney(mesh, -3.5, -5, 3 * FLOOR, 2.2, wall);

    if (detail < LevelOfDetail.HIGH) return;

    // First-floor balcony on the front, railed in trim
    const z = body.z1 + 0.7;
    block(mesh, volume(0, z, 6.4, 1.4, FLOOR, FLOOR + 0.3), trim);
    block(mesh, volume(0, z + 0.65, 6.4, 0.1, FLOOR + 0.3, FLOOR + 1.3), trim);
    [-3.15, 3.15].forEach(x => block(mesh, volume(x, z, 0.1, 1.4, FLOOR + 0.3, FLOOR + 1.3), trim));

    // Rooftop water tank on legs
    cylinder(mesh, 2.8, -3.5, 1.2, 3 * FLOOR + 0.6, 3 * FLOOR + 2.4, TANK);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as TownhouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as TownhouseOptions;

    return {
      name: 'Townhouse',
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

export default Townhouse;
