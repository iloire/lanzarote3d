import * as THREE from "three";
import Models from "../utils/models";

export type PilotVoxelOptions = {
  objFile: string;
  textureFile: string
};


class PilotVoxel {
  options: PilotVoxelOptions;

  constructor(options: PilotVoxelOptions) {
    this.options = options;
  }

  async load(): Promise<THREE.Object3D> {
    const mesh = await Models.loadObj(this.options.objFile);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.options.textureFile);
    mesh.traverse(function(child) {
      if (child.isMesh) {
        child.material.map = texture;
      }
    });
    return mesh;
  }
}

export default PilotVoxel;
