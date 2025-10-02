import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';

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

/**
 * Material set for townhouse construction
 */
interface TownhouseMaterials {
  wall: THREE.Material;
  roof: THREE.Material;
  door: THREE.Material;
  window: THREE.Material;
  trim: THREE.Material;
}

/**
 * Townhouse building component - Multi-story urban building
 */
export class Townhouse extends LODComponent {
  constructor(options: TownhouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Townhouse',
      version: '2.0.0',
      description: 'Multi-story urban townhouse with traditional brick architecture. Supports 4 LOD levels.',
      tags: ['scenery', 'building', 'urban', 'multi-story', 'residential', 'lod'],
    };

    super(metadata, {
      wallColor: '#FFFACD', // Light yellow (lemon chiffon)
      roofColor: '#DEB887', // Burlywood matching desert house
      doorColor: '#228B22', // Forest green door
      windowColor: '#4169E1', // Royal blue windows
      trimColor: '#FFFFFF', // White trim
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  /**
   * ULTRA_LOW LOD: ~20-50 polygons
   * Single box body + roof, no door, no windows
   */
  protected createUltraLowLODContent(): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse (Ultra Low LOD)';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;

    // Materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_wall_ultra_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_roof_ultra_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Single box representing entire building body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_ultra_low_body',
      () => new THREE.BoxGeometry(12, 16, 15)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 8, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(body);

    // Single simple roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_ultra_low_roof',
      () => new THREE.BoxGeometry(14, 3, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 17.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  /**
   * LOW LOD: ~100-200 polygons
   * Body + simple roof + door, no windows
   */
  protected createLowLODContent(): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse (Low LOD)';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;

    // Materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_wall_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_roof_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_door_low_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    // Main building body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_low_body',
      () => new THREE.BoxGeometry(12, 16, 15)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 8, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(body);

    // Simple roof - no peak
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_low_roof',
      () => new THREE.BoxGeometry(13, 2, 16)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 17, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Simple door - no frame or steps
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_low_door',
      () => new THREE.BoxGeometry(2.5, 6, 0.3)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 3, 7.65);
    townhouse.add(door);

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  /**
   * MEDIUM LOD: ~500-800 polygons
   * Body + roof + peak + door + simplified windows (no frames), no decorative elements
   */
  protected createMediumLODContent(): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse (Medium LOD)';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;

    // Materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_wall_medium_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_roof_medium_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_door_medium_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `townhouse_window_medium_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    // Main building body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_medium_body',
      () => new THREE.BoxGeometry(12, 16, 15)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 8, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(body);

    // Roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_medium_roof',
      () => new THREE.BoxGeometry(14, 3, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 17.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Roof peak
    const peakGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_medium_peak',
      () => new THREE.BoxGeometry(2, 4, 17)
    );
    const peak = new THREE.Mesh(peakGeometry, roofMaterial);
    peak.position.set(0, 20, 0);
    peak.castShadow = this.options.castShadow ?? true;
    townhouse.add(peak);

    // Door (no frame or steps)
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_medium_door',
      () => new THREE.BoxGeometry(3, 7, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 3.5, 7.75);
    townhouse.add(door);

    // Simplified windows (no frames) - fewer windows than high LOD
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_medium_window',
      () => new THREE.BoxGeometry(2.5, 3, 0.3)
    );

    // Ground floor windows (2 windows)
    for (let i = 0; i < 2; i++) {
      const x = -4 + i * 8;
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, 4, 7.65);
      townhouse.add(window);
    }

