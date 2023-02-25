import * as THREE from "three";
import Controls from "../utils/controls";

import Clouds from "../elements/clouds";

const Mechanics = {
  load: async (camera, scene, renderer, terrain, water, gui) => {
    const controls = Controls.createControls(camera, renderer);

    const cloudPos = new THREE.Vector3(87, 1300, 3355);
    const c = await Clouds.load(1, cloudPos);
    scene.add(c);

    const cloudPos2 = new THREE.Vector3(837, 1300, -3355);
    const c2 = await Clouds.load(1, cloudPos2);
    scene.add(c2);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
    camera.position.set(4200, 2500, -3200);
    camera.lookAt(cloudPos);
  },
};

export default Mechanics;
