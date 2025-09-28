import * as THREE from 'three';

/**
 * Resource cache entry
 */
interface CacheEntry<T = any> {
  readonly id: string;
  readonly data: T;
  readonly size: number;
  readonly lastAccessed: number;
  readonly referenceCount: number;
  readonly url?: string;
  readonly type: ResourceType;
}

/**
 * Resource types managed by the system
 */
export type ResourceType = 'geometry' | 'material' | 'texture' | 'audio' | 'model' | 'data';

/**
 * Resource loading options
 */
export interface ResourceOptions {
  cache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retries?: number;
}

/**
 * Resource statistics
 */
export interface ResourceStats {
  totalItems: number;
  totalSize: number;
  geometries: number;
  materials: number;
  textures: number;
  models: number;
  memoryUsage: {
    geometries: number;
    materials: number;
    textures: number;
    total: number;
  };
}

/**
 * Material configuration for sharing
 */
export interface MaterialConfig {
  type: 'basic' | 'standard' | 'phong' | 'lambert' | 'physical';
  color?: number | string;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
  side?: THREE.Side;
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  envMap?: THREE.Texture;
  [key: string]: any;
}

/**
 * Centralized resource management system for Three.js components
 *
 * Features:
 * - Material sharing and pooling
 * - Geometry instance management
 * - Texture caching with automatic disposal
 * - Memory usage tracking
 * - Automatic cleanup of unused resources
 * - Performance optimization through resource reuse
 */
export class ResourceManager {
  private static instance: ResourceManager;

  private cache = new Map<string, CacheEntry>();
  private materialPool = new Map<string, THREE.Material>();
  private geometryPool = new Map<string, THREE.BufferGeometry>();
  private textureCache = new Map<string, THREE.Texture>();

  // Configuration
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private maxCacheItems = 1000;
  private cleanupInterval = 30000; // 30 seconds
  private maxIdleTime = 300000; // 5 minutes

  private cleanupTimer?: number;

  private constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Create or retrieve a shared material
   */
  public getMaterial(id: string, config: MaterialConfig): THREE.Material {
    const cacheKey = `material_${id}_${this.hashConfig(config)}`;

    if (this.materialPool.has(cacheKey)) {
      const material = this.materialPool.get(cacheKey)!;
      this.updateReferenceCount(cacheKey, 1);
      return material;
    }

    const material = this.createMaterial(config);
    this.storeMaterial(cacheKey, material, config);

    return material;
  }

  /**
   * Create or retrieve a shared geometry
   */
  public getGeometry(id: string, generator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (this.geometryPool.has(id)) {
      const geometry = this.geometryPool.get(id)!;
      this.updateReferenceCount(id, 1);
      return geometry;
    }

    const geometry = generator();
    this.storeGeometry(id, geometry);

    return geometry;
  }

  /**
   * Convenience method: Create or retrieve a shared material with simple options
   */
  public getOrCreateMaterial(id: string, generator: () => THREE.Material): THREE.Material {
    if (this.materialPool.has(id)) {
      const material = this.materialPool.get(id)!;
      this.updateReferenceCount(id, 1);
      return material;
    }

    const material = generator();
    this.materialPool.set(id, material);

    // Store in cache for tracking
    this.cache.set(id, {
      id,
      data: material,
      size: this.estimateMaterialSize(material),
      lastAccessed: Date.now(),
      referenceCount: 1,
      type: 'material'
    });

    return material;
  }

  /**
   * Convenience method: Create or retrieve a shared geometry
   */
  public getOrCreateGeometry(id: string, generator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    return this.getGeometry(id, generator);
  }

  /**
   * Load and cache texture
   */
  public async getTexture(url: string, options?: ResourceOptions): Promise<THREE.Texture> {
    const cacheKey = `texture_${url}`;

    if (this.textureCache.has(cacheKey)) {
      const texture = this.textureCache.get(cacheKey)!;
      this.updateReferenceCount(cacheKey, 1);
      return texture;
    }

    const texture = await this.loadTexture(url, options);
    this.storeTexture(cacheKey, texture, url);

    return texture;
  }

  /**
   * Release reference to a resource
   */
  public releaseResource(id: string): void {
    const entry = this.cache.get(id);
    if (entry) {
      this.updateReferenceCount(id, -1);

      // If no more references, mark for cleanup
      if (entry.referenceCount <= 0) {
        this.cache.set(id, {
          ...entry,
          lastAccessed: Date.now()
        });
      }
    }
  }

  /**
   * Get resource usage statistics
   */
  public getStats(): ResourceStats {
    let totalSize = 0;
    let geometries = 0;
    let materials = 0;
    let textures = 0;
    let models = 0;

    const memoryUsage = {
      geometries: 0,
      materials: 0,
      textures: 0,
      total: 0
    };

    this.cache.forEach(entry => {
      totalSize += entry.size;

      switch (entry.type) {
        case 'geometry':
          geometries++;
          memoryUsage.geometries += entry.size;
          break;
        case 'material':
          materials++;
          memoryUsage.materials += entry.size;
          break;
        case 'texture':
          textures++;
          memoryUsage.textures += entry.size;
          break;
        case 'model':
          models++;
          break;
      }
    });

    memoryUsage.total = memoryUsage.geometries + memoryUsage.materials + memoryUsage.textures;

    return {
      totalItems: this.cache.size,
      totalSize,
      geometries,
      materials,
      textures,
      models,
      memoryUsage
    };
  }

