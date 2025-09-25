import { StoryOptions } from "../../../shared/types";

const Night = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, sky, controls } = options;

    controls.enabled = true;

    sky.updateSunPosition(2);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    camera.position.set(-21200, 2500, 23000);
    controls.target = sky.getSunPosition();
    controls.update();
  },
};

export default Night;
