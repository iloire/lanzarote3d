import model from "../models/lanzarote.glb";
import Models from "../utils/models";
import textureImg from "../textures/red_laterite_soil_stones_diff_4k.jpg";
import * as THREE from "three";

const Island = {
  load: async (scale, pos) => {
    const textureLoader = new THREE.TextureLoader(Models.manager);
    const mesh = await Models.load(model, scale, pos);

    const texture = await textureLoader.load(textureImg);
    mesh.material = new THREE.MeshStandardMaterial({ map: texture });
    return mesh;
  },
};

export default Island;