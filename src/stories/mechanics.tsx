import * as THREE from "three";
import * as CANNON from "cannon-es";
import Controls from "../utils/controls";

import Sky from "../components/sky";
import World from "../components/world";
import WindIndicator from "../components/wind-indicator";
import Helpers from "../utils/helpers";
import Paraglider from "../components/paraglider";

const KMH_TO_MS = 3.6;

const p = {
  scale: 10,
  position: new THREE.Vector3(6827, 3080, -555),
};

const Mechanics = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    terrain.visible = false;

    const controls = Controls.createControls(camera, renderer);

    sky.updateSunPosition(20);

    const world = new World(scene, renderer, camera);
    const paraglider = new Paraglider();
    paraglider.addToWorld(world);

    const animate = () => {
      world.step();
      requestAnimationFrame(animate);
    };

    camera.position.set(14200, 9500, 8200);
    camera.lookAt(0, 0, 0);
    animate();
  },
};

export default Mechanics;
