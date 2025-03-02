import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Helpers from "../utils/helpers";
import adriModel from '../models/adri.obj';
import texturePng from '../models/adri.png';
import PilotVoxel from "../components/pilot-voxel";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
const VoxelStory = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui,
    controls: OrbitControls
  ) => {
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const adri = new PilotVoxel({
      objFile: adriModel,
      textureFile: texturePng
    })
    const mesh = await adri.load();

    const scale = 100;
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = new THREE.Vector3(0, 300, 0);
    camera.position.set(500, 1400, 1000);
    camera.lookAt(lookAt);
    controls.update();
    animate();
  },
};

export default VoxelStory;
