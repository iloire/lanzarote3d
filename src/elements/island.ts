import model from "../models/lanzarote.glb";
import Models from "../utils/models";
import textureImg from "../textures/mars1.jpg";
import textureImgHeightMap from "../textures/h-map-lanzarote.png";
import * as THREE from "three";

const loadFromDisplacement = async () => {
  const loader = new THREE.TextureLoader();
  const displacement = await loader.load(textureImgHeightMap);
  const groundGeometry = new THREE.PlaneGeometry(3, 3, 300, 300);
  const groundMaterial = new THREE.MeshPhongMaterial({
    // wireframe: true,
    color: "red",
    displacementMap: displacement,
    displacementScale: 2,
    // displacementBias: 2,
    map: displacement,
  });

  const mesh = new THREE.Mesh(groundGeometry, groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  console.log(mesh);
  return mesh;
};

const USE_BLENDER_MODEL = true;

const Island = {
  load: async (manager: THREE.LoadingManager): Promise<THREE.Mesh> => {
    if (USE_BLENDER_MODEL) {
      const mesh = await Models.loadSimple(model, manager);
      const textureLoader = new THREE.TextureLoader(manager);
      const texture = await textureLoader.load(textureImg);
      mesh.material = new THREE.MeshStandardMaterial({
        map: texture,
        // wireframe: true,
        depthTest: true,
      });
      return mesh;
    } else {
      return loadFromDisplacement();
    }
  },
};

export default Island;
