import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Pilot from "../components/pilot";
import Tandem from "../components/tandem";
import Helpers from "../utils/helpers";

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

    const pilot = new Pilot({ head: {} });
    const mesh = await pilot.load();
    mesh.position.set(-3000, -3000, -5000);
    scene.add(mesh);

    const tandem = new Tandem({ pilot: { head: {}, suitColor: 'blue' }, passenger: { head: {}, suitColor: 'orange' } });
    const meshTandem = await tandem.load();
    meshTandem.position.set(-2000, -3000, -5000);
    scene.add(meshTandem);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(25, 9, 0);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default ParagliderWorkshop;
