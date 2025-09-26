import * as THREE from 'three';
import HangGlider from '../../../../foundation/components/vehicles/Hangglider';
import Helpers from '../../../../foundation/utils/helpers';
import { StoryOptions } from '../../../shared/types';

const HangGliderWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui } = options;

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const hg = new HangGlider();
    const mesh = await hg.load([], gui);

    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(225, -70, 90);
    camera.lookAt(lookAt);
    animate();
  },
};

export default HangGliderWorkshop;
