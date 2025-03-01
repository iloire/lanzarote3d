import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Pilot from "../components/pilot";
import TandemPilot from "../components/tandem-pilot";
import Helpers from "../utils/helpers";
import { GlassesType, PilotHeadType } from "../components/parts/pilot-head";

const PilotStory = {
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

    const pilots = [
      {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999'
          }
        }
      },
      {
        head: {
          headType: PilotHeadType.Default,
          glassesType: GlassesType.SunGlasses1
        }
      },
      { head: { headType: PilotHeadType.Warrior } }
>>>>>>> d2adb0b (feat: refactor heads and helmets)
    ]

    let x = -1400;
    pilots.forEach(async options => {
      const pilot = new Pilot(options);
      const mesh = await pilot.load();
      mesh.position.set(x, -300, -500);
      scene.add(mesh);
      x += 600;
    })

    const tandem = new TandemPilot({
      pilot: {
        head: { headType: PilotHeadType.Default },
        suitColor: 'green',
        shoesColor: 'black'
      },
      passenger: {
        head: { headType: PilotHeadType.Default },
        suitColor: 'orange',
        shoesColor: 'gray'
      }
    });
    const meshTandem = await tandem.load();
    meshTandem.position.set(-2000, -300, -500);
    scene.add(meshTandem);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    camera.position.set(0, 0, 8000);
    camera.lookAt(scene.position);
    animate();
  },
};

export default PilotStory;
