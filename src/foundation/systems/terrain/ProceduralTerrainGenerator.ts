import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { FractalNoise, type NoiseType } from './noise/FractalNoise';
import { logger } from '../../utils/logger';

// Enable BVH acceleration for raycasting
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export type TerrainType =
  | 'mountains'
  | 'hills'
  | 'flat'
  | 'canyon'
  | 'desert'
  | 'island'
  | 'plateau'
  | 'valleys';

export type NoiseMode = 'standard' | 'ridge' | 'turbulence' | 'billow';

export interface TerrainConfig {
  // Dimensions
  width?: number;
  depth?: number;
  segments?: number;

  // Height parameters
  heightScale?: number;
  heightBias?: number;

  // Noise parameters
  noiseType?: NoiseType;
  noiseMode?: NoiseMode;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  scale?: number;
  seed?: number;

  // Terrain shaping
  terrainType?: TerrainType;
  islandFalloff?: number; // 0-1, how much to apply radial falloff
  plateauHeight?: number; // For plateau terrain

  // Material
  material?: THREE.Material;
  wireframe?: boolean;
  color?: number;

  // Performance
  enableBVH?: boolean; // For raycasting optimization
}

export interface TerrainMetadata {
  minHeight: number;
  maxHeight: number;
  averageHeight: number;
  vertexCount: number;
  triangleCount: number;
  seed: number;
}

/**
 * ProceduralTerrainGenerator
 * Generates parametric terrain meshes with various presets and configurations
 */
export class ProceduralTerrainGenerator {
  private config: Required<TerrainConfig>;
  private fractalNoise: FractalNoise;
  private mesh: THREE.Mesh | null = null;
  private metadata: TerrainMetadata | null = null;

  constructor(config: TerrainConfig = {}) {
    // Default configuration
    this.config = {
      width: 10000,
      depth: 10000,
      segments: 200,
      heightScale: 1000,
      heightBias: 0,
      noiseType: 'simplex',
      noiseMode: 'standard',
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 0.0005,
      seed: Math.random(),
      terrainType: 'mountains',
      islandFalloff: 0,
      plateauHeight: 0.5,
      material: new THREE.MeshStandardMaterial({
        color: 0x4a7c59,
        wireframe: false,
      }),
      wireframe: false,
      color: 0x4a7c59,
      enableBVH: true,
      ...config,
    };

    // Initialize fractal noise generator
    this.fractalNoise = new FractalNoise({
      noiseType: this.config.noiseType,
      octaves: this.config.octaves,
      persistence: this.config.persistence,
      lacunarity: this.config.lacunarity,
      scale: this.config.scale,
      seed: this.config.seed,
    });
  }

  /**
   * Generate terrain mesh
   */
  generate(): THREE.Mesh {
    // Create base geometry
    const geometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.depth,
      this.config.segments,
      this.config.segments
    );

    // Rotate to horizontal orientation
    geometry.rotateX(-Math.PI / 2);

    // Apply height displacement based on noise
    this.applyHeightDisplacement(geometry);

    // Recompute normals for proper lighting
    geometry.computeVertexNormals();

    // Apply BVH for optimized raycasting
    if (this.config.enableBVH) {
      (geometry as any).boundsTree = new MeshBVH(geometry);
    }

    // Create material
    const material = this.createMaterial();

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    // Calculate metadata
    this.calculateMetadata(geometry);

    logger.debug('Procedural terrain generated:', this.metadata);

