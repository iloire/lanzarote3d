import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Clouds from "../components/clouds";
import Helpers from "../utils/helpers";

const CloudsWorkshop = {
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
    sky.updateSunPosition(12);

    const controls = Controls.createControls(camera, renderer);

    const mesh = await new Clouds().load(1, new THREE.Vector3(0, 0, 0));
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(150, 30, 130);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default CloudsWorkshop;
