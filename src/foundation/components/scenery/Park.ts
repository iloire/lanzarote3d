import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface ParkOptions extends SimpleComponentOptions {
  size?: { width: number; depth: number };
  grassColor?: string;
  pathColor?: string;
  treeCount?: number;
  benchCount?: number;
  hasFountain?: boolean;
  scale?: number;
}

/**
 * Park - Simple park with grass, paths, trees, and benches
 *
 * Features:
 * - Green grass area
 * - Walking paths
 * - Simple trees (cylinders with sphere tops)
 * - Park benches
 * - Optional fountain centerpiece
 */
export class Park extends SimpleThreeComponent {
  constructor(options: ParkOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Park',
      version: '1.0.0',
      description: 'Simple park with grass, paths, trees, and benches',
      tags: ['scenery', 'park', 'environment', 'urban'],
    };

    super(metadata, {
      size: { width: 80, depth: 80 },
      grassColor: '#4A7C59', // Dark green grass
      pathColor: '#8B7355', // Brown path
      treeCount: 8,
      benchCount: 4,
      hasFountain: true,
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const park = new THREE.Group();
    park.name = 'Park';

    const options = this.options as ParkOptions;
    const { width, depth } = options.size!;
    const scale = options.scale || 1;

    // Create materials
    const grassMaterial = resourceManager.getOrCreateMaterial(
      `park_grass_${options.grassColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.grassColor,
        roughness: 0.9,
        metalness: 0.1
      })
    );

    const pathMaterial = resourceManager.getOrCreateMaterial(
      `park_path_${options.pathColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.pathColor,
        roughness: 0.8,
        metalness: 0.0
      })
    );

    const treeTrunkMaterial = resourceManager.getOrCreateMaterial(
      'park_tree_trunk',
      () => new THREE.MeshStandardMaterial({
        color: '#654321',
        roughness: 0.9,
        metalness: 0.0
      })
    );

    const treeFoliageMaterial = resourceManager.getOrCreateMaterial(
      'park_tree_foliage',
      () => new THREE.MeshStandardMaterial({
        color: '#2D5016',
        roughness: 0.7,
        metalness: 0.0
      })
    );

    const benchMaterial = resourceManager.getOrCreateMaterial(
      'park_bench',
      () => new THREE.MeshStandardMaterial({
        color: '#8B4513',
        roughness: 0.6,
        metalness: 0.2
      })
    );

    // 1. Grass base
    const grassGeometry = new THREE.BoxGeometry(width, 0.2, depth);
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.set(0, 0.1, 0);
    grass.castShadow = false;
    grass.receiveShadow = this.options.receiveShadow ?? true;
    park.add(grass);

    // 2. Walking paths (cross pattern)
    const pathWidth = 8;
    const pathHeight = 0.3;

    // Horizontal path
    const horizontalPath = new THREE.Mesh(
      new THREE.BoxGeometry(width, pathHeight, pathWidth),
      pathMaterial
    );
    horizontalPath.position.set(0, 0.15, 0);
    horizontalPath.receiveShadow = true;
    park.add(horizontalPath);

    // Vertical path
    const verticalPath = new THREE.Mesh(
      new THREE.BoxGeometry(pathWidth, pathHeight, depth),
      pathMaterial
    );
    verticalPath.position.set(0, 0.15, 0);
    verticalPath.receiveShadow = true;
    park.add(verticalPath);

    // 3. Trees around the perimeter
    const treeCount = options.treeCount || 8;
    const treePositions = this.generateTreePositions(width, depth, treeCount);

    treePositions.forEach(pos => {
      const tree = this.createTree(treeTrunkMaterial, treeFoliageMaterial);
      tree.position.set(pos.x, 0, pos.z);
      park.add(tree);
    });

    // 4. Park benches
    const benchCount = options.benchCount || 4;
    const benchPositions = [
      { x: width / 4, z: 0, rotation: Math.PI / 2 },
      { x: -width / 4, z: 0, rotation: -Math.PI / 2 },
      { x: 0, z: depth / 4, rotation: 0 },
      { x: 0, z: -depth / 4, rotation: Math.PI },
    ];

    for (let i = 0; i < Math.min(benchCount, benchPositions.length); i++) {
      const pos = benchPositions[i];
      const bench = this.createBench(benchMaterial);
      bench.position.set(pos.x, 0.5, pos.z);
      bench.rotation.y = pos.rotation;
      park.add(bench);
    }

    // 5. Optional fountain centerpiece
    if (options.hasFountain) {
      const fountain = this.createFountain();
      fountain.position.set(0, 0, 0);
      park.add(fountain);
    }

    // Apply scale
    if (scale !== 1) {
      park.scale.setScalar(scale);
    }

    return park;
  }

