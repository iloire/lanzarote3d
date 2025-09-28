import * as THREE from 'three';
import Models from '../../utils/models';

export type PilotVoxelOptions = {
  objFile: string;
  textureFile: string;
};

class LegacyPilotVoxel {
  options: PilotVoxelOptions;

  constructor(options: PilotVoxelOptions) {
    this.options = options;
  }

  async load(): Promise<THREE.Object3D> {
    const mesh = await Models.loadObj(this.options.objFile);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.options.textureFile);

    // Ensure texture uses correct color space and filtering
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    mesh.traverse(function (child) {
      if ((child as any).isMesh) {
        // Create a new material with better lighting properties
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: false,
          side: THREE.DoubleSide,
          roughness: 0.8,
          metalness: 0.1,
        });
        (child as any).material = material;
      }
    });
    return mesh;
  }
}

export default LegacyPilotVoxel;
