import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { DesertHouse } from './DesertHouse';
import { Pool } from '../Pool';

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

  protected async createSyncContent(): Promise<THREE.Object3D> {
    const compound = new THREE.Group();
    compound.name = 'DesertHouseWithPool';

    const options = this.options as DesertHouseWithPoolOptions;
    const scale = options.scale || 1;

    // Create the desert house
    const desertHouse = new DesertHouse({
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      doorColor: options.doorColor,
      windowColor: options.windowColor,
      accentColor: options.accentColor,
      scale: 1, // Don't scale the house components individually
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
    });

    const houseMesh = await desertHouse.load();
    houseMesh.position.set(0, 0, 0);
    compound.add(houseMesh);

    // Create the swimming pool positioned behind the house
    const pool = new Pool({
      waterColor: options.poolWaterColor,
      tileColor: options.poolTileColor,
      deckColor: options.poolDeckColor,
      width: 12,
      length: 6,
      depth: 1.5,
      scale: 1, // Don't scale pool components individually
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
    });

    const poolMesh = await pool.load();
    poolMesh.position.set(0, 0, -25); // Position pool behind the house
    compound.add(poolMesh);

    // Add landscaping elements around the pool
    this.addPoolLandscaping(compound);

    // Add outdoor furniture and amenities
    this.addOutdoorAmenities(compound);

    // Apply scale to the entire compound
    if (scale !== 1) {
      compound.scale.setScalar(scale);
    }

    return compound;
  }

  private addPoolLandscaping(compound: THREE.Group): void {
    // Create materials for landscaping
    const plantMaterial = new THREE.MeshLambertMaterial({ color: '#228B22' });
    const rockMaterial = new THREE.MeshLambertMaterial({ color: '#696969' });
    const pathMaterial = new THREE.MeshLambertMaterial({ color: '#D2691E' });

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
      const shrub = new THREE.Mesh(shrubGeometry, plantMaterial);
      shrub.position.copy(pos);
      shrub.position.y = 1;
      shrub.scale.set(1, 0.6, 1); // Flatten to make more bush-like
      shrub.castShadow = this.options.castShadow ?? true;
      compound.add(shrub);

      // Small rocks around plants
      if (index % 2 === 0) {
        const rockGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.copy(pos);
        rock.position.x += 2;
        rock.position.y = 0.2;
        rock.rotation.y = Math.random() * Math.PI;
        compound.add(rock);
      }
    });

    // Stone pathway from house to pool
    const pathGeometry = new THREE.PlaneGeometry(2, 15);
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.05, -12);
    compound.add(path);

    // Decorative stone border around pool area
    const borderStones = 12;
    const radius = 10;
    for (let i = 0; i < borderStones; i++) {
      const angle = (i / borderStones) * Math.PI * 2;
      const stoneGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6);
      const stone = new THREE.Mesh(stoneGeometry, rockMaterial);
      stone.position.set(
        Math.cos(angle) * radius,
        0.4,
        -25 + Math.sin(angle) * radius
      );
      stone.rotation.y = Math.random() * Math.PI;
      compound.add(stone);
    }
  }

  private addOutdoorAmenities(compound: THREE.Group): void {
    // Create materials for furniture
    const woodMaterial = new THREE.MeshLambertMaterial({ color: '#8B4513' });
    const cushionMaterial = new THREE.MeshLambertMaterial({ color: '#F0E68C' });
    const metalMaterial = new THREE.MeshLambertMaterial({ color: '#C0C0C0' });

    // Pool lounge chairs
    const loungePositions = [
      { pos: new THREE.Vector3(-6, 0, -20), rot: 0 },
      { pos: new THREE.Vector3(6, 0, -20), rot: 0 },
    ];

    loungePositions.forEach(({ pos, rot }) => {
      // Chair frame
      const chairFrameGeometry = new THREE.BoxGeometry(2, 0.3, 4);
      const chairFrame = new THREE.Mesh(chairFrameGeometry, metalMaterial);
      chairFrame.position.copy(pos);
      chairFrame.position.y = 0.5;
      chairFrame.rotation.y = rot;
      compound.add(chairFrame);

      // Chair cushion
      const cushionGeometry = new THREE.BoxGeometry(1.8, 0.2, 3.8);
      const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
      cushion.position.copy(pos);
      cushion.position.y = 0.7;
      cushion.rotation.y = rot;
      compound.add(cushion);
    });

    // Outdoor dining table
    const tableGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.2);
    const table = new THREE.Mesh(tableGeometry, woodMaterial);
    table.position.set(-12, 1.1, -15);
    compound.add(table);

    // Table base
    const tableBaseGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1);
    const tableBase = new THREE.Mesh(tableBaseGeometry, metalMaterial);
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
      const seat = new THREE.Mesh(seatGeometry, woodMaterial);
      seat.position.copy(pos);
      seat.position.y = 0.6;
      compound.add(seat);

      // Chair back
      const backGeometry = new THREE.BoxGeometry(1, 1, 0.2);
      const back = new THREE.Mesh(backGeometry, woodMaterial);
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
    const firePitMaterial = new THREE.MeshLambertMaterial({ color: '#2F4F4F' });
    const firePit = new THREE.Mesh(firePitGeometry, firePitMaterial);
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
      const stoneMaterial = new THREE.MeshLambertMaterial({ color: '#696969' });
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.copy(pos);
      stone.position.y = 0.2;
      compound.add(stone);
    });
  }

  private createParasol(): THREE.Group {
    const parasol = new THREE.Group();

    // Parasol pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: '#8B4513' });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.5;
    parasol.add(pole);

    // Parasol canopy
    const canopyGeometry = new THREE.ConeGeometry(3, 1, 8);
    const canopyMaterial = new THREE.MeshLambertMaterial({
      color: '#FF6347',
      side: THREE.DoubleSide
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 3.5;
    canopy.rotation.x = Math.PI;
    parasol.add(canopy);

    return parasol;
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

// Legacy export for backward compatibility with old synchronous API
const DesertHouseWithPoolLegacy = DesertHouseWithPool as any;

// Add legacy load method that returns mesh directly
DesertHouseWithPoolLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default DesertHouseWithPoolLegacy;