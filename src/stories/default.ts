import * as THREE from "three";
import PG from "../elements/pg";
import Navigation from "../utils/navigation";
import Controls from "../utils/controls";

const Default = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer
  ) => {
    const controls = Controls.createControls(camera, renderer);
    const navigator = Navigation(camera, controls);

    camera.position.set(0, 600, 1200);

    navigator.famara(2000, () => {
      navigator.orzola();
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      const timer = Date.now() * 0.0005;
      camera && (camera.position.y += Math.sin(timer) * 0.0003);
      renderer.render(scene, camera);
    };

    animate();
  },
};

export default Default;
