import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';

export interface HospitalOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  windowColor?: string;
  accentColor?: string;
  signColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

/**
 * Material set for hospital construction
 */
interface HospitalMaterials {
  wall: THREE.Material;
  roof: THREE.Material;
  door: THREE.Material;
  window: THREE.Material;
  accent: THREE.Material;
  sign: THREE.Material;
}

/**
 * Hospital building component - Modern medical facility with distinctive architecture
 */
export class Hospital extends LODComponent {
  constructor(options: HospitalOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hospital',
      version: '1.0.0',
      description: 'Modern hospital building with medical facilities, emergency entrance, and helipad',
      tags: ['scenery', 'building', 'hospital', 'medical', 'public', 'multi-story'],
    };

    super(metadata, {
      wallColor: '#F0F0F0', // Clean white/light gray
      roofColor: '#C0C0C0', // Silver gray
      doorColor: '#1E90FF', // Dodger blue
      windowColor: '#87CEEB', // Sky blue
      accentColor: '#FF0000', // Red for medical cross
      signColor: '#FFFFFF', // White for signage
      scale: 1,
      ...options,
    });

    this.currentLOD = options.levelOfDetail ?? getLODFromLegacy(options.lowPoly);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  /**
   * Create ultra-low detail version (~20-50 polygons)
   * Single box body + roof, no wings, no cross, no windows
   */
  protected createUltraLowLODContent(): THREE.Object3D {
    const hospital = new THREE.Group();
    hospital.name = 'Hospital (Ultra Low LOD)';

    const options = this.options as HospitalOptions;
    const scale = options.scale || 1;

    // Simple materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `hospital_wall_ultra_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `hospital_roof_ultra_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Single box body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'hospital_ultra_low_body',
      () => new THREE.BoxGeometry(20, 24, 18)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 12, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(body);

    // Simple flat roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'hospital_ultra_low_roof',
      () => new THREE.BoxGeometry(21, 1, 19)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 24.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    hospital.add(roof);

    // Apply scale
    if (scale !== 1) {
      hospital.scale.setScalar(scale);
    }

    return hospital;
  }

  /**
   * Create low detail version (~100-300 polygons)
   * Main body + roof + simple red cross, no wings, minimal windows
   */
  protected createLowLODContent(): THREE.Object3D {
    const hospital = new THREE.Group();
    hospital.name = 'Hospital (Low LOD)';

    const options = this.options as HospitalOptions;
    const scale = options.scale || 1;

    // Simplified materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `hospital_wall_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `hospital_roof_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `hospital_accent_low_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `hospital_window_low_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    // Main structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'hospital_main_body_low',
      () => new THREE.BoxGeometry(20, 24, 18)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 12, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(mainBody);

    // Simple flat roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'hospital_roof_low',
      () => new THREE.BoxGeometry(21, 1, 19)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 24.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    hospital.add(roof);

    // Simple red cross - single box
    const crossGeometry = resourceManager.getOrCreateGeometry(
      'hospital_cross_low',
      () => new THREE.BoxGeometry(4, 4, 0.2)
    );
    const cross = new THREE.Mesh(crossGeometry, accentMaterial);
    cross.position.set(0, 18, 9.15);
    hospital.add(cross);

    // Minimal windows - just 3
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'hospital_window_low',
      () => new THREE.BoxGeometry(2, 2, 0.2)
    );