  private generateTreePositions(width: number, depth: number, count: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const margin = 10;

    // Place trees around perimeter
    const perSide = Math.ceil(count / 4);

    // Top side
    for (let i = 0; i < perSide && positions.length < count; i++) {
      const x = -width / 2 + margin + (i * (width - 2 * margin)) / (perSide - 1 || 1);
      positions.push(new THREE.Vector3(x, 0, depth / 2 - margin));
    }

    // Bottom side
    for (let i = 0; i < perSide && positions.length < count; i++) {
      const x = -width / 2 + margin + (i * (width - 2 * margin)) / (perSide - 1 || 1);
      positions.push(new THREE.Vector3(x, 0, -depth / 2 + margin));
    }

    // Left side
    for (let i = 1; i < perSide - 1 && positions.length < count; i++) {
      const z = -depth / 2 + margin + (i * (depth - 2 * margin)) / (perSide - 1 || 1);
      positions.push(new THREE.Vector3(-width / 2 + margin, 0, z));
    }

    // Right side
    for (let i = 1; i < perSide - 1 && positions.length < count; i++) {
      const z = -depth / 2 + margin + (i * (depth - 2 * margin)) / (perSide - 1 || 1);
      positions.push(new THREE.Vector3(width / 2 - margin, 0, z));
    }

    return positions.slice(0, count);
  }

  private createTree(trunkMaterial: THREE.Material, foliageMaterial: THREE.Material): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3;
    trunk.castShadow = this.options.castShadow ?? true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage (sphere)
    const foliageGeometry = new THREE.SphereGeometry(3, 8, 8);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 7;
    foliage.castShadow = this.options.castShadow ?? true;
    foliage.receiveShadow = true;
    tree.add(foliage);

    return tree;
  }

  private createBench(material: THREE.Material): THREE.Group {
    const bench = new THREE.Group();

    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 1.5),
      material
    );
    seat.position.y = 1;
    seat.castShadow = this.options.castShadow ?? true;
    bench.add(seat);

    // Backrest
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 0.2),
      material
    );
    backrest.position.set(0, 1.8, -0.65);
    backrest.castShadow = this.options.castShadow ?? true;
    bench.add(backrest);

    // Legs (4)
    const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    const legPositions = [
      { x: -1.5, z: -0.5 },
      { x: 1.5, z: -0.5 },
      { x: -1.5, z: 0.5 },
      { x: 1.5, z: 0.5 },
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(pos.x, 0.5, pos.z);
      leg.castShadow = this.options.castShadow ?? true;
      bench.add(leg);
    });

    return bench;
  }

  private createFountain(): THREE.Group {
    const fountain = new THREE.Group();

    const fountainMaterial = new THREE.MeshStandardMaterial({
      color: '#A9A9A9', // Dark gray stone
      roughness: 0.5,
      metalness: 0.3
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: '#4682B4', // Steel blue water
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.5
    });

    // Base pool
    const baseGeometry = new THREE.CylinderGeometry(6, 6, 0.5, 16);
    const base = new THREE.Mesh(baseGeometry, fountainMaterial);
    base.position.y = 0.6;
    base.castShadow = this.options.castShadow ?? true;
    base.receiveShadow = true;
    fountain.add(base);

    // Water in pool
    const waterGeometry = new THREE.CylinderGeometry(5.5, 5.5, 0.3, 16);
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = 0.75;
    fountain.add(water);

    // Center pillar
    const pillarGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 12);
    const pillar = new THREE.Mesh(pillarGeometry, fountainMaterial);
    pillar.position.y = 2.5;
    pillar.castShadow = this.options.castShadow ?? true;
    fountain.add(pillar);

    // Top bowl
    const bowlGeometry = new THREE.SphereGeometry(1.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const bowl = new THREE.Mesh(bowlGeometry, fountainMaterial);
    bowl.position.y = 4;
    bowl.castShadow = this.options.castShadow ?? true;
    fountain.add(bowl);

    return fountain;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as ParkOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.size) {
      if (options.size.width <= 0) issues.push('Park width must be greater than 0');
      if (options.size.depth <= 0) issues.push('Park depth must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as ParkOptions;

    return {
      name: 'Park',
      version: '1.0.0',
      type: 'scenery',
      subtype: 'park',
      size: options.size,
      treeCount: options.treeCount,
      benchCount: options.benchCount,
      hasFountain: options.hasFountain,
      scale: options.scale,
    };
  }
}

export default Park;
