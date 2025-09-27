import * as THREE from 'three';
import { StaticSatelliteConfig } from '../types/Theme';

export interface TileMapping {
  tiles: Array<{
    x: number;
    y: number;
    zoom: number;
    uvBounds: {
      uMin: number;
      vMin: number;
      uMax: number;
      vMax: number;
    };
    geoExtent: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }>;
  attribution: string;
  totalBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * SatelliteTextureManager - Handles loading and UV mapping of pre-downloaded satellite imagery
 *
 * Supports loading static texture atlases with proper geographic coordinate mapping
 * for accurate terrain texture application.
 */
export class SatelliteTextureManager {
  private textureCache = new Map<string, THREE.Texture>();
  private tileMappingCache = new Map<string, TileMapping>();

  /**
   * Load satellite texture and tile mapping configuration
   */
  async loadSatelliteTexture(
    config: StaticSatelliteConfig,
    manager?: THREE.LoadingManager
  ): Promise<{ texture: THREE.Texture; tileMapping: TileMapping }> {
    const cacheKey = config.textureAtlas;

    // Check cache first
    const cachedTexture = this.textureCache.get(cacheKey);
    const cachedMapping = this.tileMappingCache.get(config.tileMap);

    if (cachedTexture && cachedMapping) {
      return { texture: cachedTexture, tileMapping: cachedMapping };
    }

    // Load texture atlas
    const texture = await this.loadTexture(config.textureAtlas, manager);

    // Load tile mapping configuration
    const tileMapping = await this.loadTileMapping(config.tileMap);

    // Cache for future use
    this.textureCache.set(cacheKey, texture);
    this.tileMappingCache.set(config.tileMap, tileMapping);

    return { texture, tileMapping };
  }

  /**
   * Load texture from URL
   */
  private loadTexture(url: string, manager?: THREE.LoadingManager): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader(manager);
      loader.load(
        url,
        (texture) => {
          // Configure texture for optimal satellite imagery display
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.generateMipmaps = true;
          texture.flipY = false; // Important for satellite imagery
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Load tile mapping configuration from JSON
   */
  private async loadTileMapping(url: string): Promise<TileMapping> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tile mapping: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Error loading tile mapping from ${url}: ${error}`);
    }
  }

  /**
   * Calculate UV coordinates for a geographic point
   */
  calculateUVCoordinates(
    latitude: number,
    longitude: number,
    tileMapping: TileMapping
  ): { u: number; v: number } | null {
    const { totalBounds } = tileMapping;

    // Check if point is within bounds
    if (
      latitude < totalBounds.south ||
      latitude > totalBounds.north ||
      longitude < totalBounds.west ||
      longitude > totalBounds.east
    ) {
      return null;
    }

    // Find the tile that contains this coordinate
    const containingTile = tileMapping.tiles.find(tile => {
      const { geoExtent } = tile;
      return (
        latitude >= geoExtent.south &&
        latitude <= geoExtent.north &&
        longitude >= geoExtent.west &&
        longitude <= geoExtent.east
      );
    });

    if (!containingTile) {
      return null;
    }

    // Calculate normalized position within the tile's geographic extent
    const { geoExtent, uvBounds } = containingTile;

    const latNorm = (latitude - geoExtent.south) / (geoExtent.north - geoExtent.south);
    const lonNorm = (longitude - geoExtent.west) / (geoExtent.east - geoExtent.west);

    // Map to UV coordinates within the tile's UV bounds
    const u = uvBounds.uMin + lonNorm * (uvBounds.uMax - uvBounds.uMin);
    const v = uvBounds.vMin + latNorm * (uvBounds.vMax - uvBounds.vMin);

    return { u, v };
  }

  /**
   * Generate UV mapping for terrain mesh based on geographic bounds
   */
  generateTerrainUVMapping(
    geometry: THREE.BufferGeometry,
    terrainBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    tileMapping: TileMapping
  ): void {
    const positions = geometry.attributes.position;
    const uvArray = new Float32Array(positions.count * 2);

    // Assuming terrain coordinates are in world space
    // This would need to be adapted based on your specific coordinate system
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Convert world coordinates to geographic coordinates
      // This is a simplified conversion - you'll need to adapt to your coordinate system
      const longitude = terrainBounds.west + ((x + 10000) / 20000) * (terrainBounds.east - terrainBounds.west);
      const latitude = terrainBounds.south + ((z + 10000) / 20000) * (terrainBounds.north - terrainBounds.south);

      const uvCoords = this.calculateUVCoordinates(latitude, longitude, tileMapping);

      if (uvCoords) {
        uvArray[i * 2] = uvCoords.u;
        uvArray[i * 2 + 1] = uvCoords.v;
      } else {
        // Fallback to simple planar mapping if outside tile bounds
        uvArray[i * 2] = (x + 10000) / 20000;
        uvArray[i * 2 + 1] = (z + 10000) / 20000;
      }
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
  }

  /**
   * Create default Lanzarote satellite configuration
   */
  static createLanzaroteConfig(): StaticSatelliteConfig {
    return {
      textureAtlas: '/assets/textures/lanzarote-satellite-atlas.jpg',
      tileMap: '/assets/textures/lanzarote-tile-mapping.json',
      attribution: '© OpenStreetMap contributors',
      source: 'openstreetmap',
      resolution: 10, // 10 meters per pixel
      bounds: {
        north: 29.25,
        south: 28.85,
        east: -13.40,
        west: -13.90
      }
    };
  }

  /**
   * Dispose of cached resources
   */
  dispose(): void {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    this.tileMappingCache.clear();
  }
}

export default SatelliteTextureManager;