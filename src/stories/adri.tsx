import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Helpers from "../utils/helpers";
import Models from "../utils/models";
import model from '../models/adri.obj';


const AdriStory = {
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

    const mesh = await Models.loadObj(model);
    const scale = 100;
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = new THREE.Vector3(0, 0, 0);
    camera.position.set(8000, 0, 0);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default AdriStory;
