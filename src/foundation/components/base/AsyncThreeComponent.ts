import * as THREE from 'three';
import { BaseThreeComponent } from './BaseThreeComponent';
import { ComponentOptions, ComponentMetadata } from './IThreeComponent';

/**
 * Resource types that can be loaded asynchronously
 */
export type ResourceType = 'model' | 'texture' | 'audio' | 'data' | 'font';

/**
 * Resource descriptor for async loading
 */
export interface ResourceDescriptor {
  readonly id: string;
  readonly type: ResourceType;
  readonly url: string;
  readonly options?: any;
}

/**
 * Loaded resource with its data
 */
export interface LoadedResource<T = any> {
  readonly id: string;
  readonly type: ResourceType;
  readonly data: T;
  readonly url: string;
  readonly loadTime: number;
}

/**
 * Progress information for async loading
 */
export interface LoadProgress {
  readonly totalResources: number;
  readonly loadedResources: number;
  readonly currentResource?: string;
  readonly bytesLoaded?: number;
  readonly bytesTotal?: number;
  readonly progress: number; // 0-1
}

/**
 * Callbacks for async loading events
 */
export interface AsyncLoadCallbacks {
  onProgress?(progress: LoadProgress): void;
  onResourceLoaded?(resource: LoadedResource): void;
  onResourceError?(resourceId: string, error: Error): void;
}

/**
 * Base class for components that require asynchronous resource loading
 *
 * This class provides:
 * - Standardized resource loading with progress tracking
 * - Concurrent loading with dependency management
 * - Resource caching and sharing
 * - Graceful error handling and fallbacks
 * - Loading state management
 */
export abstract class AsyncThreeComponent extends BaseThreeComponent {
  protected resources: Map<string, LoadedResource> = new Map();
  protected loadingPromises: Map<string, Promise<any>> = new Map();
  protected callbacks?: AsyncLoadCallbacks;

  constructor(
    metadata: ComponentMetadata,
    options: ComponentOptions = {},
    callbacks?: AsyncLoadCallbacks
  ) {
    super(metadata, options);
    this.callbacks = callbacks;
  }

  /**
   * Get the list of resources this component needs to load
   * Must be implemented by subclasses
   */
  protected abstract getResourceDescriptors(): ResourceDescriptor[];

  /**
   * Create the Three.js object using loaded resources
   * Must be implemented by subclasses
   */
  protected abstract createObjectFromResources(
    resources: Map<string, LoadedResource>
  ): Promise<THREE.Object3D>;

  /**
   * Get fallback resources for failed loads
   * Override in subclasses to provide fallbacks
   */
  protected getFallbackResources(): Partial<Record<string, any>> {
    return {};
  }

  /**
   * Override the base createObject to handle async loading
   */
  protected async createObject(): Promise<THREE.Object3D> {
    const resourceDescriptors = this.getResourceDescriptors();

    if (resourceDescriptors.length === 0) {
      // No resources to load, create object directly
      return this.createObjectFromResources(new Map());
    }

    // Load all resources
    await this.loadResources(resourceDescriptors);

    // Create object from loaded resources
    return this.createObjectFromResources(this.resources);
  }

