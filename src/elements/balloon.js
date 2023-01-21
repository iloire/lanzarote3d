import balloonModel from "../models/balloon.glb";
import Models from "../utils/models";

const Balloon = {
  load: async (pos) => {
    const animateBallon = (mesh) => {
      mesh.position.y = mesh.position.y + 0.003;
      requestAnimationFrame(() => animateBallon(mesh));
    };

    const mesh = await Models.load(
      balloonModel,
      0.0008,
      pos || { x: 34, y: 3, z: 9 },
      { x: -Math.PI / 2 }
    );

    console.log(mesh);

    animateBallon(mesh);
    return mesh;
  },
};

export default Balloon;
