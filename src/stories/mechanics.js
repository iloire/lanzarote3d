import * as THREE from "three";
import Controls from "../utils/controls";
const Mechanics = {
  load: async (camera, scene, renderer, terrain, water, gui) => {
    const controls = Controls.createControls(camera, renderer);
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
    camera.position.set(12000, 1500, -12000);
    camera.lookAt(0, 0, 0);
  },
};

export default Mechanics;
