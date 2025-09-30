import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface PoolOptions extends SimpleComponentOptions {
  waterColor?: string;
  tileColor?: string;
  deckColor?: string;
  width?: number;
  length?: number;
  depth?: number;
  scale?: number;
}

/**
 * Pool component - Swimming pool with water, tiles, and deck
 */
export class Pool extends SimpleThreeComponent {
  constructor(options: PoolOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Pool',
      version: '1.0.0',
      description: 'Swimming pool with realistic water, tiles, and surrounding deck',
      tags: ['scenery', 'pool', 'water', 'recreation', 'luxury'],
    };

    super(metadata, {
      waterColor: '#0077BE', // Ocean blue
      tileColor: '#87CEEB', // Sky blue for pool tiles
      deckColor: '#F5DEB3', // Beige for deck
      width: 15,
      length: 8,
      depth: 2,
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const pool = new THREE.Group();
    pool.name = 'Pool';

    const options = this.options as PoolOptions;
    const scale = options.scale || 1;
    const width = options.width || 15;
    const length = options.length || 8;
    const depth = options.depth || 2;

    // Create materials with resource sharing
    const waterMaterial = resourceManager.getOrCreateMaterial(
      `pool_water_${options.waterColor}`,
      () => new THREE.MeshLambertMaterial({
        color: options.waterColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );

    const tileMaterial = resourceManager.getOrCreateMaterial(
      `pool_tile_${options.tileColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.tileColor })
    );

    const deckMaterial = resourceManager.getOrCreateMaterial(
      `pool_deck_${options.deckColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.deckColor })
    );

    const concreteMaterial = resourceManager.getOrCreateMaterial(
      'pool_concrete',
      () => new THREE.MeshLambertMaterial({ color: '#D3D3D3' })
    );

    // Pool basin (walls and floor)
    const basinGeometry = resourceManager.getOrCreateGeometry(
      `pool_basin_${width}_${length}_${depth}`,
      () => {
        const geometry = new THREE.BoxGeometry(width, depth, length);
        return geometry;
      }
    );

    const basin = new THREE.Mesh(basinGeometry, concreteMaterial);
    basin.position.set(0, -depth/2, 0);
    basin.castShadow = this.options.castShadow ?? true;
    basin.receiveShadow = this.options.receiveShadow ?? true;
    pool.add(basin);

    // Pool floor tiles
    const floorTileGeometry = resourceManager.getOrCreateGeometry(
      `pool_floor_tile_${width}_${length}`,
      () => new THREE.PlaneGeometry(width - 0.5, length - 0.5)
    );

    const floorTiles = new THREE.Mesh(floorTileGeometry, tileMaterial);
    floorTiles.rotation.x = -Math.PI / 2;
    floorTiles.position.set(0, -depth + 0.1, 0);
    floorTiles.receiveShadow = this.options.receiveShadow ?? true;
    pool.add(floorTiles);

    // Pool wall tiles
    const wallHeight = depth - 0.2;

    // Front and back walls
    const frontWallGeometry = resourceManager.getOrCreateGeometry(
      `pool_front_wall_${width}_${wallHeight}`,
      () => new THREE.PlaneGeometry(width - 0.5, wallHeight)
    );

    const frontWall = new THREE.Mesh(frontWallGeometry, tileMaterial);
    frontWall.position.set(0, -depth/2, length/2 - 0.25);
    pool.add(frontWall);

    const backWall = new THREE.Mesh(frontWallGeometry, tileMaterial);
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, -depth/2, -length/2 + 0.25);
    pool.add(backWall);

    // Side walls
    const sideWallGeometry = resourceManager.getOrCreateGeometry(
      `pool_side_wall_${length}_${wallHeight}`,
      () => new THREE.PlaneGeometry(length - 0.5, wallHeight)
    );

    const leftWall = new THREE.Mesh(sideWallGeometry, tileMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width/2 + 0.25, -depth/2, 0);
    pool.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, tileMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(width/2 - 0.25, -depth/2, 0);
    pool.add(rightWall);

    // Water surface
    const waterGeometry = resourceManager.getOrCreateGeometry(
      `pool_water_${width}_${length}`,
      () => new THREE.PlaneGeometry(width - 0.5, length - 0.5)
    );

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.1, 0); // Slightly below surface level
    pool.add(water);

    // Pool deck
    const deckWidth = width + 4;
    const deckLength = length + 4;
    const deckGeometry = resourceManager.getOrCreateGeometry(
      `pool_deck_${deckWidth}_${deckLength}`,
      () => new THREE.PlaneGeometry(deckWidth, deckLength)
    );

    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, 0.1, 0);
    deck.receiveShadow = this.options.receiveShadow ?? true;
    pool.add(deck);

