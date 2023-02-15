import model from "../models/parachute_-_low_poly.glb";
import Models from "../utils/models";

const PG = {
  load: async (scale, pos, speed) => {
    const animate = (mesh) => {
      if (speed) {
        mesh.position.y = mesh.position.y + speed.y;
        mesh.position.x = mesh.position.x + speed.x;
        mesh.position.z = mesh.position.z + speed.z;
        requestAnimationFrame(() => animate(mesh));
      }
    };

    const mesh = await Models.load(model, scale, pos);

    animate(mesh);
    return mesh;
  },
};

export default PG;
