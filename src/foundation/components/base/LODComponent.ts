import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from './SimpleThreeComponent';
import { ComponentMetadata } from './IThreeComponent';
import { LevelOfDetail, getLODFromLegacy } from '../../types/lod';

/**
 * Options for LOD-enabled components
 */
export interface LODComponentOptions extends SimpleComponentOptions {
  /**
   * Level of detail for rendering
   * @default LevelOfDetail.HIGH
   */
  levelOfDetail?: LevelOfDetail;

  /**
   * Legacy lowPoly option for backward compatibility
   * @deprecated Use levelOfDetail instead
   */
  lowPoly?: boolean;
}

/**
 * Abstract base class for components that support multiple levels of detail (LOD)
 *
 * This class provides a standardized way to implement LOD for 3D components.
 * Subclasses must implement createContent methods for each LOD level.
 *
 * @example
 * ```typescript
 * class MyBuilding extends LODComponent {
 *   protected createUltraLowLODContent(): THREE.Object3D {
 *     // Ultra simplified version (10-100 polys)
 *   }
 *
 *   protected createLowLODContent(): THREE.Object3D {
 *     // Low detail version (100-500 polys)
 *   }
 *
 *   protected createMediumLODContent(): THREE.Object3D {
 *     // Medium detail version (500-2000 polys)
 *   }
 *
 *   protected createHighLODContent(): THREE.Object3D {
 *     // Full detail version (2000+ polys)
 *   }
 * }
 * ```
 */
export abstract class LODComponent extends SimpleThreeComponent {
  protected currentLOD: LevelOfDetail;

  constructor(metadata: ComponentMetadata, options: LODComponentOptions = {}) {
    // Handle backward compatibility with lowPoly
    const lod = options.levelOfDetail !== undefined
      ? options.levelOfDetail
      : getLODFromLegacy(options.lowPoly);

    super(metadata, { ...options, levelOfDetail: lod });
    this.currentLOD = lod;
  }

  /**
   * Create content based on current LOD level
   * This method delegates to the appropriate LOD-specific method
   */
  protected override createContent(): THREE.Object3D {
    switch (this.currentLOD) {
      case LevelOfDetail.ULTRA_LOW:
        return this.createUltraLowLODContent();
      case LevelOfDetail.LOW:
        return this.createLowLODContent();
      case LevelOfDetail.MEDIUM:
        return this.createMediumLODContent();
      case LevelOfDetail.HIGH:
        return this.createHighLODContent();
      default:
        console.warn(`Unknown LOD level: ${this.currentLOD}, using HIGH`);
        return this.createHighLODContent();
    }
  }

  /**
   * Create ultra-low detail version (10-100 polygons)
   * Used for very distant objects (>500 units)
   */
  protected abstract createUltraLowLODContent(): THREE.Object3D;

  /**
   * Create low detail version (100-500 polygons)
   * Used for medium distance objects (200-500 units)
   */
  protected abstract createLowLODContent(): THREE.Object3D;

  /**
   * Create medium detail version (500-2000 polygons)
   * Used for normal viewing distance (50-200 units)
   */
  protected abstract createMediumLODContent(): THREE.Object3D;

  /**
   * Create high detail version (2000+ polygons)
   * Used for close-up viewing (<50 units)
   */
  protected abstract createHighLODContent(): THREE.Object3D;

  /**
   * Get current LOD level
   */
  public getLOD(): LevelOfDetail {
    return this.currentLOD;
  }

  /**
   * Change LOD level and recreate mesh
   * Useful for dynamic LOD switching based on camera distance
   */
  public async setLOD(lod: LevelOfDetail): Promise<THREE.Object3D> {
    if (this.currentLOD === lod) {
      return this.getObject();
    }

    this.currentLOD = lod;
    (this.options as LODComponentOptions).levelOfDetail = lod;

    // Dispose and reload with new LOD
    this.dispose();
    return await this.load();
  }

  /**
   * Helper method to create shared materials that can be reused across LOD levels
   * Subclasses can override this to define common materials
   */
  protected createSharedMaterials?(): Record<string, THREE.Material>;

  /**
   * Get polygon count for current LOD (for debugging/monitoring)
   */
  public getPolygonCount(): number {
    let count = 0;
    const obj = this.getObject();
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        if (geometry.index !== null) {
          count += geometry.index.count / 3;
        } else {
          const positionAttribute = geometry.getAttribute('position');
          if (positionAttribute) {
            count += positionAttribute.count / 3;
          }
        }
      }
    });
    return Math.floor(count);
  }
}
