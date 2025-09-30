import * as THREE from 'three';
import { Water as WaterEffect } from 'three/examples/jsm/objects/Water';
import { logger } from '../../utils/logger';

export type WaterOptions = {
  size: number;
};

export default class Water {
  options: WaterOptions;
  private waterMesh: THREE.Mesh | WaterEffect | null = null;

  constructor(options: WaterOptions) {
    this.options = options;
  }

  load(sunPosition: THREE.Vector3) {
    logger.debug('Loading water component');
    const waterGeometry = new THREE.PlaneGeometry(this.options.size, this.options.size);
    const mat = new THREE.MeshLambertMaterial({ color: 0x000511 });
    mat.transparent = true;
    // mat.opacity = 0.6;
    this.waterMesh = new THREE.Mesh(waterGeometry, mat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    return this.waterMesh;
  }

  dispose() {
    // Clean up mesh and materials if needed
    if (this.waterMesh) {
      this.waterMesh.geometry?.dispose();
      if (Array.isArray(this.waterMesh.material)) {
        this.waterMesh.material.forEach(material => material.dispose());
      } else {
        this.waterMesh.material?.dispose();
      }
    }
  }

  // Theme support methods

  /**
   * Apply water theme settings to the water mesh
   */
  applyTheme(waterTheme: { color?: string; opacity?: number; roughness?: number; animated?: boolean }) {
    if (!this.waterMesh || !this.waterMesh.material) return;

    const material = this.waterMesh.material as THREE.MeshLambertMaterial;

    if (waterTheme.color) {
      material.color = new THREE.Color(waterTheme.color);
    }

    if (waterTheme.opacity !== undefined) {
      material.opacity = waterTheme.opacity;
      material.transparent = waterTheme.opacity < 1.0;
    }

    material.needsUpdate = true;
  }

  /**
   * Get current water mesh for external theme application
   */
  getMesh(): THREE.Mesh | WaterEffect | null {
    return this.waterMesh;
  }
}
