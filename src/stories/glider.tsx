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
      numeroCajones: 10,

    };

    const glider = new Glider(gliderOptions);
    const wing = glider.createWing();
    scene.add(wing);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = wing.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(350, 9, 0);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default GliderStory;
