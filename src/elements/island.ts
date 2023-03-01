import model from "../models/lanzarote.glb";
import Models from "../utils/models";
import textureImg from "../textures/mars1.jpg";
import * as THREE from "three";

const Island = {
  load: async (manager: THREE.LoadingManager): Promise<THREE.Mesh> => {
    const mesh = await Models.loadSimple(model, manager);
    const textureLoader = new THREE.TextureLoader(manager);
    const texture = await textureLoader.load(textureImg);
    mesh.material = new THREE.MeshStandardMaterial({ map: texture });
    return mesh;
  },
};

export default Island;
