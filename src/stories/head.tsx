import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import PilotHead, { GlassesType, PilotHeadType } from "../components/parts/pilot-head";
import Helpers from "../utils/helpers";

const HeadStory = {
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

    const heads = [
      {
        headType: PilotHeadType.Default
      },
      {
        headType: PilotHeadType.Default,
        glassesType: GlassesType.SunGlasses1
      },
      {
        headType: PilotHeadType.Warrior
      },
      {
        headType: PilotHeadType.Skeleton
      }
    ];

    let x = 0;
    heads.forEach(async headOptions => {
      const head = new PilotHead(headOptions);
      const mesh = await head.load();
      mesh.position.set(x, -30, -50);
      scene.add(mesh);
      x += 1000;
    })

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    camera.position.set(0, 30, 8000);
    camera.lookAt(scene.position);
    animate();
  },
};

export default HeadStory;
