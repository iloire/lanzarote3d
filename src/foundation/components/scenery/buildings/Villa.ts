import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';

export interface VillaOptions extends SimpleComponentOptions {
  wallColor?: string;
  accentColor?: string;
  roofColor?: string;
  windowColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
  rooms?: {
    bedrooms?: number;
    bathrooms?: number;
    livingRooms?: number;
    kitchens?: number;
    garages?: number;
  };
  size?: 'small' | 'medium' | 'large' | 'mansion';
}

/**
 * Villa building component - Large luxury house with modern amenities
 */
export class Villa extends LODComponent {
  private villaSize: 'small' | 'medium' | 'large' | 'mansion';
  private roomConfig: {
    bedrooms: number;
    bathrooms: number;
    livingRooms: number;
    kitchens: number;
    garages: number;
  };

  constructor(options: VillaOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Villa',
      version: '1.0.0',
      description: 'Large luxury villa with modern architecture and amenities',
      tags: ['scenery', 'building', 'modern', 'luxury', 'residential'],
    };

    super(metadata, {
      wallColor: '#F5F5DC', // Beige for luxury walls
      accentColor: '#8B4513', // Brown accents
      roofColor: '#DEB887', // Burlywood matching desert house
      windowColor: '#000080', // Navy blue glass
      scale: 1,
      ...options,
    });

    // Set villa size
    this.villaSize = options.size || 'medium';

    // Set default room configuration based on size
    const defaultRooms = this.getDefaultRoomConfiguration(this.villaSize);
    this.roomConfig = {
      ...defaultRooms,
      ...options.rooms,
    };

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  private getDefaultRoomConfiguration(size: 'small' | 'medium' | 'large' | 'mansion') {
    const configs = {
      small: { bedrooms: 2, bathrooms: 2, livingRooms: 1, kitchens: 1, garages: 1 },
      medium: { bedrooms: 4, bathrooms: 3, livingRooms: 2, kitchens: 1, garages: 2 },
      large: { bedrooms: 6, bathrooms: 4, livingRooms: 3, kitchens: 2, garages: 3 },
      mansion: { bedrooms: 8, bathrooms: 6, livingRooms: 4, kitchens: 2, garages: 4 },
    };
    return configs[size];
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createUltraLowLODContent(): THREE.Object3D {
    // ULTRA_LOW: ~20-50 polygons
    // Single box + roof, no columns, no windows, no wings
    const villa = new THREE.Group();
    villa.name = 'Villa (Ultra Low LOD)';

    const options = this.options as VillaOptions;
    const scale = options.scale || 1;

    // Single wall material
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `villa_wall_ultra_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `villa_roof_ultra_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Single box representing entire villa
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'villa_ultra_low_body',
      () => new THREE.BoxGeometry(30, 20, 25)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 10, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(mainBody);

    // Single simple roof
    const mainRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_ultra_low_roof',
      () => new THREE.BoxGeometry(32, 1, 27)
    );
    const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
    mainRoof.position.set(0, 20.5, 0);
    mainRoof.castShadow = this.options.castShadow ?? true;
    villa.add(mainRoof);

    // Apply scale
    if (scale !== 1) {
      villa.scale.setScalar(scale);
    }

    return villa;
  }

