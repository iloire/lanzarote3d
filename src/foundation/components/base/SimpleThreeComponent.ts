import * as THREE from 'three';
import { BaseThreeComponent } from './BaseThreeComponent';
import { ComponentOptions, ComponentMetadata } from './IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

/**
 * Base class for simple Three.js components that create geometry procedurally
 *
 * This class is optimized for:
 * - Procedural geometry generation
 * - Material sharing through ResourceManager
 * - Fast instantiation without async loading
 * - Geometry pooling for repeated shapes
 */
export abstract class SimpleThreeComponent extends BaseThreeComponent {
  constructor(metadata: ComponentMetadata, options: ComponentOptions = {}) {
    super(metadata, options);
  }

  /**
   * Create the component's geometry
   * Must be implemented by subclasses
   */
  protected abstract createGeometry(): THREE.BufferGeometry;

  /**
   * Get the material configuration for this component
   * Can be overridden by subclasses for custom materials
   */
  protected getMaterialConfig() {
    return {
      type: 'standard' as const,
      color: this._options.color || 0xffffff,
      transparent: this._options.transparent || false,
      opacity: this._options.opacity || 1.0,
      wireframe: this._options.wireframe || false,
      side: this._options.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    };
  }

  /**
   * Get geometry cache key
   * Override to provide custom caching logic
   */
  protected getGeometryKey(): string {
    return `${this._metadata.name}_default`;
  }

  /**
   * Get material cache key
   */
  protected getMaterialKey(): string {
    const config = this.getMaterialConfig();
    return `${this._metadata.name}_${JSON.stringify(config)}`;
  }

  /**
   * Create the Three.js object using shared resources
   */
  protected async createObject(): Promise<THREE.Object3D> {
    // Get shared geometry
    const geometryKey = this.getGeometryKey();
    const geometry = resourceManager.getGeometry(geometryKey, () => this.createGeometry());

    // Get shared material
    const materialKey = this.getMaterialKey();
    const materialConfig = this.getMaterialConfig();
    const material = resourceManager.getMaterial(materialKey, materialConfig);

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Apply transform options
    if (this._options.position) {
      mesh.position.copy(this._options.position);
    }

    if (this._options.rotation) {
      mesh.rotation.copy(this._options.rotation);
    }

    if (this._options.scale) {
      if (typeof this._options.scale === 'number') {
        mesh.scale.setScalar(this._options.scale);
      } else {
        mesh.scale.copy(this._options.scale);
      }
    }

    // Enable shadows if requested
    if (this._options.castShadow !== false) {
      mesh.castShadow = true;
    }

    if (this._options.receiveShadow !== false) {
      mesh.receiveShadow = true;
    }

    return mesh;
  }

  /**
   * Synchronous load method for backward compatibility
   */
  public loadSync(): THREE.Object3D {
    if (this._isLoaded && this._object) {
      return this._object;
    }

    // Create mesh synchronously using the same logic as createObject
    const geometryKey = this.getGeometryKey();
    const geometry = resourceManager.getGeometry(geometryKey, () => this.createGeometry());

    const materialKey = this.getMaterialKey();
    const materialConfig = this.getMaterialConfig();
    const material = resourceManager.getMaterial(materialKey, materialConfig);

    const mesh = new THREE.Mesh(geometry, material);

    // Apply transform options
    if (this._options.position) {
      mesh.position.copy(this._options.position);
    }
    if (this._options.rotation) {
      mesh.rotation.copy(this._options.rotation);
    }
    if (this._options.scale) {
      if (typeof this._options.scale === 'number') {
        mesh.scale.setScalar(this._options.scale);
      } else {
        mesh.scale.copy(this._options.scale);
      }
    }

    // Enable shadows if requested
    if (this._options.castShadow !== false) {
      mesh.castShadow = true;
    }
    if (this._options.receiveShadow !== false) {
      mesh.receiveShadow = true;
    }

    this._object = mesh;
    this._isLoaded = true;
    return mesh;
  }

  /**
   * Override dispose to release shared resources
   */
  override dispose(): void {
    // Release references to shared resources
    const geometryKey = this.getGeometryKey();
    const materialKey = this.getMaterialKey();

    resourceManager.releaseResource(geometryKey);
    resourceManager.releaseResource(materialKey);

    super.dispose();
  }

  /**
   * Create clone with same geometry/material sharing
   */
  protected override createClone(options: ComponentOptions): SimpleThreeComponent {
    // Use proper constructor typing for cloning
    type ComponentConstructor = new (metadata: ComponentMetadata, options?: ComponentOptions) => SimpleThreeComponent;
    const Constructor = this.constructor as ComponentConstructor;
    return new Constructor(this.metadata, options);
  }

  /**
   * Validate geometry-specific requirements
   */
  protected override validateComponent(): string[] {
    const issues = super.validateComponent();

    if (this._object instanceof THREE.Mesh) {
      if (!this._object.geometry) {
        issues.push('Mesh has no geometry');
      }

      if (!this._object.material) {
        issues.push('Mesh has no material');
      }
    }

    return issues;
  }
}

/**
 * Common transform options for simple components
 */
export interface TransformOptions {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number | THREE.Vector3;
}

/**
 * Common material options for simple components
 */
export interface MaterialOptions {
  color?: number | string;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
  doubleSided?: boolean;
}

/**
 * Common shadow options
 */
export interface ShadowOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Combined options for simple Three.js components
 */
export interface SimpleComponentOptions
  extends ComponentOptions,
    TransformOptions,
    MaterialOptions,
    ShadowOptions {}
