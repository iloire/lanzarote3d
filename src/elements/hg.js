import model from "../models/hang_glider_-_low_poly.glb";
import Models from "../utils/models";

const HG = {
  load: async (scale, pos) => {
    const animate = (mesh) => {
      mesh.position.y = mesh.position.y + 0.003;
      mesh.position.x = mesh.position.x + 0.03;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(model, scale, pos, {
      x: -Math.PI / 2,
    });

    animate(mesh);
    return mesh;
  },
};

export default HG;
