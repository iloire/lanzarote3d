import balloonModel from "../models/balloon.glb";
import Models from "../utils/models";

const MAX_HEIGHT = 40;

const Balloon = {
  load: async (scale, pos, speed) => {
    const xSpeed = (speed && speed.x) || 0.0003;
    const ySpeed = (speed && speed.y) || 0.0001;
    const zSpeed = (speed && speed.z) || 0.0001;
    const animate = (mesh) => {
      mesh.position.z = mesh.position.z + zSpeed;
      mesh.position.x = mesh.position.x + xSpeed;
      if (mesh.position.y < MAX_HEIGHT) {
        mesh.position.y = mesh.position.y + xSpeed;
      } else {
        const timer = Date.now() * 0.0005;
        mesh.position.y += Math.sin(timer) * ySpeed;
      }
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
