import * as THREE from "three";
import model from "../models/lanzarote.glb";
import Models from "../utils/models";
import textureImg from "../textures/mars1.jpg";
import textureImgHeightMap from "../textures/h-map-lanzarote.png";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

THREE.Mesh.prototype.raycast = acceleratedRaycast;


// const loadTexture = async (manager): Promise<any> => {
//   const textureLoader = new THREE.TextureLoader(manager);
//   const texture = await textureLoader.load(textureImg);
//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;
//   texture.repeat.set(5, 5);
//   return texture;
// };

const loadFromBlenderModel = async (manager: THREE.LoadingManager) => {
  const mesh = await Models.loadSimple(model, manager);
  mesh.material = new THREE.MeshStandardMaterial({
    // map: await loadTexture(manager),
    wireframe: true,
    depthTest: true,
  });
  mesh.geometry.boundsTree = new MeshBVH(mesh.geometry);
  return mesh;
};



const Island = {
  load: async (manager: THREE.LoadingManager): Promise<THREE.Mesh> => {
    return loadFromBlenderModel(manager);
  },
};

export default Island;
