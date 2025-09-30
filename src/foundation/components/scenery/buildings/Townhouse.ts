import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface TownhouseOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  trimColor?: string;
  scale?: number;
  lowPoly?: boolean;
}

/**
 * Townhouse building component - Multi-story urban building
 */
export class Townhouse extends SimpleThreeComponent {
  constructor(options: TownhouseOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Townhouse',
      version: '1.0.0',
      description: 'Multi-story urban townhouse with traditional brick architecture',
      tags: ['scenery', 'building', 'urban', 'multi-story', 'residential'],
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
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse';

    const options = this.options as TownhouseOptions;
    const scale = options.scale || 1;
    const isLowPoly = options.lowPoly || false;

    if (isLowPoly) {
      return this.createLowPolyTownhouse(options, scale);
    }

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
  private createMaterials(options: TownhouseOptions) {
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
  private addMainStructure(townhouse: THREE.Group, materials: any): void {

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
  private addEntrance(townhouse: THREE.Group, materials: any): void {

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
  private addWindows(townhouse: THREE.Group, materials: any): void {

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
  private addDecorativeElements(townhouse: THREE.Group, materials: any): void {

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

  /**
   * Create low-poly version of the townhouse
   */
  private createLowPolyTownhouse(options: TownhouseOptions, scale: number): THREE.Object3D {
    const townhouse = new THREE.Group();
    townhouse.name = 'Townhouse (Low-Poly)';

    // Simplified materials
    const materials = {
      wall: resourceManager.getOrCreateMaterial(
        `townhouse_wall_lowpoly_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `townhouse_roof_lowpoly_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `townhouse_door_lowpoly_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `townhouse_window_lowpoly_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      )
    };

    // Main structure - simplified
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_main_body_lowpoly',
      () => new THREE.BoxGeometry(12, 16, 15)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 8, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    townhouse.add(mainBody);

    // Simple roof - no peak
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_roof_lowpoly',
      () => new THREE.BoxGeometry(13, 2, 16)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 17, 0);
    roof.castShadow = this.options.castShadow ?? true;
    townhouse.add(roof);

    // Simple door - no frame or steps
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_door_lowpoly',
      () => new THREE.BoxGeometry(2.5, 6, 0.3)
    );
    const door = new THREE.Mesh(doorGeometry, materials.door);
    door.position.set(0, 3, 7.65);
    townhouse.add(door);

    // Minimal windows - just 2 simple windows, no frames
    const windowLowPolyGeometry = resourceManager.getOrCreateGeometry(
      'townhouse_window_lowpoly',
      () => new THREE.BoxGeometry(2, 2, 0.2)
    );

    // One ground floor window
    const groundWindow = new THREE.Mesh(windowLowPolyGeometry, materials.window);
    groundWindow.position.set(-3, 4, 7.6);
    townhouse.add(groundWindow);

    // One second floor window
    const secondWindow = new THREE.Mesh(windowLowPolyGeometry, materials.window);
    secondWindow.position.set(0, 12, 7.6);
    townhouse.add(secondWindow);

    // No decorative elements in low-poly version

    // Apply scale
    if (scale !== 1) {
      townhouse.scale.setScalar(scale);
    }

    return townhouse;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as TownhouseOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
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

// Legacy export for backward compatibility with old synchronous API
const TownhouseLegacy = Townhouse as any;

// Add legacy load method that returns mesh directly
TownhouseLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default TownhouseLegacy;