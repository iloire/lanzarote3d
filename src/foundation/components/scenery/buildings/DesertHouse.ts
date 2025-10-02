import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';

export interface DesertHouseOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  accentColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

/**
 * Desert House building component - Simple adobe-style house typical of desert regions
 */
export class DesertHouse extends LODComponent {
  constructor(options: DesertHouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DesertHouse',
      version: '1.0.0',
      description: 'Simple desert adobe-style house with sun-baked architecture',
      tags: ['scenery', 'building', 'desert', 'adobe', 'residential'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Sandy beige for adobe walls
      roofColor: '#DEB887', // Burlywood for flat roof
      doorColor: '#8B4513', // Saddle brown for wooden door
      windowColor: '#4682B4', // Steel blue for glass
      accentColor: '#D2691E', // Chocolate brown for accents
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
   * Single box body + simple roof, no windows, no door, no decorative elements
   */
  protected createUltraLowLODContent(): THREE.Object3D {
    const house = new THREE.Group();
    house.name = 'DesertHouse (Ultra Low LOD)';

    const options = this.options as DesertHouseOptions;
    const scale = options.scale || 1;

    // Single material for walls
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_wall_ultra_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `desert_house_roof_ultra_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Single box for main structure
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_ultra_low_body',
      () => new THREE.BoxGeometry(18, 14, 16)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 7, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    house.add(body);

    // Simple flat roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_ultra_low_roof',
      () => new THREE.BoxGeometry(19, 1, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 14.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    house.add(roof);

    // Apply scale
    if (scale !== 1) {
      house.scale.setScalar(scale);
    }

    return house;
  }

  /**
   * LOW LOD: ~100-200 polygons
   * Body + roof + simple door, minimal windows (no frames, no decorative elements)
   */
  protected createLowLODContent(): THREE.Object3D {
    const house = new THREE.Group();
    house.name = 'DesertHouse (Low LOD)';

    const options = this.options as DesertHouseOptions;
    const scale = options.scale || 1;

    // Simplified materials
    const materials = {
      wall: resourceManager.getOrCreateMaterial(
        `desert_house_wall_low_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `desert_house_roof_low_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `desert_house_door_low_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `desert_house_window_low_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      )
    };

    // Main house structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_main_body_low',
      () => new THREE.BoxGeometry(18, 14, 16)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 7, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    house.add(mainBody);

    // Simple flat roof - no parapet
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_roof_low',
      () => new THREE.BoxGeometry(19, 1, 17)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 14.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    house.add(roof);

    // Simple door - no arch
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_door_low',
      () => new THREE.BoxGeometry(3, 6, 0.3)
    );
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 3, 8.15);
    house.add(door);

    // Single simple window - no frames
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_window_low',
      () => new THREE.BoxGeometry(2, 2, 0.2)
    );
    const window = new THREE.Mesh(windowGeometry, materials.window);
    window.position.set(0, 8, 8.1);
    house.add(window);

    // Apply scale
    if (scale !== 1) {
      house.scale.setScalar(scale);
    }

    return house;
  }

  /**
   * MEDIUM LOD: ~500-800 polygons
   * Body + roof + parapet + door + windows (no frames), no decorative elements
   */
  protected createMediumLODContent(): THREE.Object3D {
    const house = new THREE.Group();
    house.name = 'DesertHouse (Medium LOD)';

    const options = this.options as DesertHouseOptions;
    const scale = options.scale || 1;

    // Create materials
    const materials = {
      wall: resourceManager.getOrCreateMaterial(
        `desert_house_wall_medium_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `desert_house_roof_medium_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `desert_house_door_medium_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `desert_house_window_medium_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      )
    };

    // Main house structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_main_body_medium',
      () => new THREE.BoxGeometry(18, 14, 16)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 7, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    house.add(mainBody);

    // Flat roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_roof_medium',
      () => new THREE.BoxGeometry(20, 1.5, 18)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 14.75, 0);
    roof.castShadow = this.options.castShadow ?? true;
    house.add(roof);

    // Parapet wall around roof edge
    const parapetGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_parapet_medium',
      () => new THREE.BoxGeometry(20.5, 2, 18.5)
    );
    const parapet = new THREE.Mesh(parapetGeometry, materials.wall);
    parapet.position.set(0, 15.5, 0);
    house.add(parapet);

    // Simple arched doorway
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_door_medium',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 4, 8.25);
    house.add(door);

    // Windows - no frames
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_window_medium',
      () => new THREE.BoxGeometry(2.5, 2.5, 0.3)
    );

    const leftWindow = new THREE.Mesh(windowGeometry, materials.window);
    leftWindow.position.set(-6, 9, 8.15);
    house.add(leftWindow);

    const rightWindow = new THREE.Mesh(windowGeometry, materials.window);
    rightWindow.position.set(6, 8, 8.15);
    house.add(rightWindow);

    const sideWindow = new THREE.Mesh(windowGeometry, materials.window);
    sideWindow.position.set(9.15, 7, 0);
    house.add(sideWindow);

    // Apply scale
    if (scale !== 1) {
      house.scale.setScalar(scale);
    }

    return house;
  }

  /**
   * HIGH LOD: ~1500-2000 polygons
   * Full detail with all structures and decorative elements
   */
  protected createHighLODContent(): THREE.Object3D {
    const desertHouse = new THREE.Group();
    desertHouse.name = 'DesertHouse (High LOD)';

    const options = this.options as DesertHouseOptions;
    const scale = options.scale || 1;

    // Create materials
    const materials = this.createMaterials(options);

    // Add main structure
    this.addMainStructure(desertHouse, materials);

    // Add doors and windows
    this.addDoorsAndWindows(desertHouse, materials, false);

    // Add decorative elements
    this.addDecorativeElements(desertHouse, materials);

    // Apply scale
    if (scale !== 1) {
      desertHouse.scale.setScalar(scale);
    }

    return desertHouse;
  }

  /**
   * Create all material resources
   */
  private createMaterials(options: DesertHouseOptions) {
    return {
      wall: resourceManager.getOrCreateMaterial(
        `desert_house_wall_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `desert_house_roof_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `desert_house_door_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `desert_house_window_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      ),
      accent: resourceManager.getOrCreateMaterial(
        `desert_house_accent_${options.accentColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.accentColor })
      ),
      cactus: resourceManager.getOrCreateMaterial(
        'desert_house_cactus',
        () => new THREE.MeshLambertMaterial({ color: '#228B22' })
      )
    };
  }

  /**
   * Add main structure (walls and roof)
   */
  private addMainStructure(house: THREE.Group, materials: any): void {

    // Main house structure - simple cubic adobe style
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_main_body',
      () => new THREE.BoxGeometry(18, 14, 16)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 7, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    house.add(mainBody);

    // Flat roof typical of desert architecture
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_roof',
      () => new THREE.BoxGeometry(20, 1.5, 18)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 14.75, 0);
    roof.castShadow = this.options.castShadow ?? true;
    house.add(roof);

    // Small parapet wall around roof edge
    const parapetGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_parapet',
      () => new THREE.BoxGeometry(20.5, 2, 18.5)
    );
    const parapet = new THREE.Mesh(parapetGeometry, materials.wall);
    parapet.position.set(0, 15.5, 0);
    house.add(parapet);
  }

  /**
   * Add doors and windows
   */
  private addDoorsAndWindows(house: THREE.Group, materials: any, isLowPoly: boolean): void {

    // Simple arched doorway
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_door',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 4, 8.25);
    house.add(door);

    // Arched door frame (skip for low-poly)
    if (!isLowPoly) {
      const archGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_arch',
        () => new THREE.RingGeometry(2, 2.5, 0, Math.PI)
      );
      const arch = new THREE.Mesh(archGeometry, materials.accent);
      arch.position.set(0, 8, 8.1);
      arch.rotation.z = Math.PI;
      house.add(arch);
    }

    // Windows - simplified for low-poly mode
    if (isLowPoly) {
      // Low-poly: just one simple window, no frames
      const windowLowPolyGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window_lowpoly',
        () => new THREE.BoxGeometry(2, 2, 0.2)
      );

      const singleWindow = new THREE.Mesh(windowLowPolyGeometry, materials.window);
      singleWindow.position.set(0, 8, 8.1);
      house.add(singleWindow);

    } else {
      // Full detail windows with frames
      const windowGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window',
        () => new THREE.BoxGeometry(2.5, 2.5, 0.3)
      );

      // Side windows - asymmetrical placement for authentic look
      const leftWindow = new THREE.Mesh(windowGeometry, materials.window);
      leftWindow.position.set(-6, 9, 8.15);
      house.add(leftWindow);

      const rightWindow = new THREE.Mesh(windowGeometry, materials.window);
      rightWindow.position.set(6, 8, 8.15);
      house.add(rightWindow);

      // Side wall window
      const sideWindow = new THREE.Mesh(windowGeometry, materials.window);
      sideWindow.position.set(9.15, 7, 0);
      house.add(sideWindow);

      // Window frames with desert accent color
      const frameGeometry = resourceManager.getOrCreateGeometry(
        'desert_house_window_frame',
        () => new THREE.BoxGeometry(3, 3, 0.5)
      );

      [leftWindow, rightWindow, sideWindow].forEach(window => {
        const frame = new THREE.Mesh(frameGeometry, materials.accent);
        frame.position.copy(window.position);
        frame.position.z -= 0.1; // Slightly behind window
        house.add(frame);
      });
    }
  }

  /**
   * Add decorative elements (courtyard, cactus, shade structure)
   */
  private addDecorativeElements(house: THREE.Group, materials: any): void {

    // Small courtyard wall (typical of desert architecture)
    const courtyardWallGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_courtyard_wall',
      () => new THREE.BoxGeometry(12, 4, 1)
    );
    const courtyardWall = new THREE.Mesh(courtyardWallGeometry, materials.wall);
    courtyardWall.position.set(-8, 2, 10);
    house.add(courtyardWall);

    // Desert plants/decoration (simple geometric cactus)
    const cactusGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_cactus',
      () => new THREE.CylinderGeometry(0.5, 0.8, 6)
    );

    const cactus = new THREE.Mesh(cactusGeometry, materials.cactus);
    cactus.position.set(-12, 3, 6);
    house.add(cactus);

    // Cactus arm
    const cactusArmGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_cactus_arm',
      () => new THREE.CylinderGeometry(0.3, 0.4, 3)
    );
    const cactusArm = new THREE.Mesh(cactusArmGeometry, materials.cactus);
    cactusArm.position.set(-10.5, 5, 6);
    cactusArm.rotation.z = Math.PI / 2;
    house.add(cactusArm);

    // Small shade structure (ramada)
    const shadeGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_shade',
      () => new THREE.BoxGeometry(8, 0.5, 6)
    );
    const shade = new THREE.Mesh(shadeGeometry, materials.accent);
    shade.position.set(8, 11, -6);
    house.add(shade);

    // Shade posts
    const postGeometry = resourceManager.getOrCreateGeometry(
      'desert_house_post',
      () => new THREE.CylinderGeometry(0.3, 0.3, 8)
    );

    const posts = [
      new THREE.Vector3(5, 4, -8),
      new THREE.Vector3(11, 4, -8),
      new THREE.Vector3(5, 4, -4),
      new THREE.Vector3(11, 4, -4)
    ];

    posts.forEach(pos => {
      const post = new THREE.Mesh(postGeometry, materials.accent);
      post.position.copy(pos);
      house.add(post);
    });
  }


  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DesertHouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as DesertHouseOptions;

    return {
      name: 'DesertHouse',
      version: '1.0.0',
      type: 'building',
      subtype: 'residential',
      style: 'adobe',
      climate: 'desert',
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default DesertHouse;