import * as THREE from 'three';
import model from '../../../../assets/foundation/models/environment/lanzarote.glb';
import Models from '../../utils/models';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { TerrainTheme } from '../../types/Theme';

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

  /**
   * Load the island mesh from the Blender model
   */
  async load(manager: THREE.LoadingManager): Promise<THREE.Mesh> {
    this.mesh = await loadFromBlenderModel(manager);
    return this.mesh;
  }

  /**
   * Apply terrain theme styling to the island mesh
   */
  applyTheme(terrainTheme: TerrainTheme): void {
    if (!this.mesh || !this.mesh.material) {
      console.warn('Island mesh not loaded - cannot apply theme');
      return;
    }

    console.log('Applying terrain theme to island:', terrainTheme);

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
   * Get the current mesh (for external theme application)
   */
  getMesh(): THREE.Mesh | null {
    return this.mesh;
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
