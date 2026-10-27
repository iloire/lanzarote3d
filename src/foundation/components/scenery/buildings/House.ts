import * as THREE from 'three';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import {
  Face,
  LowPolyBuilding,
  OpeningStyle,
  Volume,
  block,
  chimney,
  color,
  flatRoof,
  hipRoof,
  opening,
  openingRow,
  volume,
  walls,
} from './lowPolyBuilding';

export enum HouseType {
  Small, // 2 wings
  Medium, // 3 wings
  Large, // 4 wings
  Modern, // 4 wings with modern styling
}

export interface HouseOptions extends SimpleComponentOptions {
  type: HouseType;
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
  roofColor: '#f8f8ff',
  windowColor: '#4169E1',
};

/** A wing's footprint centre, its size (width, wall height, depth) and which way it faces */
interface Wing {
  x: number;
  z: number;
  size: [number, number, number];
  name: 'main' | 'left' | 'right' | 'back';
}

/**
 * House - a two-storey main block with lower wings either side (and behind, for the larger types)
 *
 * Hipped roofs, or flat roofs behind parapets for HouseType.Modern. ULTRA_LOW is the massing: the
 * main block and the side wings as one long block. LOW builds each wing with the door and front
 * windows. MEDIUM frames the windows in the accent colour and adds rear windows, a doorstep and a
 * chimney. HIGH adds shutters, end windows and a porch canopy.
 */
class House extends LowPolyBuilding {
  private type: HouseType;

