import * as THREE from "three";
import blackCloud from "../models/clouds.glb";
import whiteCloud from "../models/low_poly_cloud.glb";
import Models from "../utils/models";

export type CloudType = "BLACK" | "WHITE";

const Cloud = {
  load: async (type: CloudType) => {
    const animate = (mesh) => {
      const timer = (Date.now() + Math.random() * 1000) * 0.001;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 1;
      requestAnimationFrame(() => animate(mesh));
    };
    const mesh = await Models.loadSimple(
      type === "BLACK" ? blackCloud : whiteCloud
    );

    const scale = type === "BLACK" ? 2 : 30;
    mesh.scale.set(scale, scale, scale);
    animate(mesh);
    return mesh;
  },
};

export default Cloud;
