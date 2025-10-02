import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface TownSquareOptions extends SimpleComponentOptions {
  size?: { width: number; depth: number };
  pavingColor?: string;
  monumentType?: 'obelisk' | 'statue' | 'fountain';
  benchCount?: number;
  hasFlowerBeds?: boolean;
  hasLampPosts?: boolean;
  scale?: number;
  lowPoly?: boolean;
}

/**
 * TownSquare - A public gathering space with monument, benches, and decorative elements
 *
 * Features:
 * - Paved central area (stone/brick pattern)
 * - Central monument (obelisk, statue, or fountain)
 * - Benches around perimeter
 * - Optional flower beds
 * - Optional decorative lamp posts
 * - Low-poly mode for performance (~60-150 polygons vs ~1000-5500)
 *
 * @example
 * ```typescript
 * const square = new TownSquare({
 *   size: { width: 120, depth: 120 },
 *   monumentType: 'fountain',
 *   benchCount: 8,
 *   hasFlowerBeds: true,
 *   hasLampPosts: true,
 *   lowPoly: false // High detail
 * });
 *
 * // Low-poly version
 * const squareLowPoly = new TownSquare({
 *   monumentType: 'obelisk',
 *   lowPoly: true // <200 polygons
 * });
 * ```
 */
export class TownSquare extends SimpleThreeComponent {
  constructor(options: TownSquareOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'TownSquare',
      version: '1.0.0',
      description: 'A town square with paved area, monument, benches, and decorative elements',
      tags: ['scenery', 'square', 'urban', 'monument'],
    };