  /**
   * Force cleanup of unused resources
   */
  public cleanup(force = false): void {
    const now = Date.now();
    const itemsToRemove: string[] = [];

    this.cache.forEach((entry, id) => {
      const shouldRemove = force || (
        entry.referenceCount <= 0 &&
        (now - entry.lastAccessed) > this.maxIdleTime
      );

      if (shouldRemove) {
        itemsToRemove.push(id);
      }
    });

    itemsToRemove.forEach(id => {
      this.removeFromCache(id);
    });

    // Check cache size limits
    this.enforceCacheLimits();
  }

  /**
   * Clear all cached resources
   */
  public clear(): void {
    this.cache.forEach((_, id) => {
      this.removeFromCache(id);
    });

    this.materialPool.clear();
    this.geometryPool.clear();
    this.textureCache.clear();
  }

  /**
   * Dispose of the resource manager
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.clear();
  }

  // Private methods

  private createMaterial(config: MaterialConfig): THREE.Material {
    let material: THREE.Material;

    switch (config.type) {
      case 'basic':
        material = new THREE.MeshBasicMaterial();
        break;
      case 'standard':
        material = new THREE.MeshStandardMaterial();
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial();
        break;
      case 'lambert':
        material = new THREE.MeshLambertMaterial();
        break;
      case 'physical':
        material = new THREE.MeshPhysicalMaterial();
        break;
      default:
        material = new THREE.MeshStandardMaterial();
    }

    // Apply configuration
    Object.keys(config).forEach(key => {
      if (key !== 'type' && key in material) {
        (material as any)[key] = config[key];
      }
    });

    return material;
  }

  private async loadTexture(url: string, options?: ResourceOptions): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();

      const timeout = options?.timeout || 10000;
      const timeoutId = setTimeout(() => {
        reject(new Error(`Texture loading timeout: ${url}`));
      }, timeout);

      loader.load(
        url,
        (texture) => {
          clearTimeout(timeoutId);
          resolve(texture);
        },
        undefined,
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  private storeMaterial(id: string, material: THREE.Material, _config: MaterialConfig): void {
    this.materialPool.set(id, material);

    const size = this.estimateMaterialSize(material);
    const entry: CacheEntry = {
      id,
      data: material,
      size,
      lastAccessed: Date.now(),
      referenceCount: 1,
      type: 'material'
    };

    this.cache.set(id, entry);
  }

  private storeGeometry(id: string, geometry: THREE.BufferGeometry): void {
    this.geometryPool.set(id, geometry);

    const size = this.calculateGeometrySize(geometry);
    const entry: CacheEntry = {
      id,
      data: geometry,
      size,
      lastAccessed: Date.now(),
      referenceCount: 1,
      type: 'geometry'
    };

    this.cache.set(id, entry);
  }

  private storeTexture(id: string, texture: THREE.Texture, url: string): void {
    this.textureCache.set(id, texture);

    const size = this.calculateTextureSize(texture);
    const entry: CacheEntry = {
      id,
      data: texture,
      size,
      lastAccessed: Date.now(),
      referenceCount: 1,
      url,
      type: 'texture'
    };

    this.cache.set(id, entry);
  }

  private updateReferenceCount(id: string, delta: number): void {
    const entry = this.cache.get(id);
    if (entry) {
      this.cache.set(id, {
        ...entry,
        referenceCount: Math.max(0, entry.referenceCount + delta),
        lastAccessed: Date.now()
      });
    }
  }

  private removeFromCache(id: string): void {
    const entry = this.cache.get(id);
    if (!entry) return;

    // Dispose of the resource
    if (entry.data instanceof THREE.Material) {
      entry.data.dispose();
      this.materialPool.delete(id);
    } else if (entry.data instanceof THREE.BufferGeometry) {
      entry.data.dispose();
      this.geometryPool.delete(id);
    } else if (entry.data instanceof THREE.Texture) {
      entry.data.dispose();
      this.textureCache.delete(id);
    }

    this.cache.delete(id);
  }

  private hashConfig(config: any): string {
    // Simple hash function for configuration objects
    return btoa(JSON.stringify(config)).slice(0, 16);
  }

  private estimateMaterialSize(material: THREE.Material): number {
    // Rough estimate of material memory usage
    let size = 1024; // Base size for material properties

    // Add texture sizes
    Object.values(material).forEach(value => {
      if (value instanceof THREE.Texture) {
        size += this.calculateTextureSize(value);
      }
    });

    return size;
  }

  private calculateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0;

    Object.values(geometry.attributes).forEach(attribute => {
      size += attribute.array.byteLength;
    });

    if (geometry.index) {
      size += geometry.index.array.byteLength;
    }

    return size;
  }

  private calculateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 0;

    const width = texture.image.width || 0;
    const height = texture.image.height || 0;

    // Estimate: 4 bytes per pixel for RGBA
    return width * height * 4;
  }

  private enforceCacheLimits(): void {
    const stats = this.getStats();

    if (stats.totalSize > this.maxCacheSize || stats.totalItems > this.maxCacheItems) {
      // Sort by last accessed time and remove oldest
      const entries = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.referenceCount <= 0)
        .sort(([_, a], [__, b]) => a.lastAccessed - b.lastAccessed);

      const removeCount = Math.max(
        Math.floor(entries.length * 0.1), // Remove at least 10%
        stats.totalItems - this.maxCacheItems
      );

      for (let i = 0; i < removeCount && i < entries.length; i++) {
        this.removeFromCache(entries[i][0]);
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
}

// Export singleton instance
export const resourceManager = ResourceManager.getInstance();