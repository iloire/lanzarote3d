import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Glider from "../components/parts/glider";
import Helpers from "../utils/helpers";

const GliderStory = {
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
    };

    const lookAt = mesh.position.clone();
    camera.position.set(8000, 2000, 800);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default GliderStory;
