import * as THREE from 'three';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { MeshBuilder } from '../../base/lowPolyMesh';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';
import { DESERT_HOUSE_DEFAULTS, buildDesertHouse } from './DesertHouse';
import { LowPolyBuilding, block, color, cone, cylinder, lid, volume } from './lowPolyBuilding';

export interface DesertHouseWithPoolOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  accentColor?: string;
  poolWaterColor?: string;
  poolTileColor?: string;
  poolDeckColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

const DEFAULTS = {
  ...DESERT_HOUSE_DEFAULTS,
  poolWaterColor: '#0077BE',
  poolTileColor: '#87CEEB',
  poolDeckColor: '#F5DEB3',
};

const CUSHION = new THREE.Color('#F4F1EA');
const PARASOL = new THREE.Color('#E4572E');

/**
 * DesertHouseWithPool - the Lanzarote house with a pool on a raised deck behind it
 *
 * The house is DesertHouse's at the same detail. ULTRA_LOW adds the deck top and the water; LOW
 * the whole deck; MEDIUM a tiled coping round the pool; HIGH two sun loungers and a parasol.
 */
export class DesertHouseWithPool extends LowPolyBuilding {
  constructor(options: DesertHouseWithPoolOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DesertHouseWithPool',
      version: '3.0.0',
      description: 'Lanzarote house with a pool on a deck behind it. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'desert', 'luxury', 'pool', 'residential', 'lod'],
    };

    super(metadata, {
      ...DEFAULTS,
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected build(mesh: MeshBuilder, detail: LevelOfDetail): void {
    const options = this.options as DesertHouseWithPoolOptions;
    const water = color(options.poolWaterColor, DEFAULTS.poolWaterColor);
    const tile = color(options.poolTileColor, DEFAULTS.poolTileColor);
    const deckColor = color(options.poolDeckColor, DEFAULTS.poolDeckColor);

    buildDesertHouse(mesh, options, detail);

    const deck = volume(0, -17, 20, 14, 0, 0.5);
    const pool = volume(0, -18, 11, 6, 0, 0.5);
    if (detail === LevelOfDetail.ULTRA_LOW) lid(mesh, deck, deck.y1, deckColor);
    else block(mesh, deck, deckColor);
    if (detail >= LevelOfDetail.MEDIUM) lid(mesh, pool, 0.62, tile, 0.6);
    lid(mesh, pool, 0.72, water);

    if (detail < LevelOfDetail.HIGH) return;

    // Sun loungers by the pool and a parasol between them
    [-3, 0].forEach(x => {
      block(mesh, volume(x, -12.2, 1.6, 4, 0.5, 1.1), CUSHION);
      block(mesh, volume(x, -10.6, 1.6, 0.8, 1.1, 2), CUSHION); // raised back
    });
    cylinder(mesh, 3, -12, 0.08, 0.5, 4.2, CUSHION, 4, false);
    cone(mesh, 3, -12, 2.4, 3.6, 0.9, PARASOL, 6);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DesertHouseWithPoolOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as DesertHouseWithPoolOptions;

    return {
      name: 'DesertHouseWithPool',
      version: '3.0.0',
      type: 'building',
      subtype: 'luxury_residential',
      levelOfDetail: LevelOfDetail[this.currentLOD],
      wallColor: options.wallColor,
      poolWaterColor: options.poolWaterColor,
      scale: options.scale,
    };
  }
}

export default DesertHouseWithPool;
