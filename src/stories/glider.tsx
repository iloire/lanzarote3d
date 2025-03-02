import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Glider from "../components/parts/glider";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

const GliderWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;
    
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      breakColor: '#333333',
      lineFrontColor: '#000000',
      lineBackColor: '#333333',
      inletsColor: '#333333',
      numeroCajones: 30,
    };

    const glider = new Glider(gliderOptions);
    const mesh = await glider.load(gui);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };

    camera.position.set(-11200, 2500, -415);
    animate();
  },
};

export default GliderWorkshop;
