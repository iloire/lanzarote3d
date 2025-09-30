import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import DesertHouse from './DesertHouse';
import Pool from '../Pool';

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
}

interface LandscapingMaterials {
  plant: THREE.MeshLambertMaterial;
  rock: THREE.MeshLambertMaterial;
  path: THREE.MeshLambertMaterial;
  wood: THREE.MeshLambertMaterial;
  cushion: THREE.MeshLambertMaterial;
  metal: THREE.MeshLambertMaterial;
  firePit: THREE.MeshLambertMaterial;
  canopy: THREE.MeshLambertMaterial;
}

/**
 * Desert House with Pool component - Luxury desert house with swimming pool and landscaping
 */
export class DesertHouseWithPool extends SimpleThreeComponent {
  constructor(options: DesertHouseWithPoolOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DesertHouseWithPool',
      version: '1.0.0',
      description: 'Luxury desert house with swimming pool, landscaping, and modern amenities',
      tags: ['scenery', 'building', 'desert', 'luxury', 'pool', 'residential'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Sandy beige for adobe walls
      roofColor: '#DEB887', // Burlywood for flat roof
      doorColor: '#8B4513', // Saddle brown for wooden door
      windowColor: '#4682B4', // Steel blue for glass
      accentColor: '#D2691E', // Chocolate brown for accents
      poolWaterColor: '#0077BE', // Ocean blue
      poolTileColor: '#87CEEB', // Sky blue for pool tiles
      poolDeckColor: '#F5DEB3', // Matching beige for pool deck
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const compound = new THREE.Group();
    compound.name = 'DesertHouseWithPool';

    const options = this.options as DesertHouseWithPoolOptions;
    const scale = options.scale || 1;
    const isLowPoly = options.lowPoly || false;

    if (isLowPoly) {
      return this.createLowPolyDesertHouseWithPool(options, scale);
    }

    // Create materials
    const materials = this.createMaterials(options);

    // Add main house
    this.addDesertHouse(compound, options);

    // Add swimming pool
    this.addSwimmingPool(compound, options);

    // Add landscaping
    this.addPoolLandscaping(compound, materials);

    // Add outdoor amenities
    this.addOutdoorAmenities(compound, materials);

    // Apply scale to the entire compound
    if (scale !== 1) {
      compound.scale.setScalar(scale);
    }

    return compound;
  }

  /**
   * Create all material resources
   */
  private createMaterials(options: DesertHouseWithPoolOptions) {
    return {
      plant: new THREE.MeshLambertMaterial({ color: '#228B22' }),
      rock: new THREE.MeshLambertMaterial({ color: '#696969' }),
      path: new THREE.MeshLambertMaterial({ color: '#D2691E' }),
      wood: new THREE.MeshLambertMaterial({ color: '#8B4513' }),
      cushion: new THREE.MeshLambertMaterial({ color: '#F0E68C' }),
      metal: new THREE.MeshLambertMaterial({ color: '#C0C0C0' }),
      firePit: new THREE.MeshLambertMaterial({ color: '#2F4F4F' }),
      canopy: new THREE.MeshLambertMaterial({ color: '#FF6347', side: THREE.DoubleSide })
    };
  }

  /**
   * Add the main desert house
   */
  private addDesertHouse(compound: THREE.Group, options: DesertHouseWithPoolOptions): void {
    const desertHouse = new DesertHouse({
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      doorColor: options.doorColor,
      windowColor: options.windowColor,
      accentColor: options.accentColor,
      lowPoly: options.lowPoly,
      scale: 1,
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
    });

    const houseMesh = desertHouse.load(); // Now synchronous
    houseMesh.position.set(0, 0, 0);
    compound.add(houseMesh);
  }

  /**
   * Add the swimming pool
   */
  private addSwimmingPool(compound: THREE.Group, options: DesertHouseWithPoolOptions): void {
    const pool = new Pool({
      waterColor: options.poolWaterColor,
      tileColor: options.poolTileColor,
      deckColor: options.poolDeckColor,
      width: 12,
      length: 6,
      depth: 1.5,
      scale: 1,
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
    });

    const poolMesh = pool.load(); // Now synchronous
    poolMesh.position.set(0, 0, -25);
    compound.add(poolMesh);
  }

  /**
   * Add landscaping around the pool
   */
  private addPoolLandscaping(compound: THREE.Group, materials: LandscapingMaterials): void {

    // Desert plants around the pool
    const plantPositions = [
      new THREE.Vector3(-10, 0, -30),
      new THREE.Vector3(10, 0, -30),
      new THREE.Vector3(-8, 0, -18),
      new THREE.Vector3(8, 0, -18),
      new THREE.Vector3(0, 0, -35),
    ];

    plantPositions.forEach((pos, index) => {
      // Desert shrubs
      const shrubGeometry = new THREE.SphereGeometry(1.5, 8, 6);
      const shrub = new THREE.Mesh(shrubGeometry, materials.plant);
      shrub.position.copy(pos);
      shrub.position.y = 1;
      shrub.scale.set(1, 0.6, 1); // Flatten to make more bush-like
      shrub.castShadow = this.options.castShadow ?? true;
      compound.add(shrub);

      // Small rocks around plants
      if (index % 2 === 0) {
        const rockGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
        const rock = new THREE.Mesh(rockGeometry, materials.rock);
        rock.position.copy(pos);
        rock.position.x += 2;
        rock.position.y = 0.2;
        rock.rotation.y = Math.random() * Math.PI;
        compound.add(rock);
      }
    });

    // Stone pathway from house to pool
    const pathGeometry = new THREE.PlaneGeometry(2, 15);
    const path = new THREE.Mesh(pathGeometry, materials.path);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.05, -12);
    compound.add(path);

    // Decorative stone border around pool area
    const borderStones = 12;
    const radius = 10;
    for (let i = 0; i < borderStones; i++) {
      const angle = (i / borderStones) * Math.PI * 2;
      const stoneGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6);
      const stone = new THREE.Mesh(stoneGeometry, materials.rock);
      stone.position.set(
        Math.cos(angle) * radius,
        0.4,
        -25 + Math.sin(angle) * radius
      );
      stone.rotation.y = Math.random() * Math.PI;
      compound.add(stone);
    }
  }

  /**
   * Add outdoor furniture and amenities
   */
  private addOutdoorAmenities(compound: THREE.Group, materials: LandscapingMaterials): void {

    // Pool lounge chairs
    const loungePositions = [
      { pos: new THREE.Vector3(-6, 0, -20), rot: 0 },
      { pos: new THREE.Vector3(6, 0, -20), rot: 0 },
    ];

    loungePositions.forEach(({ pos, rot }) => {
      // Chair frame
      const chairFrameGeometry = new THREE.BoxGeometry(2, 0.3, 4);
      const chairFrame = new THREE.Mesh(chairFrameGeometry, materials.metal);
      chairFrame.position.copy(pos);
      chairFrame.position.y = 0.5;
      chairFrame.rotation.y = rot;
      compound.add(chairFrame);

      // Chair cushion
      const cushionGeometry = new THREE.BoxGeometry(1.8, 0.2, 3.8);
      const cushion = new THREE.Mesh(cushionGeometry, materials.cushion);
      cushion.position.copy(pos);
      cushion.position.y = 0.7;
      cushion.rotation.y = rot;
      compound.add(cushion);
    });

    // Outdoor dining table
    const tableGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.2);
    const table = new THREE.Mesh(tableGeometry, materials.wood);
    table.position.set(-12, 1.1, -15);
    compound.add(table);

    // Table base
    const tableBaseGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1);
    const tableBase = new THREE.Mesh(tableBaseGeometry, materials.metal);
    tableBase.position.set(-12, 0.5, -15);
    compound.add(tableBase);

    // Dining chairs around table
    const chairPositions = [
      new THREE.Vector3(-14.5, 0, -15),
      new THREE.Vector3(-9.5, 0, -15),
      new THREE.Vector3(-12, 0, -17.5),
      new THREE.Vector3(-12, 0, -12.5),
    ];

    chairPositions.forEach(pos => {
      // Chair seat
      const seatGeometry = new THREE.BoxGeometry(1, 0.2, 1);
      const seat = new THREE.Mesh(seatGeometry, materials.wood);
      seat.position.copy(pos);
      seat.position.y = 0.6;
      compound.add(seat);

      // Chair back
      const backGeometry = new THREE.BoxGeometry(1, 1, 0.2);
      const back = new THREE.Mesh(backGeometry, materials.wood);
      back.position.copy(pos);
      back.position.y = 1.1;
      back.position.z -= 0.4;
      compound.add(back);
    });

    // Parasol/umbrella
    const parasol = this.createParasol();
    parasol.position.set(-12, 0, -15);
    compound.add(parasol);

    // Outdoor fire pit for desert evenings
    const firePitGeometry = new THREE.CylinderGeometry(2, 2.2, 0.5);
    const firePit = new THREE.Mesh(firePitGeometry, materials.firePit);
    firePit.position.set(15, 0.25, -10);
    compound.add(firePit);

    // Fire pit stones
    const stonePositions = [
      new THREE.Vector3(13, 0, -8),
      new THREE.Vector3(17, 0, -8),
      new THREE.Vector3(13, 0, -12),
      new THREE.Vector3(17, 0, -12),
    ];

    stonePositions.forEach(pos => {
      const stoneGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
      const stone = new THREE.Mesh(stoneGeometry, materials.rock);
      stone.position.copy(pos);
      stone.position.y = 0.2;
      compound.add(stone);
    });
  }

  private createParasol(): THREE.Group {
    const parasol = new THREE.Group();

    // Create materials for parasol
    const woodMaterial = new THREE.MeshLambertMaterial({ color: '#8B4513' });
    const canopyMaterial = new THREE.MeshLambertMaterial({ color: '#FF6347', side: THREE.DoubleSide });

    // Parasol pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
    const pole = new THREE.Mesh(poleGeometry, woodMaterial);
    pole.position.y = 1.5;
    parasol.add(pole);

    // Parasol canopy
    const canopyGeometry = new THREE.ConeGeometry(3, 1, 8);
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 3.5;
    canopy.rotation.x = Math.PI;
    parasol.add(canopy);

    return parasol;
  }

  /**
   * Create low-poly version of the desert house with pool
   */
  private createLowPolyDesertHouseWithPool(options: DesertHouseWithPoolOptions, scale: number): THREE.Object3D {
    const compound = new THREE.Group();
    compound.name = 'DesertHouseWithPool (Low-Poly)';

    // Simplified materials
    const materials = {
      wall: new THREE.MeshLambertMaterial({ color: options.wallColor }),
      roof: new THREE.MeshLambertMaterial({ color: options.roofColor }),
      door: new THREE.MeshLambertMaterial({ color: options.doorColor }),
      window: new THREE.MeshLambertMaterial({ color: options.windowColor }),
      poolWater: new THREE.MeshLambertMaterial({ color: options.poolWaterColor }),
      poolTile: new THREE.MeshLambertMaterial({ color: options.poolTileColor }),
    };

    // Simple main house - just main structure, no decorations
    const houseGeometry = new THREE.BoxGeometry(18, 14, 16);
    const house = new THREE.Mesh(houseGeometry, materials.wall);
    house.position.set(0, 7, 0);
    house.castShadow = this.options.castShadow ?? true;
    house.receiveShadow = this.options.receiveShadow ?? true;
    compound.add(house);

    // Simple flat roof
    const roofGeometry = new THREE.BoxGeometry(19, 1, 17);
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 14.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    compound.add(roof);

    // Simple door
    const doorGeometry = new THREE.BoxGeometry(3, 6, 0.3);
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 3, 8.15);
    compound.add(door);

    // Single simple window
    const windowGeometry = new THREE.BoxGeometry(2, 2, 0.2);
    const window = new THREE.Mesh(windowGeometry, materials.window);
    window.position.set(-4, 8, 8.1);
    compound.add(window);

    // Simple pool - just water and basic structure
    const poolWaterGeometry = new THREE.BoxGeometry(10, 0.5, 5);
    const poolWater = new THREE.Mesh(poolWaterGeometry, materials.poolWater);
    poolWater.position.set(0, 0.25, -20);
    compound.add(poolWater);

    const poolEdgeGeometry = new THREE.BoxGeometry(12, 1, 7);
    const poolEdge = new THREE.Mesh(poolEdgeGeometry, materials.poolTile);
    poolEdge.position.set(0, 0, -20);
    compound.add(poolEdge);

    // Apply scale
    if (scale !== 1) {
      compound.scale.setScalar(scale);
    }

    return compound;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DesertHouseWithPoolOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as DesertHouseWithPoolOptions;

    return {
      name: 'DesertHouseWithPool',
      version: '1.0.0',
      type: 'building',
      subtype: 'luxury_residential',
      style: 'desert_modern',
      features: ['swimming_pool', 'outdoor_dining', 'fire_pit', 'landscaping'],
      wallColor: options.wallColor,
      poolWaterColor: options.poolWaterColor,
      scale: options.scale,
    };
  }
}

// Legacy compatibility method - synchronous load for backward compatibility
export class DesertHouseWithPoolWithLegacyLoad extends DesertHouseWithPool {
  loadWithGui(gui?: any): THREE.Object3D {
    return this.loadSync();
  }
}

// Type-safe legacy compatibility layer
interface DesertHouseWithPoolWithSyncLoad extends DesertHouseWithPoolWithLegacyLoad {
  load(gui?: any): THREE.Object3D;
}

const DesertHouseWithPoolConstructor = DesertHouseWithPoolWithLegacyLoad as unknown as {
  new(options?: DesertHouseWithPoolOptions): DesertHouseWithPoolWithSyncLoad;
};

// Override load method to be synchronous for backward compatibility
DesertHouseWithPoolConstructor.prototype.load = function(gui?: any): THREE.Object3D {
  return this.loadWithGui(gui);
};

export default DesertHouseWithPoolConstructor as unknown as typeof DesertHouseWithPool;