  protected createLowLODContent(): THREE.Object3D {
    // LOW: ~100-300 polygons
    // Main building + simple roof, 2 simple columns, no windows or decorative elements
    const villa = new THREE.Group();
    villa.name = 'Villa (Low LOD)';

    const options = this.options as VillaOptions;
    const scale = options.scale || 1;

    const wallMaterial = resourceManager.getOrCreateMaterial(
      `villa_wall_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `villa_accent_low_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `villa_roof_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Main villa structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'villa_low_main_body',
      () => new THREE.BoxGeometry(30, 20, 25)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 10, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(mainBody);

    // Main roof
    const mainRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_low_main_roof',
      () => new THREE.BoxGeometry(32, 1, 27)
    );
    const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
    mainRoof.position.set(0, 20.5, 0);
    mainRoof.castShadow = this.options.castShadow ?? true;
    villa.add(mainRoof);

    // Simple box columns (2 columns only)
    const columnGeometry = resourceManager.getOrCreateGeometry(
      'villa_low_column',
      () => new THREE.BoxGeometry(1.5, 20, 1.5)
    );

    for (let i = 0; i < 2; i++) {
      const column = new THREE.Mesh(columnGeometry, accentMaterial);
      column.position.set(-3 + i * 6, 10, 12.5);
      column.castShadow = this.options.castShadow ?? true;
      villa.add(column);
    }

    // Apply scale
    if (scale !== 1) {
      villa.scale.setScalar(scale);
    }

    return villa;
  }

  protected createMediumLODContent(): THREE.Object3D {
    // MEDIUM: ~500-1000 polygons
    // Main building + wings + roofs, simple columns (boxes instead of cylinders), simple windows (no frames)
    const villa = new THREE.Group();
    villa.name = 'Villa (Medium LOD)';

    const options = this.options as VillaOptions;
    const scale = options.scale || 1;

    const wallMaterial = resourceManager.getOrCreateMaterial(
      `villa_wall_medium_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `villa_accent_medium_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `villa_roof_medium_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `villa_window_medium_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    // Main villa structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_main_body',
      () => new THREE.BoxGeometry(30, 20, 25)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 10, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(mainBody);

    // Left wing
    const leftWingGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_left_wing',
      () => new THREE.BoxGeometry(20, 16, 20)
    );
    const leftWing = new THREE.Mesh(leftWingGeometry, wallMaterial);
    leftWing.position.set(-25, 8, 0);
    leftWing.castShadow = this.options.castShadow ?? true;
    leftWing.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(leftWing);

    // Right wing
    const rightWingGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_right_wing',
      () => new THREE.BoxGeometry(20, 16, 20)
    );
    const rightWing = new THREE.Mesh(rightWingGeometry, wallMaterial);
    rightWing.position.set(25, 8, 0);
    rightWing.castShadow = this.options.castShadow ?? true;
    rightWing.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(rightWing);

    // Roofs
    const mainRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_main_roof',
      () => new THREE.BoxGeometry(32, 1, 27)
    );
    const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
    mainRoof.position.set(0, 20.5, 0);
    mainRoof.castShadow = this.options.castShadow ?? true;
    villa.add(mainRoof);

    const wingRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_wing_roof',
      () => new THREE.BoxGeometry(22, 1, 22)
    );
    const leftRoof = new THREE.Mesh(wingRoofGeometry, roofMaterial);
    leftRoof.position.set(-25, 16.5, 0);
    leftRoof.castShadow = this.options.castShadow ?? true;
    villa.add(leftRoof);

    const rightRoof = new THREE.Mesh(wingRoofGeometry, roofMaterial);
    rightRoof.position.set(25, 16.5, 0);
    rightRoof.castShadow = this.options.castShadow ?? true;
    villa.add(rightRoof);

    // Simple box columns (no cylinders)
    const columnGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_column',
      () => new THREE.BoxGeometry(1.5, 20, 1.5)
    );

    for (let i = 0; i < 2; i++) {
      const column = new THREE.Mesh(columnGeometry, accentMaterial);
      column.position.set(-3 + i * 6, 10, 12.5);
      column.castShadow = this.options.castShadow ?? true;
      villa.add(column);
    }

    // Simple windows (no frames)
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'villa_medium_window',
      () => new THREE.BoxGeometry(8, 4, 0.3)
    );

    // Main building - one central window
    const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow.position.set(0, 12, 12.65);
    villa.add(frontWindow);

    // Wings - front-facing windows
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-25, 10, 10.15);
    villa.add(leftWindow);

    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(25, 10, 10.15);
    villa.add(rightWindow);

    // Apply scale
    if (scale !== 1) {
      villa.scale.setScalar(scale);
    }

    return villa;
  }

  protected createHighLODContent(): THREE.Object3D {
    // HIGH: ~2000+ polygons
    // Full detail (current implementation with all features)
    const villa = new THREE.Group();
    villa.name = 'Villa (High LOD)';

    const options = this.options as VillaOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `villa_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `villa_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `villa_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `villa_window_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    const frameMaterial = resourceManager.getOrCreateMaterial(
      'villa_frame',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
    );

    // Main villa structure - large and imposing
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'villa_main_body',
      () => new THREE.BoxGeometry(30, 20, 25)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 10, 0); // Position so bottom is at y=0 (ground level)
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(mainBody);

    // Left wing
    const leftWingGeometry = resourceManager.getOrCreateGeometry(
      'villa_left_wing',
      () => new THREE.BoxGeometry(20, 16, 20)
    );
    const leftWing = new THREE.Mesh(leftWingGeometry, wallMaterial);
    leftWing.position.set(-25, 8, 0); // Adjusted for ground level positioning
    leftWing.castShadow = this.options.castShadow ?? true;
    leftWing.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(leftWing);

    // Right wing
    const rightWingGeometry = resourceManager.getOrCreateGeometry(
      'villa_right_wing',
      () => new THREE.BoxGeometry(20, 16, 20)
    );
    const rightWing = new THREE.Mesh(rightWingGeometry, wallMaterial);
    rightWing.position.set(25, 8, 0); // Adjusted for ground level positioning
    rightWing.castShadow = this.options.castShadow ?? true;
    rightWing.receiveShadow = this.options.receiveShadow ?? true;
    villa.add(rightWing);

    // Modern flat roofs
    const mainRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_main_roof',
      () => new THREE.BoxGeometry(32, 1, 27)
    );
    const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
    mainRoof.position.set(0, 20.5, 0); // Adjusted for main body repositioning
    mainRoof.castShadow = this.options.castShadow ?? true;
    villa.add(mainRoof);

    const leftRoofGeometry = resourceManager.getOrCreateGeometry(
      'villa_wing_roof',
      () => new THREE.BoxGeometry(22, 1, 22)
    );
    const leftRoof = new THREE.Mesh(leftRoofGeometry, roofMaterial);
    leftRoof.position.set(-25, 16.5, 0); // Adjusted for wing repositioning
    leftRoof.castShadow = this.options.castShadow ?? true;
    villa.add(leftRoof);

    const rightRoof = new THREE.Mesh(leftRoofGeometry, roofMaterial);
    rightRoof.position.set(25, 16.5, 0); // Adjusted for wing repositioning
    rightRoof.castShadow = this.options.castShadow ?? true;
    villa.add(rightRoof);

    // Grand entrance columns (full detail cylinders)
    const columnGeometry = resourceManager.getOrCreateGeometry(
      'villa_column',
      () => new THREE.CylinderGeometry(1, 1, 20)
    );

    for (let i = 0; i < 4; i++) {
      const column = new THREE.Mesh(columnGeometry, accentMaterial);
      column.position.set(-6 + i * 4, 10, 12.5);
      column.castShadow = this.options.castShadow ?? true;
      villa.add(column);
    }

    // Full detail windows with frames
    const panoramicWindowGeometry = resourceManager.getOrCreateGeometry(
      'villa_panoramic_window',
      () => new THREE.BoxGeometry(20, 8, 0.5)
    );
    const frontWindow = new THREE.Mesh(panoramicWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 12, 12.75);
    villa.add(frontWindow);

    // Window frames
    const panoramicFrameGeometry = resourceManager.getOrCreateGeometry(
      'villa_panoramic_frame',
      () => new THREE.BoxGeometry(21, 9, 1)
    );
    const frontFrame = new THREE.Mesh(panoramicFrameGeometry, frameMaterial);
    frontFrame.position.set(0, 12, 12.5);
    villa.add(frontFrame);

    // Side windows for wings
    const sideWindowGeometry = resourceManager.getOrCreateGeometry(
      'villa_side_window',
      () => new THREE.BoxGeometry(12, 6, 0.5)
    );

    // Left wing windows
    const leftFrontWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftFrontWindow.position.set(-25, 10, 10.25);
    villa.add(leftFrontWindow);

    const leftSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftSideWindow.rotation.y = Math.PI / 2;
    leftSideWindow.position.set(-35.25, 10, 0);
    villa.add(leftSideWindow);

    // Right wing windows
    const rightFrontWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightFrontWindow.position.set(25, 10, 10.25);
    villa.add(rightFrontWindow);

    const rightSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightSideWindow.rotation.y = Math.PI / 2;
    rightSideWindow.position.set(35.25, 10, 0);
    villa.add(rightSideWindow);

    // Decorative elements
    // Swimming pool (decorative)
    const poolGeometry = resourceManager.getOrCreateGeometry(
      'villa_pool',
      () => new THREE.BoxGeometry(15, 1, 8)
    );
    const poolMaterial = resourceManager.getOrCreateMaterial(
      'villa_pool_water',
      () => new THREE.MeshLambertMaterial({ color: '#0077BE', transparent: true, opacity: 0.8 })
    );
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(0, 0.5, -20);
    villa.add(pool);

    // Garden terrace
    const terraceGeometry = resourceManager.getOrCreateGeometry(
      'villa_terrace',
      () => new THREE.BoxGeometry(40, 1, 15)
    );
    const terrace = new THREE.Mesh(terraceGeometry, accentMaterial);
    terrace.position.set(0, 0.5, 20);
    villa.add(terrace);

    // Apply scale
    if (scale !== 1) {
      villa.scale.setScalar(scale);
    }

    return villa;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as VillaOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as VillaOptions;

    return {
      name: 'Villa',
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'luxury',
      wallColor: options.wallColor,
      accentColor: options.accentColor,
      scale: options.scale,
    };
  }
}

export default Villa;