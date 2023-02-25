import * as THREE from "three";
import blackCloud from "../models/clouds.glb";
import whiteCloud from "../models/low_poly_cloud.glb";
import textureImg from "../textures/Parachute_01_D.png";
import Models from "../utils/models";

export type CloudType = "BLACK" | "WHITE";

const Cloud = {
  load: async (type: CloudType) => {
    const animate = (mesh) => {
      const timer = Date.now() * 0.05;
      // mesh.position.x = mesh.position.x + 0.3;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 0.1;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(
      type === "BLACK" ? blackCloud : whiteCloud,
      type === "BLACK" ? 2 : 30
    );

    var mat001 = new THREE.MeshPhysicalMaterial();
    mat001.color = new THREE.Color("gold");
    mat001.reflectivity = 1.0;
    mat001.roughness = 0.0;
    mat001.envMapIntensity = 1.0;

    // const textureLoader = new THREE.TextureLoader(Models.manager);
    // const texture = await textureLoader.load(textureImg);
    // mesh.material = new THREE.MeshStandardMaterial({ map: texture });
    mesh.material = mat001;

    animate(mesh);
    return mesh;
  },
};

export default Cloud;
