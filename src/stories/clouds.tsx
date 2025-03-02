import * as THREE from "three";
import Clouds from "../components/clouds";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

const CloudsWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky } = options;
    
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);
    sky.updateSunPosition(12);

    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] };
    const mesh = await new Clouds(cloudOptions).load(1, new THREE.Vector3(0, 0, 0));
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
    animate();
  },
};

export default CloudsWorkshop;
