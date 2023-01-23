import model from "../models/parachute_-_low_poly.glb";
import Models from "../utils/models";

const PG = {
  load: async (scale, pos) => {
    const animate = (mesh) => {
      mesh.position.y = mesh.position.y + 0.0001;
      mesh.position.x = mesh.position.x + 0.00003;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(model, scale, pos, {
      x: -Math.PI / 2,
    });

    animate(mesh);
    return mesh;
  },
};

export default PG;
