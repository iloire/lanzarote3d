import model from "../models/clouds.glb";
import model2 from "../models/low_poly_cloud.glb";
import Models from "../utils/models";

const Cloud = {
  load: async (type, scale, pos) => {
    const animate = (mesh) => {
      const timer = Date.now() * 0.0005;
      mesh.position.x = mesh.position.x + 0.0003;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 0.001;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(type === 1 ? model : model2, scale, pos, {
      x: -Math.PI / 2,
    });

    animate(mesh);
    return mesh;
  },
};

export default Cloud;
