import balloonModel from "../models/balloon.glb";
import Models from "../utils/models";

const Balloon = {
  load: async (scale, pos) => {
    const animate = (mesh) => {
      mesh.position.x = mesh.position.x + 0.0003;
      mesh.position.y = mesh.position.y + 0.003;
      requestAnimationFrame(() => animate(mesh));
    };

    const mesh = await Models.load(balloonModel, scale, pos, {
      x: -Math.PI / 2,
    });

    animate(mesh);
    return mesh;
  },
};

export default Balloon;
