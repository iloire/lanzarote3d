import * as THREE from "three";
import model from "../models/lanzarote.glb";
import Models from "../utils/models";
import textureImg from "../textures/mars1.jpg";
import textureImgHeightMap from "../textures/h-map-lanzarote.png";

const USE_BLENDER_MODEL = true;

const loadFromDisplacement = async () => {
  const loader = new THREE.TextureLoader();
  const displacement = await loader.load(textureImgHeightMap);
  const groundGeometry = new THREE.PlaneGeometry(100000, 100000, 300, 300);
  const groundMaterial = new THREE.MeshPhongMaterial({
    // wireframe: true,
    color: "red",
    displacementMap: displacement,
    displacementScale: 200,
    // displacementBias: 2,
    map: displacement,
  });

  const mesh = new THREE.Mesh(groundGeometry, groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const Island = {
  load: async (manager: THREE.LoadingManager): Promise<THREE.Mesh> => {
    if (USE_BLENDER_MODEL) {
      const mesh = await Models.loadSimple(model, manager);
      const textureLoader = new THREE.TextureLoader(manager);
      const texture = await textureLoader.load(textureImg);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
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
