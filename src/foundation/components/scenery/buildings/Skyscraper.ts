import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface SkyscraperOptions extends SimpleComponentOptions {
  wallColor?: string;
  glassColor?: string;
  accentColor?: string;
  frameColor?: string;
  scale?: number;
  floors?: number;
}

/**
 * Skyscraper building component - Tall commercial building
 */
export class Skyscraper extends SimpleThreeComponent {
  constructor(options: SkyscraperOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Skyscraper',
      version: '1.0.0',
      description: 'Tall modern skyscraper with glass facade and commercial design',
      tags: ['scenery', 'building', 'commercial', 'skyscraper', 'modern'],
    };

    super(metadata, {
      wallColor: '#C0C0C0', // Silver for modern walls
      glassColor: '#4169E1', // Royal blue for glass
      accentColor: '#2F4F4F', // Dark slate gray accents
      frameColor: '#696969', // Dim gray frames
      scale: 1,
      floors: 20,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const skyscraper = new THREE.Group();
    skyscraper.name = 'Skyscraper';

    const options = this.options as SkyscraperOptions;
    const scale = options.scale || 1;
    const floors = Math.max(10, Math.min(30, options.floors || 20)); // Clamp between 10-30 floors

    // Create materials with resource sharing
    const wallMaterial = resourceManager.getOrCreateMaterial(
      `skyscraper_wall_${options.wallColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wallColor })
    );

    const glassMaterial = resourceManager.getOrCreateMaterial(
      `skyscraper_glass_${options.glassColor}`,
      () => new THREE.MeshLambertMaterial({
        color: options.glassColor,
        transparent: true,
        opacity: 0.7
      })
    );

    const accentMaterial = resourceManager.getOrCreateMaterial(
      `skyscraper_accent_${options.accentColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.accentColor })
    );

    const frameMaterial = resourceManager.getOrCreateMaterial(
      `skyscraper_frame_${options.frameColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.frameColor })
    );

    const height = floors * 3; // 3 units per floor

    // Main skyscraper structure - tall and imposing
    const mainBodyGeometry = resourceManager.getOrCreateGeometry(
      `skyscraper_main_body_${floors}`,
      () => new THREE.BoxGeometry(16, height, 16)
    );
    const mainBody = new THREE.Mesh(mainBodyGeometry, wallMaterial);
    mainBody.castShadow = this.options.castShadow ?? true;
    mainBody.receiveShadow = this.options.receiveShadow ?? true;
    skyscraper.add(mainBody);

    // Core structural elements
    const coreGeometry = resourceManager.getOrCreateGeometry(
      `skyscraper_core_${floors}`,
      () => new THREE.BoxGeometry(8, height + 2, 8)
    );
    const core = new THREE.Mesh(coreGeometry, accentMaterial);
    core.position.set(0, 1, 0);
    core.castShadow = this.options.castShadow ?? true;
    skyscraper.add(core);

    // Building top/crown
    const crownGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_crown',
      () => new THREE.BoxGeometry(18, 4, 18)
    );
    const crown = new THREE.Mesh(crownGeometry, accentMaterial);
    crown.position.set(0, height / 2 + 2, 0);
    crown.castShadow = this.options.castShadow ?? true;
    skyscraper.add(crown);

    // Spire/antenna
    const spireGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_spire',
      () => new THREE.CylinderGeometry(0.2, 0.5, 8)
    );
    const spire = new THREE.Mesh(spireGeometry, frameMaterial);
    spire.position.set(0, height / 2 + 8, 0);
    spire.castShadow = this.options.castShadow ?? true;
    skyscraper.add(spire);

    // Create window pattern - systematic grid
    const windowGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_window',
      () => new THREE.BoxGeometry(2, 2, 0.2)
    );

    const frameGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_window_frame',
      () => new THREE.BoxGeometry(2.2, 2.2, 0.5)
    );

    // Calculate window positions for each floor
    const windowsPerFloor = 4; // 4 windows per side
    const floorHeight = 3;

    for (let floor = 0; floor < floors; floor++) {
      const floorY = -height / 2 + (floor + 0.5) * floorHeight;

      // Front face windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const x = -6 + i * 4;

        const window = new THREE.Mesh(windowGeometry, glassMaterial);
        window.position.set(x, floorY, 8.1);
        skyscraper.add(window);

        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, floorY, 8);
        skyscraper.add(frame);
      }

      // Back face windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const x = -6 + i * 4;

        const window = new THREE.Mesh(windowGeometry, glassMaterial);
        window.position.set(x, floorY, -8.1);
        skyscraper.add(window);

        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, floorY, -8);
        skyscraper.add(frame);
      }

      // Left side windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const z = -6 + i * 4;

        const window = new THREE.Mesh(windowGeometry, glassMaterial);
        window.position.set(-8.1, floorY, z);
        skyscraper.add(window);

        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(-8, floorY, z);
        skyscraper.add(frame);
      }

      // Right side windows
      for (let i = 0; i < windowsPerFloor; i++) {
        const z = -6 + i * 4;

        const window = new THREE.Mesh(windowGeometry, glassMaterial);
        window.position.set(8.1, floorY, z);
        skyscraper.add(window);

        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(8, floorY, z);
        skyscraper.add(frame);
      }
    }

    // Entrance lobby (glass)
    const lobbyGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_lobby',
      () => new THREE.BoxGeometry(12, 6, 0.5)
    );
    const lobby = new THREE.Mesh(lobbyGeometry, glassMaterial);
    lobby.position.set(0, -height / 2 + 3, 8.25);
    skyscraper.add(lobby);

    // Entrance doors
    const doorGeometry = resourceManager.getOrCreateGeometry(
      'skyscraper_door',
      () => new THREE.BoxGeometry(6, 6, 0.3)
    );
    const doors = new THREE.Mesh(doorGeometry, frameMaterial);
    doors.position.set(0, -height / 2 + 3, 8.35);
    skyscraper.add(doors);

    // Apply scale
    if (scale !== 1) {
      skyscraper.scale.setScalar(scale);
    }

    return skyscraper;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as SkyscraperOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.floors && (options.floors < 10 || options.floors > 30)) {
      issues.push('Floors must be between 10 and 30');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as SkyscraperOptions;

    return {
      name: 'Skyscraper',
      version: '1.0.0',
      type: 'building',
      subtype: 'commercial',
      style: 'modern',
      floors: options.floors,
      height: (options.floors || 20) * 3,
      wallColor: options.wallColor,
      glassColor: options.glassColor,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const SkyscraperLegacy = Skyscraper as any;

// Add legacy load method that returns mesh directly
SkyscraperLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default SkyscraperLegacy;