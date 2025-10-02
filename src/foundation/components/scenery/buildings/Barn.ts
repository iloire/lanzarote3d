import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';
import { LevelOfDetail, getLODFromLegacy } from '../../../types/lod';

export interface BarnOptions extends SimpleComponentOptions {
  wallColor?: string;
  roofColor?: string;
  doorColor?: string;
  trimColor?: string;
  scale?: number;
  lowPoly?: boolean;
  levelOfDetail?: LevelOfDetail;
}

/**
 * Barn building component - Rural agricultural building
 */
export class Barn extends LODComponent {
  constructor(options: BarnOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Barn',
      version: '1.0.0',
      description: 'Traditional rural barn with agricultural architecture',
      tags: ['scenery', 'building', 'rural', 'agricultural', 'traditional'],
    };

    super(metadata, {
      wallColor: '#F5DEB3', // Sandy beige matching desert house
      roofColor: '#DEB887', // Burlywood matching desert house
      doorColor: '#654321', // Brown wooden doors
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

  protected createUltraLowLODContent(): THREE.Object3D {
    // ULTRA_LOW: ~20-50 polygons
    // Single box body + single box roof, no door, no windows
    const barn = new THREE.Group();
    barn.name = 'Barn (Ultra Low LOD)';

    const options = this.options as BarnOptions;
    const scale = options.scale || 1;

    // Create materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `barn_wall_ultra_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `barn_roof_ultra_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    // Single box for body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'barn_ultra_low_body',
      () => new THREE.BoxGeometry(30, 18, 20)
    );
    const body = new THREE.Mesh(bodyGeometry, wallMaterial);
    body.position.set(0, 9, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    barn.add(body);

    // Single box for roof (no rotation for simplicity)
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'barn_ultra_low_roof',
      () => new THREE.BoxGeometry(32, 4, 22)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 20, 0);
    roof.castShadow = this.options.castShadow ?? true;
    barn.add(roof);

    // Apply scale
    if (scale !== 1) {
      barn.scale.setScalar(scale);
    }

    return barn;
  }

  protected createLowLODContent(): THREE.Object3D {
    // LOW: ~100-200 polygons
    // Body + simple roof + single door (no windows)
    const barn = new THREE.Group();
    barn.name = 'Barn (Low LOD)';

    const options = this.options as BarnOptions;
    const scale = options.scale || 1;

    // Create materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `barn_wall_low_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `barn_roof_low_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `barn_door_low_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    // Main barn structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'barn_main_body_low',
      () => new THREE.BoxGeometry(30, 18, 20)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 9, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    barn.add(mainBody);

    // Simplified roof - single angled box
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'barn_roof_low',
      () => new THREE.BoxGeometry(32, 8, 22)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 22, 0);
    roof.rotation.x = -Math.PI / 8;
    roof.castShadow = this.options.castShadow ?? true;
    barn.add(roof);

    // Single large door - no separation, no frame
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'barn_door_low',
      () => new THREE.BoxGeometry(12, 12, 0.3)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 6, 10.15);
    barn.add(door);

    // Apply scale
    if (scale !== 1) {
      barn.scale.setScalar(scale);
    }

    return barn;
  }

  protected createMediumLODContent(): THREE.Object3D {
    // MEDIUM: ~300-500 polygons
    // Body + roof + door + 2 windows, simplified features
    const barn = new THREE.Group();
    barn.name = 'Barn (Medium LOD)';

    const options = this.options as BarnOptions;
    const scale = options.scale || 1;

    // Create materials
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `barn_wall_medium_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `barn_roof_medium_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `barn_door_medium_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      'barn_window_glass_medium',
      () => new THREE.MeshLambertMaterial({ color: '#333333' })
    );

    // Main barn structure
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'barn_main_body_medium',
      () => new THREE.BoxGeometry(30, 18, 20)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 9, 0);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    barn.add(mainBody);

    // Simplified roof
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'barn_roof_medium',
      () => new THREE.BoxGeometry(32, 6, 22)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 21, 0);
    roof.rotation.x = -Math.PI / 10;
    roof.castShadow = this.options.castShadow ?? true;
    barn.add(roof);

    // Door
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'barn_door_medium',
      () => new THREE.BoxGeometry(10, 12, 0.4)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 6, 10.2);
    barn.add(door);

    // Two side windows (simplified - no frames)
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'barn_window_medium',
      () => new THREE.BoxGeometry(3, 2, 0.3)
    );

    const leftSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftSideWindow.position.set(-15.15, 13, 5);
    barn.add(leftSideWindow);

    const rightSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightSideWindow.position.set(15.15, 13, 5);
    barn.add(rightSideWindow);

    // Apply scale
    if (scale !== 1) {
      barn.scale.setScalar(scale);
    }

    return barn;
  }

  protected createHighLODContent(): THREE.Object3D {
    // HIGH: ~600-1000 polygons
    // Full detail with body, roof, door, windows, and trim
    const barn = new THREE.Group();
    barn.name = 'Barn (High LOD)';

    const options = this.options as BarnOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `barn_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `barn_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const doorMaterial = resourceManager.getOrCreateMaterial(
      `barn_door_${options.doorColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.doorColor })
    );

    const trimMaterial = resourceManager.getOrCreateMaterial(
      `barn_trim_${options.trimColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.trimColor })
    );

    // Main barn structure - long and wide
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      'barn_main_body',
      () => new THREE.BoxGeometry(30, 18, 20)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.position.set(0, 9, 0); // Position so bottom is at y=0 (ground level)
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    barn.add(mainBody);

    // Simplified roof - single piece instead of gambrel (saves polygons)
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'barn_roof_simple',
      () => new THREE.BoxGeometry(32, 6, 22)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 21, 0);
    roof.rotation.x = -Math.PI / 10; // Single angle
    roof.castShadow = this.options.castShadow ?? true;
    barn.add(roof);

    // Single large door - no double doors (saves polygons)
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'barn_door_simple',
      () => new THREE.BoxGeometry(10, 12, 0.5)
    );
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 6, 10.25);
    barn.add(door);

    // Minimal windows - just 2 side windows (removed loft door)
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'barn_window',
      () => new THREE.BoxGeometry(3, 2, 0.3)
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      'barn_window_glass',
      () => new THREE.MeshLambertMaterial({ color: '#333333' })
    );

    const leftSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftSideWindow.position.set(-15.15, 13, 5);
    barn.add(leftSideWindow);

    const rightSideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightSideWindow.position.set(15.15, 13, 5);
    barn.add(rightSideWindow);

    // Removed: weathervane, fence posts, fence rails to reduce polygon count
    // Barn is now: 1 body + 1 roof + 1 door + 2 windows = 5 meshes ≈ 60 triangles (12 per box)

    // Apply scale
    if (scale !== 1) {
      barn.scale.setScalar(scale);
    }

    return barn;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as BarnOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as BarnOptions;

    return {
      name: 'Barn',
      version: '1.0.0',
      type: 'building',
      subtype: 'agricultural',
      style: 'traditional',
      wallColor: options.wallColor,
      roofColor: options.roofColor,
      scale: options.scale,
    };
  }
}

export default Barn;