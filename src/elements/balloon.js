import balloonModel from "../models/balloon.glb";
import Models from "../utils/models";

const Balloon = {
  load: (pos, cb) => {
    const animateBallon = (mesh) => {
      mesh.position.y = mesh.position.y + 0.003;
      requestAnimationFrame(() => animateBallon(mesh));
    };
    Models.load(
      null,
      balloonModel,
      0.0008,
      pos || { x: 34, y: 3, z: 9 },
      { x: -Math.PI / 2 },
      (mesh) => {
        animateBallon(mesh);
        cb(mesh);
      }
    );
  },
};
export default Balloon;