    for (let i = 0; i < 3; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-5 + i * 5, 12, 9.1);
      hospital.add(window);
    }

    // Apply scale
    if (scale !== 1) {
      hospital.scale.setScalar(scale);
    }

    return hospital;
  }

  /**
   * Create medium detail version (~800-1200 polygons)
   * Main body + wings + roofs + simple cross + simplified windows (no frames), no helipad
   */
  protected createMediumLODContent(): THREE.Object3D {
    const hospital = new THREE.Group();
    hospital.name = 'Hospital (Medium LOD)';

    const options = this.options as HospitalOptions;
    const scale = options.scale || 1;

    const wallMaterial = resourceManager.getOrCreateMaterial(
      `hospital_wall_medium_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `hospital_roof_medium_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `hospital_accent_medium_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `hospital_window_medium_${options.windowColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.windowColor })
    );

    // Main hospital building
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'hospital_main_body_medium',
      () => new THREE.BoxGeometry(20, 24, 18)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 12, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(mainBody);

    // Left wing
    const leftWingGeometry = resourceManager.getOrCreateGeometry(
      'hospital_left_wing_medium',
      () => new THREE.BoxGeometry(12, 16, 12)
    );
    const leftWing = new THREE.Mesh(leftWingGeometry, wallMaterial);
    leftWing.position.set(-16, 8, 3);
    leftWing.castShadow = this.options.castShadow ?? true;
    leftWing.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(leftWing);

    // Right wing
    const rightWingGeometry = resourceManager.getOrCreateGeometry(
      'hospital_right_wing_medium',
      () => new THREE.BoxGeometry(12, 16, 12)
    );
    const rightWing = new THREE.Mesh(rightWingGeometry, wallMaterial);
    rightWing.position.set(16, 8, 3);
    rightWing.castShadow = this.options.castShadow ?? true;
    rightWing.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(rightWing);

    // Flat roof on main building
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'hospital_roof_medium',
      () => new THREE.BoxGeometry(21, 1, 19)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 24.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    hospital.add(roof);

    // Simple red cross - vertical and horizontal bars
    const verticalBarGeometry = resourceManager.getOrCreateGeometry(
      'hospital_cross_vertical_medium',
      () => new THREE.BoxGeometry(1.5, 6, 0.3)
    );
    const verticalBar = new THREE.Mesh(verticalBarGeometry, accentMaterial);
    verticalBar.position.set(0, 18, 9.2);
    hospital.add(verticalBar);

    const horizontalBarGeometry = resourceManager.getOrCreateGeometry(
      'hospital_cross_horizontal_medium',
      () => new THREE.BoxGeometry(6, 1.5, 0.3)
    );
    const horizontalBar = new THREE.Mesh(horizontalBarGeometry, accentMaterial);
    horizontalBar.position.set(0, 18, 9.2);
    hospital.add(horizontalBar);

    // Simplified windows (no frames) - 2 floors, 3 windows per floor
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'hospital_window_medium',
      () => new THREE.BoxGeometry(2, 3, 0.3)
    );

    for (let floor = 0; floor < 2; floor++) {
      const y = 10 + floor * 7;
      for (let i = 0; i < 3; i++) {
        const x = -5 + i * 5;
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(x, y, 9.15);
        hospital.add(window);
      }
    }

    // Apply scale
    if (scale !== 1) {
      hospital.scale.setScalar(scale);
    }

    return hospital;
  }

  /**
   * Create high detail version (~2500-3000 polygons)
   * Full detail using existing helper methods
   */
  protected createHighLODContent(): THREE.Object3D {
    const hospital = new THREE.Group();
    hospital.name = 'Hospital (High LOD)';

    const options = this.options as HospitalOptions;
    const scale = options.scale || 1;

    // Create materials
    const materials = this.createMaterials(options);

    // Add main structure
    this.addMainStructure(hospital, materials);

    // Add entrance and emergency entrance
    this.addEntrances(hospital, materials);

    // Add windows
    this.addWindows(hospital, materials);

    // Add medical cross sign
    this.addMedicalCross(hospital, materials);

    // Add helipad on roof
    this.addHelipad(hospital, materials);

    // Apply scale
    if (scale !== 1) {
      hospital.scale.setScalar(scale);
    }

    return hospital;
  }

  /**
   * Create all material resources
   */
  private createMaterials(options: HospitalOptions): HospitalMaterials {
    return {
      wall: resourceManager.getOrCreateMaterial(
        `hospital_wall_${options.wallColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.wallColor })
      ),
      roof: resourceManager.getOrCreateMaterial(
        `hospital_roof_${options.roofColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.roofColor })
      ),
      door: resourceManager.getOrCreateMaterial(
        `hospital_door_${options.doorColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.doorColor })
      ),
      window: resourceManager.getOrCreateMaterial(
        `hospital_window_${options.windowColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.windowColor })
      ),
      accent: resourceManager.getOrCreateMaterial(
        `hospital_accent_${options.accentColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.accentColor })
      ),
      sign: resourceManager.getOrCreateMaterial(
        `hospital_sign_${options.signColor}`,
        () => new THREE.MeshLambertMaterial({ color: options.signColor })
      )
    };
  }

  /**
   * Add main structure (main building, wings, and flat roof)
   */
  private addMainStructure(hospital: THREE.Group, materials: HospitalMaterials): void {
    // Main hospital building - 3-story modern structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'hospital_main_body',
      () => new THREE.BoxGeometry(20, 24, 18)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, materials.wall);
    mainBody.position.set(0, 12, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(mainBody);

    // Left wing - smaller section
    const leftWingGeometry = resourceManager.getOrCreateGeometry(
      'hospital_left_wing',
      () => new THREE.BoxGeometry(12, 16, 12)
    );
    const leftWing = new THREE.Mesh(leftWingGeometry, materials.wall);
    leftWing.position.set(-16, 8, 3);
    leftWing.castShadow = this.options.castShadow ?? true;
    leftWing.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(leftWing);

    // Right wing - smaller section
    const rightWingGeometry = resourceManager.getOrCreateGeometry(
      'hospital_right_wing',
      () => new THREE.BoxGeometry(12, 16, 12)
    );
    const rightWing = new THREE.Mesh(rightWingGeometry, materials.wall);
    rightWing.position.set(16, 8, 3);
    rightWing.castShadow = this.options.castShadow ?? true;
    rightWing.receiveShadow = this.options.receiveShadow ?? true;
    hospital.add(rightWing);

    // Flat roof on main building
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'hospital_roof',
      () => new THREE.BoxGeometry(21, 1, 19)
    );
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.set(0, 24.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    hospital.add(roof);

    // Decorative blue stripe around building
    const stripeGeometry = resourceManager.getOrCreateGeometry(
      'hospital_stripe',
      () => new THREE.BoxGeometry(21, 1.5, 18.5)
    );
    const stripe = new THREE.Mesh(stripeGeometry, materials.door);
    stripe.position.set(0, 3, 0);
    hospital.add(stripe);
  }

  /**
   * Add main entrance and emergency entrance
   */
  private addEntrances(hospital: THREE.Group, materials: HospitalMaterials): void {
    // Main entrance - centered
    const mainDoorGeometry = resourceManager.getOrCreateGeometry(
      'hospital_main_door',
      () => new THREE.BoxGeometry(4, 8, 0.5)
    );
    const mainDoor = new THREE.Mesh(mainDoorGeometry, materials.door);
    mainDoor.position.set(0, 4, 9.25);
    hospital.add(mainDoor);

    // Glass canopy over entrance
    const canopyGeometry = resourceManager.getOrCreateGeometry(
      'hospital_canopy',
      () => new THREE.BoxGeometry(8, 0.5, 3)
    );
    const canopy = new THREE.Mesh(canopyGeometry, materials.accent);
    canopy.position.set(0, 9, 10.5);
    hospital.add(canopy);

    // Emergency entrance sign (red)
    const emergencySignGeometry = resourceManager.getOrCreateGeometry(
      'hospital_emergency_sign',
      () => new THREE.BoxGeometry(6, 2, 0.3)
    );
    const emergencySign = new THREE.Mesh(emergencySignGeometry, materials.accent);
    emergencySign.position.set(-16, 12, 9.15);
    hospital.add(emergencySign);

    // Emergency entrance door
    const emergencyDoorGeometry = resourceManager.getOrCreateGeometry(
      'hospital_emergency_door',
      () => new THREE.BoxGeometry(4, 7, 0.5)
    );
    const emergencyDoor = new THREE.Mesh(emergencyDoorGeometry, materials.accent);
    emergencyDoor.position.set(-16, 3.5, 9.25);
    hospital.add(emergencyDoor);
  }

  /**
   * Add windows for all floors
   */
  private addWindows(hospital: THREE.Group, materials: HospitalMaterials): void {
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'hospital_window',
      () => new THREE.BoxGeometry(2, 3, 0.3)
    );

    // Main building windows - 3 floors, 4 windows per floor
    for (let floor = 0; floor < 3; floor++) {
      const y = 8 + floor * 7;
      for (let i = 0; i < 4; i++) {
        const x = -7.5 + i * 5;
        const window = new THREE.Mesh(windowGeometry, materials.window);
        window.position.set(x, y, 9.15);
        hospital.add(window);
      }
    }

    // Left wing windows - 2 floors, 2 windows per floor
    for (let floor = 0; floor < 2; floor++) {
      const y = 6 + floor * 7;
      for (let i = 0; i < 2; i++) {
        const x = -19 + i * 4;
        const window = new THREE.Mesh(windowGeometry, materials.window);
        window.position.set(x, y, 9.15);
        hospital.add(window);
      }
    }

    // Right wing windows - 2 floors, 2 windows per floor
    for (let floor = 0; floor < 2; floor++) {
      const y = 6 + floor * 7;
      for (let i = 0; i < 2; i++) {
        const x = 13 + i * 4;
        const window = new THREE.Mesh(windowGeometry, materials.window);
        window.position.set(x, y, 9.15);
        hospital.add(window);
      }
    }
  }

  /**
   * Add red medical cross on the front facade
   */
  private addMedicalCross(hospital: THREE.Group, materials: HospitalMaterials): void {
    // Vertical bar of cross
    const verticalBarGeometry = resourceManager.getOrCreateGeometry(
      'hospital_cross_vertical',
      () => new THREE.BoxGeometry(1.5, 6, 0.3)
    );
    const verticalBar = new THREE.Mesh(verticalBarGeometry, materials.accent);
    verticalBar.position.set(0, 18, 9.2);
    hospital.add(verticalBar);

    // Horizontal bar of cross
    const horizontalBarGeometry = resourceManager.getOrCreateGeometry(
      'hospital_cross_horizontal',
      () => new THREE.BoxGeometry(6, 1.5, 0.3)
    );
    const horizontalBar = new THREE.Mesh(horizontalBarGeometry, materials.accent);
    horizontalBar.position.set(0, 18, 9.2);
    hospital.add(horizontalBar);
  }

  /**
   * Add helipad on roof
   */
  private addHelipad(hospital: THREE.Group, materials: HospitalMaterials): void {
    // Helipad platform
    const helipadGeometry = resourceManager.getOrCreateGeometry(
      'hospital_helipad',
      () => new THREE.CylinderGeometry(5, 5, 0.5, 16)
    );
    const helipad = new THREE.Mesh(helipadGeometry, materials.accent);
    helipad.position.set(0, 25.25, 0);
    hospital.add(helipad);

    // "H" marking on helipad
    const hMarkingGeometry = resourceManager.getOrCreateGeometry(
      'hospital_h_marking',
      () => new THREE.BoxGeometry(4, 0.3, 1)
    );
    const hMarking = new THREE.Mesh(hMarkingGeometry, materials.sign);
    hMarking.position.set(0, 25.55, 0);
    hospital.add(hMarking);

    // Vertical bars of H
    const hVertical1 = new THREE.Mesh(
      resourceManager.getOrCreateGeometry('hospital_h_vertical', () => new THREE.BoxGeometry(1, 0.3, 3)),
      materials.sign
    );
    hVertical1.position.set(-1.5, 25.55, 0);
    hospital.add(hVertical1);

    const hVertical2 = new THREE.Mesh(
      resourceManager.getOrCreateGeometry('hospital_h_vertical', () => new THREE.BoxGeometry(1, 0.3, 3)),
      materials.sign
    );
    hVertical2.position.set(1.5, 25.55, 0);
    hospital.add(hVertical2);
  }


  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HospitalOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HospitalOptions;

    return {
      name: 'Hospital',
      version: '1.0.0',
      type: 'building',
      subtype: 'medical',
      style: 'modern',
      floors: 3,
      hasHelipad: true,
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default Hospital;