    // Second floor windows (2 windows)
    for (let i = 0; i < 2; i++) {
      const x = -3 + i * 6;
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, 12, 7.65);
      townhouse.add(window);
    }

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  /**
   * HIGH LOD: ~1500-2000 polygons
   * Full detail with all features
   */
  protected createHighLODContent(): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse (High LOD)';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;

    // Create materials
    const materials = this.createMaterials(options);

    // Add main structure
    this.addMainStructure(townhouse, materials);

    // Add entrance
    this.addEntrance(townhouse, materials);

    // Add windows
    this.addWindows(townhouse, materials);

    // Add decorative elements
    this.addDecorativeElements(townhouse, materials);

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  /**
   * Create all material resources
   */
  private createMaterials(options: TownhouseOptions): TownhouseMaterials {
    return {
      wall: resourceManager.getOrCreateMaterial(
        `townhouse_wall_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `townhouse_roof_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `townhouse_door_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `townhouse_window_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      ),
      trim: resourceManager.getOrCreateMaterial(
        `townhouse_trim_${options.trimColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.trimColor })
      )
    };
  }

  /**
   * Add main structure (walls, roof, and roof peak)
   */
  private addMainStructure(townhouse: THREE.Group, materials: TownhouseMaterials): void {

    // Main townhouse structure - properly proportioned 2-story building
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_main_body',
      () => new THREE.BoxGeometry(12, 16, 15)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 8, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(mainBody);

    // Traditional sloped roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof',
      () => new THREE.BoxGeometry(14, 3, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 17.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Roof peak
    const peakGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof_peak',
      () => new THREE.BoxGeometry(2, 4, 17)
    );
    const peak = new THREE.Mesh(peakGeometry, materials.roof);
    peak.position.set(0, 20, 0);
    peak.castShadow = this.options.castShadow ?? true;
    townhouse.add(peak);
  }

  /**
   * Add entrance (door, frame, and steps)
   */
  private addEntrance(townhouse: THREE.Group, materials: TownhouseMaterials): void {

    // Front door
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door',
      () => new THREE.BoxGeometry(3, 7, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 3.5, 7.75);
    townhouse.add(door);

    // Door frame
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door_frame',
      () => new THREE.BoxGeometry(4, 8, 1)
    );
    const doorFrame = new THREE.Mesh(doorFrameGeometry, materials.trim);
    doorFrame.position.set(0, 3.5, 7.5);
    townhouse.add(doorFrame);

    // Front steps
    const stepsGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_steps',
      () => new THREE.BoxGeometry(6, 1, 3)
    );
    const steps = new THREE.Mesh(stepsGeometry, materials.trim);
    steps.position.set(0, -0.5, 9);
    townhouse.add(steps);
  }

  /**
   * Add windows for both floors
   */
  private addWindows(townhouse: THREE.Group, materials: TownhouseMaterials): void {

    // Full detail windows with frames
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_window',
      () => new THREE.BoxGeometry(2.5, 3, 0.3)
    );

    const frameGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_window_frame',
      () => new THREE.BoxGeometry(3, 3.5, 0.5)
    );

    // Ground floor windows (2 windows) - positioned away from door
    const groundFloorY = 4;
    for (let i = 0; i < 2; i++) {
      const x = -4 + i * 8; // Better spacing away from center door

      const window = new THREE.Mesh(windowGeometry, materials.window);
      window.position.set(x, groundFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, materials.trim);
      frame.position.set(x, groundFloorY, 7.5);
      townhouse.add(frame);
    }

    // Second floor windows (3 windows) - evenly spaced across facade
    const secondFloorY = 12;
    for (let i = 0; i < 3; i++) {
      const x = -4 + i * 4; // Even spacing across the front

      const window = new THREE.Mesh(windowGeometry, materials.window);
      window.position.set(x, secondFloorY, 7.65);
      townhouse.add(window);

      const frame = new THREE.Mesh(frameGeometry, materials.trim);
      frame.position.set(x, secondFloorY, 7.5);
      townhouse.add(frame);
    }

    // Side windows - one on each floor
    const sideWindow1 = new THREE.Mesh(windowGeometry, materials.window);
    sideWindow1.position.set(6.15, 4, 0);
    townhouse.add(sideWindow1);

    const sideFrame1 = new THREE.Mesh(frameGeometry, materials.trim);
    sideFrame1.position.set(6, 4, 0);
    townhouse.add(sideFrame1);

    const sideWindow2 = new THREE.Mesh(windowGeometry, materials.window);
    sideWindow2.position.set(6.15, 12, 0);
    townhouse.add(sideWindow2);

    const sideFrame2 = new THREE.Mesh(frameGeometry, materials.trim);
    sideFrame2.position.set(6, 12, 0);
    townhouse.add(sideFrame2);
  }

  /**
   * Add decorative elements (cornices and chimney)
   */
  private addDecorativeElements(townhouse: THREE.Group, materials: TownhouseMaterials): void {

    // Decorative cornices between floors
    const corniceGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_cornice',
      () => new THREE.BoxGeometry(13, 0.5, 16)
    );

    const cornice1 = new THREE.Mesh(corniceGeometry, materials.trim);
    cornice1.position.set(0, 8, 0); // Floor separator between 1st and 2nd floor
    townhouse.add(cornice1);

    const cornice2 = new THREE.Mesh(corniceGeometry, materials.trim);
    cornice2.position.set(0, 16, 0); // Top of building before roof
    townhouse.add(cornice2);

    // Chimney
    const chimneyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_chimney',
      () => new THREE.BoxGeometry(2, 8, 2)
    );
    const chimney = new THREE.Mesh(chimneyGeometry, materials.wall);
    chimney.position.set(4, 20, 6);
    chimney.castShadow = this.options.castShadow ?? true;
    townhouse.add(chimney);
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
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'urban',
      floors: 2,
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default Townhouse;