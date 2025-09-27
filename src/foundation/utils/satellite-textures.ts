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
          texture.minFilter = THREE.LinearFilter; // Use linear instead of mipmap to reduce seams
          texture.generateMipmaps = false; // Disable mipmaps to prevent seaming issues
          texture.flipY = true; // Try flipping Y for correct orientation
          texture.colorSpace = THREE.SRGBColorSpace; // Ensure correct color space
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
   * Generate UV mapping for terrain mesh using direct coordinate mapping
   */
  generateTerrainUVMapping(
    geometry: THREE.BufferGeometry,
    terrainBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    tileMapping: TileMapping,
    debugParams?: {
      offsetX: number;
      offsetY: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
      flipX: boolean;
      flipY: boolean;
    }
  ): void {
    const positions = geometry.attributes.position;
    const uvArray = new Float32Array(positions.count * 2);

    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox!;

    console.log('🗺️ Simple direct mapping approach');
    console.log(`Terrain: X(${bbox.min.x.toFixed(2)} to ${bbox.max.x.toFixed(2)}) Z(${bbox.min.z.toFixed(2)} to ${bbox.max.z.toFixed(2)})`);
    console.log(`Tiles: ${tileMapping.totalBounds.north}°N to ${tileMapping.totalBounds.south}°S, ${tileMapping.totalBounds.east}°E to ${tileMapping.totalBounds.west}°W`);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Normalize terrain coordinates to 0-1
      const xNorm = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
      const zNorm = (z - bbox.min.z) / (bbox.max.z - bbox.min.z);

      // Map directly to geographic bounds
      const longitude = tileMapping.totalBounds.west + xNorm * (tileMapping.totalBounds.east - tileMapping.totalBounds.west);
      const latitude = tileMapping.totalBounds.south + zNorm * (tileMapping.totalBounds.north - tileMapping.totalBounds.south);

      // Get UV from tile mapping
      const uvCoords = this.calculateUVCoordinates(latitude, longitude, tileMapping);

      if (uvCoords) {
        uvArray[i * 2] = uvCoords.u;
        uvArray[i * 2 + 1] = uvCoords.v;
      } else {
        // Direct UV mapping as fallback
        uvArray[i * 2] = xNorm;
        uvArray[i * 2 + 1] = 1.0 - zNorm;
      }

      if (i < 10) {
        const uvSuccess = uvCoords ? '✅' : '❌';
        console.log(`Vertex ${i}: terrain(${x.toFixed(2)},${z.toFixed(2)}) → norm(${xNorm.toFixed(3)},${zNorm.toFixed(3)}) → geo(${latitude.toFixed(4)},${longitude.toFixed(4)}) → UV(${uvArray[i * 2].toFixed(3)},${uvArray[i * 2 + 1].toFixed(3)}) ${uvSuccess}`);
      }
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    console.log(`✅ Direct UV mapping complete: ${positions.count} vertices`);
  }

  /**
   * Create default Lanzarote satellite configuration
   */
  static createLanzaroteConfig(): StaticSatelliteConfig {
    return {
      textureAtlas: '/assets/textures/lanzarote-satellite-atlas-complete.jpg?v=' + Date.now(),
      tileMap: '/assets/textures/lanzarote-tile-mapping-complete.json?v=' + Date.now(),
      attribution: '© Esri, Maxar, Earthstar Geographics',
      source: 'esri',
      resolution: 10, // 10 meters per pixel (zoom 12)
      bounds: {
        north: 29.250,   // Complete grid coverage
        south: 28.606,   // Complete grid coverage
        east: -13.526,   // Complete grid coverage
        west: -13.878    // Complete grid coverage
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