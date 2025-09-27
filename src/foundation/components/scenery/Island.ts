import * as THREE from 'three';
import model from '../../../../assets/foundation/models/environment/lanzarote.glb';
import Models from '../../utils/models';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { TerrainTheme, SatelliteImageryConfig } from '../../types/Theme';
import SatelliteTextureManager from '../../utils/satellite-textures';

THREE.Mesh.prototype.raycast = acceleratedRaycast;

const loadFromBlenderModel = async (manager: THREE.LoadingManager) => {
  const object = await Models.loadSimple(model, manager);
  const mesh = object as THREE.Mesh;
  mesh.material = new THREE.MeshStandardMaterial({
    // map: await loadTexture(manager),
    wireframe: true,
    depthTest: true,
  });
  mesh.geometry.boundsTree = new MeshBVH(mesh.geometry);
  return mesh;
};

class Island {
  private mesh: THREE.Mesh | null = null;
  private satelliteManager: SatelliteTextureManager;
  private originalMaterial: THREE.Material | THREE.Material[] | null = null;

  constructor() {
    this.satelliteManager = new SatelliteTextureManager();
  }

  /**
   * Load the island mesh from the Blender model
   */
  async load(manager: THREE.LoadingManager): Promise<THREE.Mesh> {
    this.mesh = await loadFromBlenderModel(manager);
    // Store original material for fallback
    if (this.mesh.material) {
      this.originalMaterial = this.mesh.material;
    }
    return this.mesh;
  }

  /**
   * Apply terrain theme styling to the island mesh
   */
  async applyTheme(terrainTheme: TerrainTheme): Promise<void> {
    if (!this.mesh || !this.mesh.material) {
      console.warn('Island mesh not loaded - cannot apply theme');
      return;
    }

    console.log('Applying terrain theme to island:', terrainTheme);

    // Handle satellite imagery mode
    if (terrainTheme.style === 'satellite' && terrainTheme.satelliteImagery?.enabled) {
      await this.applySatelliteTexture(terrainTheme.satelliteImagery);
      return;
    }

    // Handle regular material themes
    const material = this.mesh.material as THREE.MeshStandardMaterial;

    // Apply custom material properties if provided
    if (terrainTheme.customMaterial) {
      const custom = terrainTheme.customMaterial;

      // Color
      if (custom.color) {
        material.color = new THREE.Color(custom.color);
      }

      // Emissive properties
      if (custom.emissive) {
        material.emissive = new THREE.Color(custom.emissive);
      }
      if (custom.emissiveIntensity !== undefined) {
        material.emissiveIntensity = custom.emissiveIntensity;
      }

      // Surface properties
      if (custom.roughness !== undefined) {
        material.roughness = custom.roughness;
      }
      if (custom.metalness !== undefined) {
        material.metalness = custom.metalness;
      }

      // Transparency and wireframe
      if (custom.opacity !== undefined) {
        material.opacity = custom.opacity;
        material.transparent = custom.opacity < 1.0 || custom.transparent === true;
      }
      if (custom.transparent !== undefined) {
        material.transparent = custom.transparent;
      }
      if (custom.wireframe !== undefined) {
        material.wireframe = custom.wireframe;
      }

      // Displacement (if supported by geometry)
      if (custom.displacementScale !== undefined) {
        material.displacementScale = custom.displacementScale;
      }
      if (custom.displacementBias !== undefined) {
        material.displacementBias = custom.displacementBias;
      }

      // Visibility
      if (custom.visible !== undefined) {
        this.mesh.visible = custom.visible;
      }

      // Force material update
      material.needsUpdate = true;
    }

    console.log('Island terrain theme applied successfully');
  }

  /**
   * Apply satellite texture to the terrain mesh
   */
  private async applySatelliteTexture(satelliteConfig: SatelliteImageryConfig): Promise<void> {
    if (!this.mesh || !satelliteConfig.staticConfig) {
      console.warn('Cannot apply satellite texture: missing mesh or static config');
      return;
    }

    try {
      // Load satellite texture and tile mapping
      const { texture, tileMapping } = await this.satelliteManager.loadSatelliteTexture(
        satelliteConfig.staticConfig
      );

      // Generate UV mapping for the terrain geometry
      this.satelliteManager.generateTerrainUVMapping(
        this.mesh.geometry,
        satelliteConfig.staticConfig.bounds,
        tileMapping
      );

      // Create satellite material
      const satelliteMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        transparent: satelliteConfig.opacity !== undefined,
        opacity: satelliteConfig.opacity || 1.0,
      });

      // Apply blend mode if specified
      if (satelliteConfig.blendMode) {
        this.applyBlendMode(satelliteMaterial, satelliteConfig.blendMode);
      }

      // Apply UV mapping adjustments if specified
      if (satelliteConfig.uvMapping) {
        texture.offset.set(satelliteConfig.uvMapping.offsetU, satelliteConfig.uvMapping.offsetV);
        texture.repeat.set(satelliteConfig.uvMapping.scaleU, satelliteConfig.uvMapping.scaleV);
      }

      this.mesh.material = satelliteMaterial;

      console.log('✅ Satellite texture applied successfully');
    } catch (error) {
      console.error('Failed to apply satellite texture:', error);

      // Fallback to wireframe if specified
      if (satelliteConfig.fallbackToWireframe && this.originalMaterial) {
        if (Array.isArray(this.originalMaterial)) {
          const fallbackMaterial = this.originalMaterial[0].clone();
          (fallbackMaterial as any).wireframe = true;
          this.mesh.material = fallbackMaterial;
        } else {
          const fallbackMaterial = this.originalMaterial.clone();
          (fallbackMaterial as any).wireframe = true;
          this.mesh.material = fallbackMaterial;
        }
        console.log('Applied wireframe fallback due to satellite texture failure');
      }
    }
  }

  /**
   * Apply blend mode to material
   */
  private applyBlendMode(material: THREE.MeshStandardMaterial, blendMode: string): void {
    switch (blendMode) {
      case 'multiply':
        material.blending = THREE.MultiplyBlending;
        break;
      case 'screen':
        material.blending = THREE.AdditiveBlending;
        break;
      case 'overlay':
        // THREE.js doesn't have overlay blending, use normal
        material.blending = THREE.NormalBlending;
        break;
      case 'normal':
      default:
        material.blending = THREE.NormalBlending;
        break;
    }
  }

  /**
   * Get the current mesh (for external theme application)
   */
  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.satelliteManager.dispose();
    if (this.mesh) {
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
    }
  }
}

// Export both the class and a legacy-compatible static interface
const IslandLegacy = {
  load: async (manager: THREE.LoadingManager): Promise<THREE.Mesh> => {
    const island = new Island();
    return island.load(manager);
  },
};

export { Island };
export default IslandLegacy;
