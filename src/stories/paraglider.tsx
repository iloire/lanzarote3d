import * as THREE from "three";
import Paraglider from "../components/paraglider";
import Helpers from "../utils/helpers";
import { PilotHeadType } from "../components/parts/pilot-head";
import { StoryOptions } from "./types";

const ParagliderWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui } = options;
    
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      breakColor: '#ffffff',
      lineFrontColor: '#ffffff',
      lineBackColor: '#ffffff',
      inletsColor: '#333333',
      numeroCajones: 40,
      bandLength: 500,
      carabinersSeparationMM: 300
    };
    const pilotOptions = {
      head: {
        headType: PilotHeadType.Default,
        helmetOptions: {
          color: '#ffffff',
          color2: '#cccccc',
          color3: '#999999'
        }
      },
      carabinerColor: '#333',
    };

    const paragliderOptions = {
      glider: gliderOptions,
      pilot: pilotOptions
    }

    const paraglider = new Paraglider(paragliderOptions);
    const mesh = await paraglider.load(gui);
    scene.add(mesh);


    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(8000, 250, 300);
    camera.lookAt(lookAt);
    animate();
  },
};

export default ParagliderWorkshop;
