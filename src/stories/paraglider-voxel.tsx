import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import ParagliderVoxel from "../components/paraglider-voxel";
import Helpers from "../utils/helpers";
import adriModel from '../models/adri.obj';
import adriTextureImage from '../models/adri.png';
import { StoryOptions } from "./types";

const ParagliderVoxelWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui  } = options;
    
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
      objFile: adriModel,
      textureFile: adriTextureImage
    }

    const paragliderOptions = {
      glider: gliderOptions,
      pilot: pilotOptions
    }

    const paraglider = new ParagliderVoxel(paragliderOptions);
    const mesh = await paraglider.load(gui);
    scene.add(mesh);


    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(3000, 1250, 1300);
    camera.lookAt(lookAt);
    animate();
  },
};

export default ParagliderVoxelWorkshop;