    super(metadata, {
      size: { width: 120, depth: 120 },
      pavingColor: '#A8A8A8',
      monumentType: 'obelisk',
      benchCount: 8,
      hasFlowerBeds: true,
      hasLampPosts: true,
      scale: 1,
      lowPoly: false,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const {
      size = { width: 120, depth: 120 },
      pavingColor = '#A8A8A8',
      monumentType = 'obelisk',
      benchCount = 8,
      hasFlowerBeds = true,
      hasLampPosts = true,
      scale = 1,
      lowPoly = false,
    } = this.options as TownSquareOptions;

    const width = size.width * scale;
    const depth = size.depth * scale;

    // Use appropriate version based on lowPoly flag
    if (lowPoly) {
      return this.createLowPolyContent(width, depth, pavingColor, monumentType);
    } else {
      return this.createHighPolyContent(width, depth, pavingColor, monumentType, benchCount, hasFlowerBeds, hasLampPosts);
    }
  }

  /**
   * Create high-poly version of town square (~1000-5500 polygons)
   */
  private createHighPolyContent(
    width: number,
    depth: number,
    pavingColor: string,
    monumentType: 'obelisk' | 'statue' | 'fountain',
    benchCount: number,
    hasFlowerBeds: boolean,
    hasLampPosts: boolean
  ): THREE.Object3D {
    const square = new THREE.Group();
    square.name = 'TownSquare';

    // Materials
    const pavingMaterial = resourceManager.getOrCreateMaterial(
      `townSquare_paving_${pavingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: pavingColor,
        roughness: 0.7,
        metalness: 0.1,
      })
    );

    const benchMaterial = resourceManager.getOrCreateMaterial(
      'townSquare_bench',
      () => new THREE.MeshStandardMaterial({
        color: '#8B4513',
        roughness: 0.8,
      })
    );

    const flowerBedMaterial = resourceManager.getOrCreateMaterial(
      'townSquare_flowerBed',
      () => new THREE.MeshStandardMaterial({
        color: '#FF69B4',
        roughness: 0.6,
      })
    );

    const lampMaterial = resourceManager.getOrCreateMaterial(
      'townSquare_lamp',
      () => new THREE.MeshStandardMaterial({
        color: '#2C2C2C',
        roughness: 0.3,
        metalness: 0.7,
      })
    );

    // 1. Paved ground with pattern
    const pavingGroup = this.createPavedArea(width, depth, pavingMaterial);
    square.add(pavingGroup);

    // 2. Central monument
    const monument = this.createMonument(monumentType, pavingMaterial);
    monument.position.set(0, 0, 0);
    square.add(monument);

    // 3. Benches around the perimeter
    const benchPositions = this.generateBenchPositions(width, depth, benchCount);
    benchPositions.forEach(({ position, rotation }) => {
      const bench = this.createBench(benchMaterial);
      bench.position.copy(position);
      bench.rotation.y = rotation;
      square.add(bench);
    });

    // 4. Flower beds (optional)
    if (hasFlowerBeds) {
      const flowerBedPositions = this.generateFlowerBedPositions(width, depth);
      flowerBedPositions.forEach((position) => {
        const flowerBed = this.createFlowerBed(flowerBedMaterial);
        flowerBed.position.copy(position);
        square.add(flowerBed);
      });
    }

    // 5. Lamp posts (optional)
    if (hasLampPosts) {
      const lampPositions = this.generateLampPostPositions(width, depth);
      lampPositions.forEach((position) => {
        const lamp = this.createLampPost(lampMaterial);
        lamp.position.copy(position);
        square.add(lamp);
      });
    }

    return square;
  }

  /**
   * Create paved area with pattern effect
   */
  private createPavedArea(width: number, depth: number, material: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    // Main paved surface
    const pavingGeometry = new THREE.PlaneGeometry(width, depth);
    const paving = new THREE.Mesh(pavingGeometry, material);
    paving.rotation.x = -Math.PI / 2;
    paving.position.y = 0.1;
    paving.receiveShadow = true;
    group.add(paving);

    // Add subtle pattern with darker lines (like brick/stone pattern)
    const lineColor = 0x808080;
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: lineColor,
      roughness: 0.9,
    });

    // Create grid pattern
    const lineWidth = 0.3;
    const spacing = 8;

    // Horizontal lines
    for (let z = -depth / 2; z <= depth / 2; z += spacing) {
      const lineGeometry = new THREE.PlaneGeometry(width, lineWidth);
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.11, z);
      group.add(line);
    }

    // Vertical lines
    for (let x = -width / 2; x <= width / 2; x += spacing) {
      const lineGeometry = new THREE.PlaneGeometry(lineWidth, depth);
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.11, 0);
      group.add(line);
    }

    return group;
  }

  /**
   * Create central monument based on type
   */
  private createMonument(
    type: 'obelisk' | 'statue' | 'fountain',
    baseMaterial: THREE.Material
  ): THREE.Group {
    const monument = new THREE.Group();

    switch (type) {
      case 'obelisk':
        monument.add(this.createObelisk());
        break;
      case 'statue':
        monument.add(this.createStatue());
        break;
      case 'fountain':
        monument.add(this.createFountain());
        break;
    }

    return monument;
  }

  /**
   * Create an obelisk monument
   */
  private createObelisk(): THREE.Group {
    const obelisk = new THREE.Group();

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#D3D3D3',
      roughness: 0.6,
      metalness: 0.1,
    });

    // Base platform (3 tiers)
    const baseSizes = [
      { width: 12, height: 1, depth: 12 },
      { width: 10, height: 1, depth: 10 },
      { width: 8, height: 1, depth: 8 },
    ];

    let yOffset = 0.1;
    baseSizes.forEach((size) => {
      const baseGeometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
      const base = new THREE.Mesh(baseGeometry, stoneMaterial);
      base.position.y = yOffset + size.height / 2;
      base.castShadow = true;
      obelisk.add(base);
      yOffset += size.height;
    });

    // Obelisk shaft (tapered)
    const shaftGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 4);
    const shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
    shaft.position.y = yOffset + 10;
    shaft.castShadow = true;
    obelisk.add(shaft);

    // Pyramidal top
    const topGeometry = new THREE.ConeGeometry(2, 4, 4);
    const top = new THREE.Mesh(topGeometry, stoneMaterial);
    top.position.y = yOffset + 22;
    top.castShadow = true;
    obelisk.add(top);

    return obelisk;
  }

  /**
   * Create a statue monument
   */
  private createStatue(): THREE.Group {
    const statue = new THREE.Group();

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#C0C0C0',
      roughness: 0.5,
      metalness: 0.2,
    });

    // Pedestal base
    const baseGeometry = new THREE.CylinderGeometry(5, 6, 3, 8);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.y = 1.6;
    base.castShadow = true;
    statue.add(base);

    // Statue body (simplified human form)
    const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 8);
    const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
    body.position.y = 7.5;
    body.castShadow = true;
    statue.add(body);

    // Statue head
    const headGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const head = new THREE.Mesh(headGeometry, stoneMaterial);
    head.position.y = 13;
    head.castShadow = true;
    statue.add(head);

    // Arms (simplified)
    const armGeometry = new THREE.BoxGeometry(1, 5, 1);
    const leftArm = new THREE.Mesh(armGeometry, stoneMaterial);
    leftArm.position.set(-2.5, 8, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    statue.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, stoneMaterial);
    rightArm.position.set(2.5, 8, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    statue.add(rightArm);

    return statue;
  }

  /**
   * Create a fountain monument
   */
  private createFountain(): THREE.Group {
    const fountain = new THREE.Group();

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#B0B0B0',
      roughness: 0.4,
      metalness: 0.1,
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: '#4FC3F7',
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7,
    });

    // Base pool (circular)
    const poolGeometry = new THREE.CylinderGeometry(8, 8, 1.5, 16);
    const pool = new THREE.Mesh(poolGeometry, stoneMaterial);
    pool.position.y = 0.85;
    pool.castShadow = true;
    fountain.add(pool);

    // Water in pool
    const waterGeometry = new THREE.CylinderGeometry(7.5, 7.5, 0.5, 16);
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = 1.35;
    fountain.add(water);

    // Center pillar
    const pillarGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 12);
    const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
    pillar.position.y = 5.6;
    pillar.castShadow = true;
    fountain.add(pillar);

    // Top basin
    const basinGeometry = new THREE.CylinderGeometry(3, 2.5, 1.5, 12);
    const basin = new THREE.Mesh(basinGeometry, stoneMaterial);
    basin.position.y = 10.35;
    basin.castShadow = true;
    fountain.add(basin);

    // Water in top basin
    const topWaterGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
    const topWater = new THREE.Mesh(topWaterGeometry, waterMaterial);
    topWater.position.y = 10.85;
    fountain.add(topWater);

    return fountain;
  }

  /**
   * Generate bench positions around the perimeter
   */
  private generateBenchPositions(
    width: number,
    depth: number,
    count: number
  ): Array<{ position: THREE.Vector3; rotation: number }> {
    const positions: Array<{ position: THREE.Vector3; rotation: number }> = [];
    const offset = 8; // Distance from edge

    const perBenchesPerSide = Math.floor(count / 4);
    const remainder = count % 4;

    // Helper to distribute benches along a side
    const distributeBenches = (
      side: 'north' | 'south' | 'east' | 'west',
      benchCount: number
    ) => {
      for (let i = 0; i < benchCount; i++) {
        const t = (i + 1) / (benchCount + 1); // Evenly distribute

        let position: THREE.Vector3;
        let rotation: number;

        switch (side) {
          case 'north':
            position = new THREE.Vector3((t - 0.5) * width, 0, depth / 2 - offset);
            rotation = Math.PI;
            break;
          case 'south':
            position = new THREE.Vector3((t - 0.5) * width, 0, -depth / 2 + offset);
            rotation = 0;
            break;
          case 'east':
            position = new THREE.Vector3(width / 2 - offset, 0, (t - 0.5) * depth);
            rotation = -Math.PI / 2;
            break;
          case 'west':
            position = new THREE.Vector3(-width / 2 + offset, 0, (t - 0.5) * depth);
            rotation = Math.PI / 2;
            break;
        }

        positions.push({ position, rotation });
      }
    };

    // Distribute benches across four sides
    distributeBenches('north', perBenchesPerSide + (remainder > 0 ? 1 : 0));
    distributeBenches('south', perBenchesPerSide + (remainder > 1 ? 1 : 0));
    distributeBenches('east', perBenchesPerSide + (remainder > 2 ? 1 : 0));
    distributeBenches('west', perBenchesPerSide);

    return positions;
  }

  /**
   * Create a bench
   */
  private createBench(material: THREE.Material): THREE.Group {
    const bench = new THREE.Group();

    // Seat
    const seatGeometry = new THREE.BoxGeometry(4, 0.3, 1.5);
    const seat = new THREE.Mesh(seatGeometry, material);
    seat.position.y = 1;
    seat.castShadow = true;
    bench.add(seat);

    // Backrest
    const backrestGeometry = new THREE.BoxGeometry(4, 1.5, 0.2);
    const backrest = new THREE.Mesh(backrestGeometry, material);
    backrest.position.set(0, 1.75, -0.65);
    backrest.castShadow = true;
    bench.add(backrest);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const legPositions = [
      { x: -1.5, z: 0.5 },
      { x: 1.5, z: 0.5 },
      { x: -1.5, z: -0.5 },
      { x: 1.5, z: -0.5 },
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(pos.x, 0.5, pos.z);
      leg.castShadow = true;
      bench.add(leg);
    });

    return bench;
  }

  /**
   * Generate flower bed positions
   */
  private generateFlowerBedPositions(width: number, depth: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const offset = 15;

    // Four flower beds at corners
    positions.push(new THREE.Vector3(width / 2 - offset, 0, depth / 2 - offset));
    positions.push(new THREE.Vector3(-width / 2 + offset, 0, depth / 2 - offset));
    positions.push(new THREE.Vector3(width / 2 - offset, 0, -depth / 2 + offset));
    positions.push(new THREE.Vector3(-width / 2 + offset, 0, -depth / 2 + offset));

    return positions;
  }

  /**
   * Create a flower bed
   */
  private createFlowerBed(flowerMaterial: THREE.Material): THREE.Group {
    const flowerBed = new THREE.Group();

    const soilMaterial = new THREE.MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.9,
    });

    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: '#228B22',
      roughness: 0.8,
    });

    // Soil bed
    const bedGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 8);
    const bed = new THREE.Mesh(bedGeometry, soilMaterial);
    bed.position.y = 0.35;
    flowerBed.add(bed);

    // Flowers (simplified as colored spheres on stems)
    const flowerCount = 6;
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1;

      // Stem
      const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
      const stem = new THREE.Mesh(stemGeometry, foliageMaterial);
      stem.position.set(Math.cos(angle) * radius, 1.1, Math.sin(angle) * radius);
      flowerBed.add(stem);

      // Flower
      const flowerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(Math.cos(angle) * radius, 1.9, Math.sin(angle) * radius);
      flowerBed.add(flower);
    }

    return flowerBed;
  }

  /**
   * Generate lamp post positions
   */
  private generateLampPostPositions(width: number, depth: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const offset = 20;

    // Four lamp posts near corners
    positions.push(new THREE.Vector3(width / 2 - offset, 0, depth / 2 - offset));
    positions.push(new THREE.Vector3(-width / 2 + offset, 0, depth / 2 - offset));
    positions.push(new THREE.Vector3(width / 2 - offset, 0, -depth / 2 + offset));
    positions.push(new THREE.Vector3(-width / 2 + offset, 0, -depth / 2 + offset));

    return positions;
  }

  /**
   * Create a decorative lamp post
   */
  private createLampPost(material: THREE.Material): THREE.Group {
    const lamp = new THREE.Group();

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: '#FFF8DC',
      emissive: '#FFF8DC',
      emissiveIntensity: 0.5,
    });

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.8, 0.5, 8);
    const base = new THREE.Mesh(baseGeometry, material);
    base.position.y = 0.35;
    base.castShadow = true;
    lamp.add(base);

    // Post
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    const post = new THREE.Mesh(postGeometry, material);
    post.position.y = 4.6;
    post.castShadow = true;
    lamp.add(post);

    // Lamp head (lantern style)
    const headGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 9.35;
    head.castShadow = true;
    lamp.add(head);

    // Light (glowing element)
    const lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 9.35;
    lamp.add(light);

    return lamp;
  }

  /**
   * Create low-poly version of town square (<200 polygons)
   */
  private createLowPolyContent(
    width: number,
    depth: number,
    pavingColor: string,
    monumentType: 'obelisk' | 'statue' | 'fountain'
  ): THREE.Object3D {
    const square = new THREE.Group();
    square.name = 'TownSquareLowPoly';

    const pavingMaterial = resourceManager.getOrCreateMaterial(
      `townSquareLowPoly_paving_${pavingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: pavingColor,
        roughness: 0.7,
        metalness: 0.1,
      })
    );

    const benchMaterial = resourceManager.getOrCreateMaterial(
      'townSquareLowPoly_bench',
      () => new THREE.MeshStandardMaterial({
        color: '#8B4513',
        roughness: 0.8,
      })
    );

    // 1. Simple paved ground (2 triangles)
    const pavingGeometry = new THREE.PlaneGeometry(width, depth);
    const paving = new THREE.Mesh(pavingGeometry, pavingMaterial);
    paving.rotation.x = -Math.PI / 2;
    paving.position.y = 0.1;
    paving.receiveShadow = true;
    square.add(paving);

    // 2. Central monument (12-24 triangles)
    const monument = this.createLowPolyMonument(monumentType);
    monument.position.set(0, 0, 0);
    square.add(monument);

    // 3. Four simple benches at corners (48 tris total = 4 benches * 12 tris each)
    const benchPositions = [
      { pos: new THREE.Vector3(width / 2 - 15, 0, depth / 2 - 15), rot: -Math.PI / 4 },
      { pos: new THREE.Vector3(-width / 2 + 15, 0, depth / 2 - 15), rot: Math.PI / 4 },
      { pos: new THREE.Vector3(width / 2 - 15, 0, -depth / 2 + 15), rot: -Math.PI * 3 / 4 },
      { pos: new THREE.Vector3(-width / 2 + 15, 0, -depth / 2 + 15), rot: Math.PI * 3 / 4 },
    ];

    benchPositions.forEach(({ pos, rot }) => {
      const bench = this.createLowPolyBench(benchMaterial);
      bench.position.copy(pos);
      bench.rotation.y = rot;
      square.add(bench);
    });

    return square;
  }

