import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Pilot from "../components/pilot";
import TandemPilot from "../components/tandem-pilot";
import Helpers from "../utils/helpers";
import { PilotHeadType } from "../components/parts/pilot-head";

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

    const pilot = new Pilot({});
    const mesh = await pilot.load();
    mesh.position.set(-3000, -3000, -5000);
    scene.add(mesh);

    const pilotWarrior = new Pilot({ head: { headType: PilotHeadType.Warrior } });
    const meshWarrior = await pilotWarrior.load();
    meshWarrior.position.set(-4300, -3300, -5000);
    scene.add(meshWarrior);
    pilotWarrior.breakLeft();

    const tandem = new TandemPilot({
      pilot: {
        head: {}, suitColor: 'green', shoesColor: 'black'
      },
      passenger: {
        head: {}, suitColor: 'orange', shoesColor: 'gray'
      }
    });
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