    return this.mesh;
  }

  /**
   * Apply height displacement to geometry vertices
   */
  private applyHeightDisplacement(geometry: THREE.BufferGeometry): void {
    const positions = geometry.attributes.position;
    const vertexCount = positions.count;

    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let totalHeight = 0;

    // Calculate center for radial falloff
    const centerX = 0;
    const centerZ = 0;
    const maxRadius = Math.sqrt(
      (this.config.width / 2) ** 2 + (this.config.depth / 2) ** 2
    );

    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Get base noise value
      let height = this.getNoiseValue(x, z);

      // Apply terrain type modifications
      height = this.applyTerrainType(height, x, z);

      // Apply island falloff if enabled
      if (this.config.islandFalloff > 0) {
        const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
        const falloff = Math.pow(1 - distance / maxRadius, 2);
        height *= THREE.MathUtils.lerp(1, falloff, this.config.islandFalloff);
      }

      // Scale and bias
      height = height * this.config.heightScale + this.config.heightBias;

      // Update statistics
      minHeight = Math.min(minHeight, height);
      maxHeight = Math.max(maxHeight, height);
      totalHeight += height;

      // Set vertex height
      positions.setY(i, height);
    }

    positions.needsUpdate = true;
  }

  /**
   * Get noise value based on configured mode
   */
  private getNoiseValue(x: number, z: number): number {
    switch (this.config.noiseMode) {
      case 'ridge':
        return this.fractalNoise.ridgeNoise2D(x, z);
      case 'turbulence':
        return this.fractalNoise.turbulence2D(x, z);
      case 'billow':
        return this.fractalNoise.billow2D(x, z);
      case 'standard':
      default:
        return this.fractalNoise.noise2D(x, z);
    }
  }

  /**
   * Apply terrain type specific modifications
   */
  private applyTerrainType(height: number, x: number, z: number): number {
    switch (this.config.terrainType) {
      case 'flat':
        return height * 0.1; // Very minimal variation

      case 'hills':
        return Math.abs(height) * 0.5; // Rolling hills

      case 'canyon':
        // Inverted peaks create valleys
        return -Math.abs(height);

      case 'desert':
        // Smooth dune-like patterns
        return Math.sin(x * 0.001) * Math.cos(z * 0.001) * 0.5 + height * 0.3;

      case 'plateau':
        // Step function for flat-topped features
        const threshold = this.config.plateauHeight;
        return height > threshold ? threshold : height * 0.5;

      case 'valleys':
        // Emphasize low areas
        return height < 0 ? height * 1.5 : height * 0.3;

      case 'island':
        // Natural island shape (handled by falloff)
        return Math.max(0, height);

      case 'mountains':
      default:
        return height; // Use raw noise
    }
  }

  /**
   * Create material based on configuration
   */
  private createMaterial(): THREE.Material {
    if (this.config.material) {
      return this.config.material;
    }

    return new THREE.MeshStandardMaterial({
      color: this.config.color,
      wireframe: this.config.wireframe,
      roughness: 0.8,
      metalness: 0.2,
    });
  }

  /**
   * Calculate terrain metadata
   */
  private calculateMetadata(geometry: THREE.BufferGeometry): void {
    const positions = geometry.attributes.position;
    const vertexCount = positions.count;

    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let totalHeight = 0;

    for (let i = 0; i < vertexCount; i++) {
      const y = positions.getY(i);
      minHeight = Math.min(minHeight, y);
      maxHeight = Math.max(maxHeight, y);
      totalHeight += y;
    }

    this.metadata = {
      minHeight,
      maxHeight,
      averageHeight: totalHeight / vertexCount,
      vertexCount,
      triangleCount: this.config.segments * this.config.segments * 2,
      seed: this.config.seed,
    };
  }

  /**
   * Update configuration and regenerate
   */
  updateConfig(newConfig: Partial<TerrainConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update fractal noise if relevant parameters changed
    if (
      newConfig.noiseType !== undefined ||
      newConfig.octaves !== undefined ||
      newConfig.persistence !== undefined ||
      newConfig.lacunarity !== undefined ||
      newConfig.scale !== undefined ||
      newConfig.seed !== undefined
    ) {
      this.fractalNoise = new FractalNoise({
        noiseType: this.config.noiseType,
        octaves: this.config.octaves,
        persistence: this.config.persistence,
        lacunarity: this.config.lacunarity,
        scale: this.config.scale,
        seed: this.config.seed,
      });
    }
  }

  /**
   * Regenerate terrain with current configuration
   */
  regenerate(): THREE.Mesh {
    if (this.mesh) {
      // Dispose old geometry and material
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
    }
    return this.generate();
  }

  /**
   * Export heightmap as Float32Array
   */
  exportHeightmap(): Float32Array | null {
    if (!this.mesh) return null;

    const positions = this.mesh.geometry.attributes.position;
    const heightmap = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
      heightmap[i] = positions.getY(i);
    }

    return heightmap;
  }

  /**
   * Get current terrain metadata
   */
  getMetadata(): TerrainMetadata | null {
    return this.metadata;
  }

  /**
   * Get current mesh
   */
  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<TerrainConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
    this.metadata = null;
  }
}