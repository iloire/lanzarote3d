import * as THREE from 'three';
import {
  IThreeComponent,
  ComponentOptions,
  ComponentLifecycle,
  ComponentMetadata,
  ComponentMetrics,
  ComponentLoadError,
  ComponentDisposedError
} from './IThreeComponent';

/**
 * Base implementation of IThreeComponent providing common functionality
 *
 * This abstract class handles:
 * - Lifecycle state management
 * - Performance metrics tracking
 * - Error handling and validation
 * - Resource cleanup utilities
 * - Event callback management
 */
export abstract class BaseThreeComponent implements IThreeComponent {
  protected _object: THREE.Object3D | null = null;
  protected _isLoaded: boolean = false;
  protected _isVisible: boolean = true;
  protected _isDisposed: boolean = false;
  protected _loadStartTime: number = 0;
  protected _metrics: ComponentMetrics = {};

  constructor(
    protected readonly _metadata: ComponentMetadata,
    protected readonly _options: ComponentOptions = {}
  ) {
    this.validateOptions();
  }

  // Getters for interface properties
  get metadata(): ComponentMetadata {
    return this._metadata;
  }

  get options(): ComponentOptions {
    return { ...this._options };
  }

  get metrics(): ComponentMetrics {
    return { ...this._metrics };
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  // Core lifecycle methods
  async load(): Promise<THREE.Object3D> {
    if (this._isDisposed) {
      throw new ComponentDisposedError(this._metadata.name);
    }

    if (this._isLoaded && this._object) {
      return this._object;
    }

    this._loadStartTime = performance.now();

    try {
      this.onBeforeLoad?.();

      this._object = await this.createObject();

      if (!this._object) {
        throw new Error('createObject() returned null or undefined');
      }

      this._object.visible = this._isVisible;
      this._isLoaded = true;

      // Calculate metrics
      const loadTime = performance.now() - this._loadStartTime;
      this._metrics = {
        ...this._metrics,
        loadTime,
        vertexCount: this.calculateVertexCount(),
        triangleCount: this.calculateTriangleCount(),
        textureMemory: this.calculateTextureMemory()
      };

      this.onAfterLoad?.(this._object);

      return this._object;
    } catch (error) {
      this._isLoaded = false;
      this._object = null;
      throw new ComponentLoadError(
        this._metadata.name,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );
    }
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this.onBeforeDispose?.();

    if (this._object) {
      this.disposeObject(this._object);
      this._object = null;
    }

    this._isLoaded = false;
    this._isDisposed = true;

    this.onAfterDispose?.();
  }

  update(deltaTime: number): void {
    if (!this._isLoaded || this._isDisposed || !this._object) {
      return;
    }

    this._metrics = {
      ...this._metrics,
      lastUpdateTime: performance.now()
    };

    this.onUpdate?.(deltaTime);
    this.updateObject(deltaTime);
  }

  setVisible(visible: boolean): void {
    if (this._isVisible === visible) {
      return;
    }

    this._isVisible = visible;

    if (this._object) {
      this._object.visible = visible;
    }

    this.onVisibilityChange?.(visible);
  }

  getObject(): THREE.Object3D | null {
    return this._object;
  }

  getAllObjects(): THREE.Object3D[] {
    return this._object ? [this._object] : [];
  }

  clone(newOptions?: Partial<ComponentOptions>): IThreeComponent {
    const mergedOptions = { ...this._options, ...newOptions };
    return this.createClone(mergedOptions);
  }

  validate(): string[] {
    const issues: string[] = [];

    if (this._isDisposed) {
      issues.push('Component has been disposed');
    }

    if (this._isLoaded && !this._object) {
      issues.push('Component marked as loaded but object is null');
    }

    if (!this._isLoaded && this._object) {
      issues.push('Component has object but not marked as loaded');
    }

    // Add custom validation
    issues.push(...this.validateComponent());

    return issues;
  }

  serialize(): any {
    return {
      metadata: this._metadata,
      options: this._options,
      isLoaded: this._isLoaded,
      isVisible: this._isVisible,
      metrics: this._metrics,
      ...this.serializeComponent()
    };
  }

  // Abstract methods that subclasses must implement
  protected abstract createObject(): Promise<THREE.Object3D>;
  protected abstract createClone(options: ComponentOptions): IThreeComponent;

  // Virtual methods that subclasses can override
  protected updateObject(deltaTime: number): void {
    // Default implementation does nothing
  }

  protected validateOptions(): void {
    // Default implementation does nothing
    // Subclasses can override to validate their specific options
  }

  protected validateComponent(): string[] {
    // Default implementation returns no issues
    // Subclasses can override to add specific validation
    return [];
  }

  protected serializeComponent(): any {
    // Default implementation returns empty object
    // Subclasses can override to add specific serialization
    return {};
  }

  // Utility methods for resource management
  protected disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });

    // Remove from parent if it has one
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  protected disposeMaterial(material: THREE.Material): void {
    // Dispose of material and its textures
    material.dispose();

    // Dispose of any textures
    Object.values(material).forEach(value => {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    });
  }

  protected calculateVertexCount(): number {
    if (!this._object) return 0;

    let count = 0;
    this._object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const positionAttribute = child.geometry.getAttribute('position');
        if (positionAttribute) {
          count += positionAttribute.count;
        }
      }
    });
    return count;
  }

  protected calculateTriangleCount(): number {
    if (!this._object) return 0;

    let count = 0;
    this._object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const indexAttribute = child.geometry.getIndex();
        if (indexAttribute) {
          count += indexAttribute.count / 3;
        } else {
          const positionAttribute = child.geometry.getAttribute('position');
          if (positionAttribute) {
            count += positionAttribute.count / 3;
          }
        }
      }
    });
    return Math.floor(count);
  }

  protected calculateTextureMemory(): number {
    if (!this._object) return 0;

    const textures = new Set<THREE.Texture>();
    this._object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          Object.values(material).forEach(value => {
            if (value instanceof THREE.Texture && value.image) {
              textures.add(value);
            }
          });
        });
      }
    });

    let totalMemory = 0;
    textures.forEach(texture => {
      if (texture.image) {
        const width = texture.image.width || 0;
        const height = texture.image.height || 0;
        // Rough estimate: 4 bytes per pixel for RGBA
        totalMemory += width * height * 4;
      }
    });

    return totalMemory;
  }

  // Lifecycle event stubs (can be overridden by subclasses)
  protected onBeforeLoad?(): void;
  protected onAfterLoad?(object: THREE.Object3D): void;
  protected onBeforeDispose?(): void;
  protected onAfterDispose?(): void;
  protected onUpdate?(deltaTime: number): void;
  protected onVisibilityChange?(visible: boolean): void;
}