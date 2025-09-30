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
   * Template method for creating component content.
   * Override this method for complex multi-mesh components.
   * Default implementation creates a single mesh from createGeometry().
   *
   * @returns THREE.Object3D - Either a single Mesh or a Group with multiple meshes
   */
  protected createContent(): THREE.Object3D {
    // Default implementation: single mesh from geometry
    const geometryKey = this.getGeometryKey();
    const geometry = resourceManager.getGeometry(geometryKey, () => this.createGeometry());

    const materialKey = this.getMaterialKey();
    const materialConfig = this.getMaterialConfig();
    const material = resourceManager.getMaterial(materialKey, materialConfig);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Apply transform options to an object
   */
  protected applyTransforms(object: THREE.Object3D): void {
    if (this._options.position) {
      object.position.copy(this._options.position);
    }

    if (this._options.rotation) {
      object.rotation.copy(this._options.rotation);
    }

    if (this._options.scale) {
      if (typeof this._options.scale === 'number') {
        object.scale.setScalar(this._options.scale);
      } else {
        object.scale.copy(this._options.scale);
      }
    }
  }

  /**
   * Apply shadow settings to an object (recursively for Groups)
   */
  protected applyShadows(object: THREE.Object3D): void {
    const castShadow = this._options.castShadow !== false;
    const receiveShadow = this._options.receiveShadow !== false;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
  }

  /**
   * Create the Three.js object using the template method pattern
   */
  protected async createObject(): Promise<THREE.Object3D> {
    // Call template method (can be overridden by subclasses)
    const object = this.createContent();

    // Apply transform options
    this.applyTransforms(object);

    // Apply shadow settings
    this.applyShadows(object);

    return object;
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