  /**
   * Load all required resources with progress tracking
   */
  protected async loadResources(descriptors: ResourceDescriptor[]): Promise<void> {
    const totalResources = descriptors.length;
    let loadedCount = 0;

    const updateProgress = (currentResource?: string) => {
      const progress: LoadProgress = {
        totalResources,
        loadedResources: loadedCount,
        currentResource,
        progress: loadedCount / totalResources,
      };
      this.callbacks?.onProgress?.(progress);
    };

    updateProgress();

    // Load resources concurrently
    const loadPromises = descriptors.map(async descriptor => {
      try {
        updateProgress(descriptor.id);

        const resource = await this.loadSingleResource(descriptor);
        this.resources.set(descriptor.id, resource);

        loadedCount++;
        updateProgress();

        this.callbacks?.onResourceLoaded?.(resource);

        return resource;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.callbacks?.onResourceError?.(descriptor.id, err);

        // Try to use fallback
        const fallbacks = this.getFallbackResources();
        if (fallbacks[descriptor.id]) {
          const fallbackResource: LoadedResource = {
            id: descriptor.id,
            type: descriptor.type,
            data: fallbacks[descriptor.id],
            url: 'fallback',
            loadTime: 0,
          };
          this.resources.set(descriptor.id, fallbackResource);
          loadedCount++;
          updateProgress();
          return fallbackResource;
        }

        throw err;
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Load a single resource based on its type
   */
  protected async loadSingleResource(descriptor: ResourceDescriptor): Promise<LoadedResource> {
    const startTime = performance.now();

    // Check if already loading
    if (this.loadingPromises.has(descriptor.id)) {
      const data = await this.loadingPromises.get(descriptor.id)!;
      return {
        id: descriptor.id,
        type: descriptor.type,
        data,
        url: descriptor.url,
        loadTime: performance.now() - startTime,
      };
    }

    // Create loading promise
    const loadPromise = this.createResourceLoader(descriptor);
    this.loadingPromises.set(descriptor.id, loadPromise);

    try {
      const data = await loadPromise;
      const loadTime = performance.now() - startTime;

      const resource: LoadedResource = {
        id: descriptor.id,
        type: descriptor.type,
        data,
        url: descriptor.url,
        loadTime,
      };

      return resource;
    } finally {
      this.loadingPromises.delete(descriptor.id);
    }
  }

  /**
   * Create appropriate loader for resource type
   */
  protected createResourceLoader(descriptor: ResourceDescriptor): Promise<any> {
    switch (descriptor.type) {
      case 'model':
        return this.loadModel(descriptor.url, descriptor.options);
      case 'texture':
        return this.loadTexture(descriptor.url, descriptor.options);
      case 'audio':
        return this.loadAudio(descriptor.url, descriptor.options);
      case 'data':
        return this.loadData(descriptor.url, descriptor.options);
      case 'font':
        return this.loadFont(descriptor.url, descriptor.options);
      default:
        throw new Error(`Unsupported resource type: ${descriptor.type}`);
    }
  }

  /**
   * Load 3D model (OBJ, GLTF, etc.)
   */
  protected async loadModel(url: string, options?: any): Promise<THREE.Object3D> {
    // This would integrate with your existing model loaders
    // For now, return a placeholder
    return new Promise((resolve, reject) => {
      // Use appropriate loader based on file extension
      const extension = url.split('.').pop()?.toLowerCase();

      if (extension === 'obj') {
        // Use OBJ loader
        const loader = new THREE.ObjectLoader();
        loader.load(url, resolve, undefined, reject);
      } else {
        reject(new Error(`Unsupported model format: ${extension}`));
      }
    });
  }

  /**
   * Load texture
   */
  protected async loadTexture(url: string, _options?: any): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        texture => {
          if (_options) {
            Object.assign(texture, _options);
          }
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Load audio file
   */
  protected async loadAudio(url: string, _options?: any): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Load data file (JSON, etc.)
   */
  protected async loadData(url: string, _options?: any): Promise<any> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  }

  /**
   * Load font (placeholder implementation)
   */
  protected async loadFont(_url: string, _options?: any): Promise<any> {
    // FontLoader not available in current Three.js version
    // This would need to be implemented with a compatible loader
    return Promise.reject(new Error('Font loading not implemented'));
  }

  /**
   * Get a loaded resource by ID
   */
  protected getResource<T = any>(id: string): LoadedResource<T> | undefined {
    return this.resources.get(id) as LoadedResource<T> | undefined;
  }

  /**
   * Get resource data directly
   */
  protected getResourceData<T = any>(id: string): T | undefined {
    return this.resources.get(id)?.data as T | undefined;
  }

  /**
   * Check if all resources are loaded
   */
  protected areResourcesLoaded(): boolean {
    const descriptors = this.getResourceDescriptors();
    return descriptors.every(desc => this.resources.has(desc.id));
  }

  /**
   * Override dispose to clean up resources
   */
  override dispose(): void {
    // Clear loading promises
    this.loadingPromises.clear();

    // Dispose of loaded resources
    this.resources.forEach(resource => {
      if (resource.data instanceof THREE.Texture) {
        resource.data.dispose();
      } else if (resource.data instanceof THREE.Object3D) {
        this.disposeObject(resource.data);
      }
    });

    this.resources.clear();

    super.dispose();
  }

  /**
   * Override serialize to include resource information
   */
  override serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      resources: Array.from(this.resources.entries()).map(([id, resource]) => ({
        id,
        type: resource.type,
        url: resource.url,
        loadTime: resource.loadTime,
      })),
    };
  }
}
