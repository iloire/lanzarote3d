import model from "../models/clouds.glb";
import model2 from "../models/low_poly_cloud.glb";
import Models from "../utils/models";

const Cloud = {
  load: async (type, pos, scale) => {
    const animate = (mesh) => {
      // mesh.position.y = mesh.position.y + 0.003;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(type === 1 ? model : model2, scale, pos, {
      x: -Math.PI / 2,
    });

    // animate(mesh);
    return mesh;
  },
};

export default Cloud;