    // Pool coping (edge trim)
    const copingMaterial = resourceManager.getOrCreateMaterial(
      'pool_coping',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
    );

    // Create coping around pool edge
    const copingPieces = [
      // Front
      { width: width + 0.4, height: 0.2, length: 0.4, pos: [0, 0.1, length/2 + 0.2] },
      // Back
      { width: width + 0.4, height: 0.2, length: 0.4, pos: [0, 0.1, -length/2 - 0.2] },
      // Left
      { width: 0.4, height: 0.2, length: length, pos: [-width/2 - 0.2, 0.1, 0] },
      // Right
      { width: 0.4, height: 0.2, length: length, pos: [width/2 + 0.2, 0.1, 0] },
    ];

    copingPieces.forEach((piece, index) => {
      const copingGeometry = resourceManager.getOrCreateGeometry(
        `pool_coping_${index}`,
        () => new THREE.BoxGeometry(piece.width, piece.height, piece.length)
      );

      const coping = new THREE.Mesh(copingGeometry, copingMaterial);
      coping.position.set(piece.pos[0], piece.pos[1], piece.pos[2]);
      coping.castShadow = this.options.castShadow ?? true;
      coping.receiveShadow = this.options.receiveShadow ?? true;
      pool.add(coping);
    });

    // Pool ladder
    const ladderMaterial = resourceManager.getOrCreateMaterial(
      'pool_ladder',
      () => new THREE.MeshLambertMaterial({ color: '#C0C0C0' })
    );

    // Ladder rails
    const railGeometry = resourceManager.getOrCreateGeometry(
      'pool_ladder_rail',
      () => new THREE.CylinderGeometry(0.1, 0.1, depth + 0.5)
    );

    const leftRail = new THREE.Mesh(railGeometry, ladderMaterial);
    leftRail.position.set(-0.3, -depth/2 + 0.25, length/2);
    pool.add(leftRail);

    const rightRail = new THREE.Mesh(railGeometry, ladderMaterial);
    rightRail.position.set(0.3, -depth/2 + 0.25, length/2);
    pool.add(rightRail);

    // Ladder steps
    const stepGeometry = resourceManager.getOrCreateGeometry(
      'pool_ladder_step',
      () => new THREE.CylinderGeometry(0.05, 0.05, 0.6)
    );

    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(stepGeometry, ladderMaterial);
      step.rotation.z = Math.PI / 2;
      step.position.set(0, -depth + 0.3 + i * 0.5, length/2);
      pool.add(step);
    }

    // Apply scale
    if (scale !== 1) {
      pool.scale.setScalar(scale);
    }

    return pool;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as PoolOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.width && options.width <= 0) {
      issues.push('Width must be greater than 0');
    }

    if (options.length && options.length <= 0) {
      issues.push('Length must be greater than 0');
    }

    if (options.depth && options.depth <= 0) {
      issues.push('Depth must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as PoolOptions;

    return {
      name: 'Pool',
      version: '1.0.0',
      type: 'amenity',
      subtype: 'recreational',
      waterColor: options.waterColor,
      tileColor: options.tileColor,
      deckColor: options.deckColor,
      dimensions: {
        width: options.width,
        length: options.length,
        depth: options.depth,
      },
      scale: options.scale,
    };
  }
}

export default Pool;
