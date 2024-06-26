import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import ParagliderVoxel from "../components/paraglider-voxel";
import Helpers from "../utils/helpers";
import adriModel from '../models/adri.obj';
import adriTextureImage from '../models/adri.png';

const ParagliderWorkshop = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    const controls = Controls.createControls(camera, renderer);
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

    const options = {
      glider: gliderOptions,
      pilot: pilotOptions
    }

    const paraglider = new ParagliderVoxel(options);
    const mesh = await paraglider.load(gui);
    scene.add(mesh);


    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(8000, 250, 300);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default ParagliderWorkshop;
