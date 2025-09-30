import * as THREE from 'three';

/**
 * Configuration options for Three.js components
 */
export interface ComponentOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Component lifecycle events
 */
export interface ComponentLifecycle {
  onBeforeLoad?(): void;
  onAfterLoad?(object: THREE.Object3D): void;
  onBeforeDispose?(): void;
  onAfterDispose?(): void;
  onUpdate?(deltaTime: number): void;
  onVisibilityChange?(visible: boolean): void;
}

/**
 * Component metadata for debugging and introspection
 */
export interface ComponentMetadata {
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  readonly author?: string;
  readonly tags?: string[];
}

/**
 * Component performance metrics
 */
export interface ComponentMetrics {
  readonly loadTime?: number;
  readonly vertexCount?: number;
  readonly triangleCount?: number;
  readonly textureMemory?: number;
  readonly lastUpdateTime?: number;
}

/**
 * Unified interface for all Three.js components in the Lanzarote3D system
 *
 * This interface standardizes:
 * - Lifecycle management (load, dispose, update)
 * - Resource management and cleanup
 * - Performance monitoring
 * - Error handling
 * - Visibility control
 * - Component introspection
 */
export interface IThreeComponent extends ComponentLifecycle {
  /**
   * Component metadata for identification and debugging
   */
  readonly metadata: ComponentMetadata;

  /**
   * Current component options/configuration
   */
  readonly options: ComponentOptions;

  /**
   * Component performance metrics
   */
  readonly metrics: ComponentMetrics;

  /**
   * Whether the component has been successfully loaded
   */
  readonly isLoaded: boolean;

  /**
   * Whether the component is currently visible
   */
  readonly isVisible: boolean;

  /**
   * Whether the component has been disposed
   */
  readonly isDisposed: boolean;

  /**
   * Load the component and return the Three.js object
   * This method should be idempotent - calling it multiple times should not cause issues
   *
   * @returns Promise that resolves to the loaded Three.js object
   * @throws ComponentLoadError if loading fails
   */
  load(): Promise<THREE.Object3D>;

  /**
   * Dispose of all resources used by this component
   * This should include geometries, materials, textures, and any other GPU resources
   *
   * After disposal, the component should not be usable until reloaded
   */
  dispose(): void;

  /**
   * Update the component for the current frame
   * This is called once per frame for active components
   *
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void;

  /**
   * Set the visibility of the component
   *
   * @param visible Whether the component should be visible
   */
  setVisible(visible: boolean): void;

  /**
   * Get the main Three.js object for this component
   * Returns null if not loaded or disposed
   *
   * @returns The Three.js object or null
   */
  getObject(): THREE.Object3D | null;

  /**
   * Get all Three.js objects managed by this component
   * Useful for components that manage multiple objects
   *
   * @returns Array of all Three.js objects
   */
  getAllObjects(): THREE.Object3D[];

  /**
   * Clone the component with the same options
   * This creates a new instance with shared resources where possible
   *
   * @param newOptions Optional new options to override existing ones
   * @returns New component instance
   */
  clone(newOptions?: Partial<ComponentOptions>): IThreeComponent;

  /**
   * Validate the current component state
   * Useful for debugging and development
   *
   * @returns Array of validation issues, empty if valid
   */
  validate(): string[];

  /**
   * Export component state for serialization
   * Used for saving/loading component configurations
   *
   * @returns Serializable representation of component state
   */
  serialize(): Record<string, unknown>;
}

/**
 * Error thrown when component loading fails
 */
export class ComponentLoadError extends Error {
  public readonly componentName: string;
  public override readonly cause?: Error;

  constructor(componentName: string, message: string, cause?: Error) {
    super(`Component '${componentName}' failed to load: ${message}`);
    this.name = 'ComponentLoadError';
    this.componentName = componentName;
    this.cause = cause;
  }
}

/**
 * Error thrown when component operations are attempted on disposed components
 */
export class ComponentDisposedError extends Error {
  constructor(public readonly componentName: string) {
    super(`Component '${componentName}' has been disposed and cannot be used`);
    this.name = 'ComponentDisposedError';
  }
}

/**
 * Type guard to check if an object implements IThreeComponent
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isThreeComponent(obj: any): obj is IThreeComponent {
  return (
    obj &&
    typeof obj.load === 'function' &&
    typeof obj.dispose === 'function' &&
    typeof obj.update === 'function' &&
    typeof obj.setVisible === 'function' &&
    typeof obj.getObject === 'function' &&
    typeof obj.metadata === 'object' &&
    typeof obj.isLoaded === 'boolean'
  );
}