  constructor(options: HouseOptions = { type: HouseType.Small }) {
    const metadata: ComponentMetadata = {
      name: 'House',
      version: '3.0.0',
      description: 'Two-storey house with 2-4 wings depending on type. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'residential', 'lod'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });

    this.type = options.type;
    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  private getWings(): Wing[] {
    switch (this.type) {
      case HouseType.Small:
        return [
          { x: 0, z: 0, size: [20, 14, 20], name: 'main' },
          { x: -18, z: 0, size: [16, 9, 16], name: 'left' },
        ];
      case HouseType.Medium:
        return [
          { x: 0, z: 0, size: [20, 14, 20], name: 'main' },
          { x: -18, z: 0, size: [16, 9, 16], name: 'left' },
          { x: 18, z: 0, size: [16, 9, 16], name: 'right' },
        ];
      case HouseType.Large:
        return [
          { x: 0, z: 0, size: [22, 15, 22], name: 'main' },
          { x: -20, z: 0, size: [18, 10, 18], name: 'left' },
          { x: 20, z: 0, size: [18, 10, 18], name: 'right' },
          { x: 0, z: -20, size: [16, 9, 16], name: 'back' },
        ];
      case HouseType.Modern:
        return [
          { x: 0, z: 0, size: [24, 15, 24], name: 'main' },
          { x: -22, z: 0, size: [20, 10, 20], name: 'left' },
          { x: 22, z: 0, size: [20, 10, 20], name: 'right' },
          { x: 0, z: -22, size: [18, 9, 18], name: 'back' },
        ];
      default:
        return [{ x: 0, z: 0, size: [20, 14, 20], name: 'main' }];
    }
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const options = this.options as HouseOptions;
    const wall = color(options.wallColor, DEFAULTS.wallColor);
    const accent = color(options.accentColor, DEFAULTS.accentColor);
    const roof = color(options.roofColor, DEFAULTS.roofColor);
    const glass = color(options.windowColor, DEFAULTS.windowColor);
    const modern = this.type === HouseType.Modern;
    const framed = detail >= LevelOfDetail.MEDIUM;
    const window = { pane: glass, frame: framed ? accent : undefined, frameWidth: 0.35 };
    const shuttered = { ...window, shutters: detail >= LevelOfDetail.HIGH ? accent : undefined };

    const shell = (v: Volume, main: boolean) => {
      walls(mesh, v, wall);
      if (modern) flatRoof(mesh, v, roof);
      else hipRoof(mesh, v, main ? 6 : 4.5, 1, roof);
    };
    const toVolume = (wing: Wing) =>
      volume(wing.x, wing.z, wing.size[0], wing.size[2], 0, wing.size[1]);

    if (detail === LevelOfDetail.ULTRA_LOW) {
      // From afar: the main block, the side wings as one long block through it, and any back wing
      const wings = this.getWings();
      const sides = wings.filter(wing => wing.name === 'left' || wing.name === 'right');
      wings
        .filter(wing => !sides.includes(wing))
        .forEach(wing => shell(toVolume(wing), wing.name === 'main'));
      if (sides.length > 0) {
        const [x0, x1] = [
          Math.min(...sides.map(s => toVolume(s).x0)),
          Math.max(...sides.map(s => toVolume(s).x1)),
        ];
        const [, h, d] = sides[0]!.size;
        shell(volume((x0 + x1) / 2, 0, x1 - x0, d, 0, h), false);
      }
      return;
    }

    this.getWings().forEach(wing => {
      const v = toVolume(wing);
      shell(v, wing.name === 'main');

      if (wing.name === 'main')
        this.dressMain(mesh, v, detail, { wall, accent, window, shuttered });
      else this.dressWing(mesh, v, wing.name, detail, window);
    });
  }

  private dressMain(
    mesh: MeshBuilder,
    v: Volume,
    detail: LevelOfDetail,
    style: { wall: THREE.Color; accent: THREE.Color; window: OpeningStyle; shuttered: OpeningStyle }
  ): void {
    const storey = (v.y1 - v.y0) / 2;
    opening(mesh, v, '+z', 0, 0, 3, 5.5, { pane: style.accent, frame: style.window.frame });
    [-5.5, 5.5].forEach(u => opening(mesh, v, '+z', u, 2.2, 3, 3, style.window));
    openingRow(mesh, v, '+z', 3, storey + 1.8, 2.6, 3.2, style.shuttered, 3);

    if (detail < LevelOfDetail.MEDIUM) return;

    [0, 1].forEach(floor =>
      openingRow(mesh, v, '-z', 3, floor * storey + 2, 2.6, 3.2, style.window, 3)
    );
    block(mesh, volume(0, v.z1 + 0.8, 5, 1.6, 0, 0.5), style.wall.clone().multiplyScalar(0.85));
    chimney(mesh, v.x0 + 4, (v.z0 + v.z1) / 2 - 2, v.y1, 5, style.wall);

    if (detail < LevelOfDetail.HIGH) return;

    // Porch canopy on two posts over the door
    const z = v.z1 + 2;
    block(mesh, volume(0, z, 6, 4, 6.2, 6.6), style.accent);
    [-2.7, 2.7].forEach(x => block(mesh, volume(x, z + 1.7, 0.4, 0.4, 0, 6.2), style.wall));
  }

  private dressWing(
    mesh: MeshBuilder,
    v: Volume,
    name: Wing['name'],
    detail: LevelOfDetail,
    window: OpeningStyle
  ): void {
    const front: Face = name === 'back' ? '-z' : '+z';
    const end: Face = name === 'left' ? '-x' : '+x';
    const y = (v.y1 - v.y0) * 0.3;
    openingRow(mesh, v, front, detail >= LevelOfDetail.MEDIUM ? 2 : 1, y, 3, 3, window, 3);
    if (detail >= LevelOfDetail.MEDIUM && name !== 'back') {
      openingRow(mesh, v, '-z', 2, y, 3, 3, window, 3);
    }
    if (detail >= LevelOfDetail.HIGH) opening(mesh, v, end, 0, y, 3, 3, window);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HouseOptions;

    return {
      name: 'House',
      version: '3.0.0',
      type: 'building',
      subtype: 'residential',
      style: this.type === HouseType.Modern ? 'modern' : 'hipped',
      houseType: HouseType[this.type],
      wingCount: this.getWings().length,
      levelOfDetail: LevelOfDetail[this.currentLOD],
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default House;