  /**
   * Create low-poly monument (12-36 triangles)
   */
  private createLowPolyMonument(type: 'obelisk' | 'statue' | 'fountain'): THREE.Group {
    const monument = new THREE.Group();

    const stoneMaterial = resourceManager.getOrCreateMaterial(
      'townSquareLowPoly_stone',
      () => new THREE.MeshStandardMaterial({
        color: '#D3D3D3',
        roughness: 0.6,
        metalness: 0.1,
      })
    );

    switch (type) {
      case 'obelisk':
        // Box base (12 tris) + pyramid top (8 tris) = 20 tris
        const baseGeometry = new THREE.BoxGeometry(8, 2, 8);
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = 1;
        base.castShadow = true;
        monument.add(base);

        const shaftGeometry = new THREE.BoxGeometry(2, 15, 2);
        const shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
        shaft.position.y = 10;
        shaft.castShadow = true;
        monument.add(shaft);

        const topGeometry = new THREE.ConeGeometry(2, 4, 4);
        const top = new THREE.Mesh(topGeometry, stoneMaterial);
        top.position.y = 19.5;
        top.castShadow = true;
        monument.add(top);
        break;

      case 'statue':
        // Simple abstract statue (3 boxes = 36 tris)
        const pedestalGeometry = new THREE.BoxGeometry(6, 3, 6);
        const pedestal = new THREE.Mesh(pedestalGeometry, stoneMaterial);
        pedestal.position.y = 1.5;
        pedestal.castShadow = true;
        monument.add(pedestal);

        const bodyGeometry = new THREE.BoxGeometry(2, 8, 2);
        const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
        body.position.y = 7.5;
        body.castShadow = true;
        monument.add(body);

        const headGeometry = new THREE.BoxGeometry(2, 2, 2);
        const head = new THREE.Mesh(headGeometry, stoneMaterial);
        head.position.y = 12.5;
        head.castShadow = true;
        monument.add(head);
        break;

      case 'fountain':
        // Simple fountain (2 cylinders = 24 tris with 6 segments)
        const waterMaterial = resourceManager.getOrCreateMaterial(
          'townSquareLowPoly_water',
          () => new THREE.MeshStandardMaterial({
            color: '#4FC3F7',
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7,
          })
        );

        const poolGeometry = new THREE.CylinderGeometry(8, 8, 1.5, 6);
        const pool = new THREE.Mesh(poolGeometry, stoneMaterial);
        pool.position.y = 0.85;
        pool.castShadow = true;
        monument.add(pool);

        const waterGeometry = new THREE.CylinderGeometry(7.5, 7.5, 0.5, 6);
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = 1.35;
        monument.add(water);

        const pillarGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 6);
        const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
        pillar.position.y = 5.6;
        pillar.castShadow = true;
        monument.add(pillar);
        break;
    }

    return monument;
  }

  /**
   * Create ultra low-poly bench (24 triangles = 2 boxes without legs)
   */
  private createLowPolyBench(material: THREE.Material): THREE.Group {
    const bench = new THREE.Group();

    // Seat (12 tris)
    const seatGeometry = new THREE.BoxGeometry(4, 0.3, 1.5);
    const seat = new THREE.Mesh(seatGeometry, material);
    seat.position.y = 1;
    seat.castShadow = true;
    bench.add(seat);

    // Backrest (12 tris)
    const backrestGeometry = new THREE.BoxGeometry(4, 1.5, 0.2);
    const backrest = new THREE.Mesh(backrestGeometry, material);
    backrest.position.set(0, 1.75, -0.65);
    backrest.castShadow = true;
    bench.add(backrest);

    // No legs in low-poly version to save triangles

    return bench;
  }
}
