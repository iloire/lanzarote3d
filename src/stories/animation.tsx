import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Paraglider from "../components/paraglider";
import Tandem from "../components/tandem";
import Camera from "../components/camera";
import Environment from "./env/environment";
import Weather, { WeatherOptions } from "../elements/weather";
import { PilotHeadType } from "../components/parts/pilot-head";

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};


const defaultGlider = {
  wingColor1: 'orange',
  wingColor2: 'green',
  breakColor: '#ffffff',
  lineFrontColor: '#ffffff',
  lineBackColor: '#ffffff',
  inletsColor: '#333333',
  numeroCajones: 35
}

const defaultHead = {
  helmetColor: '#ffff00',
  headType: PilotHeadType.Default
}

const defaultPilot = {
  head: {
    ...defaultHead
  }
}


const tandems = [
  {
    pg: {
      glider: {
        ...defaultGlider
      },
      pilot: {
        pilot: {
          ...defaultPilot
        },
        passenger: {
          head: { ...defaultHead },
          suitColor: 'red', suitColor2: 'green'
        }
      },
    },
    position: new THREE.Vector3(6837, 850, -535)
  }
];

const paragliders = [
  {
    pg: {
      glider: {
        wingColor1: 'red',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 35
      },
      pilot: {
        ...defaultPilot
      }
    },
    position: new THREE.Vector3(6827, 860, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: 'yellow',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 50
      },
      pilot: {
        ...defaultPilot
      }
    },
    position: new THREE.Vector3(6727, 780, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: 'black',
        wingColor2: 'white',
        inletsColor: '#333333',
        numeroCajones: 40
      },
      pilot: {
        ...defaultPilot
      }
    },
    position: new THREE.Vector3(6777, 920, -535)
  },
  {
    // fabio
    pg: {
      glider: {
        wingColor1: 'purple',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 40
      },
      pilot: {
        ...defaultPilot
      }
    },
    position: new THREE.Vector3(6777, 920, -535)
  }
];

function getOffsetPosition(camera: Camera, target: THREE.Vector3, offsetDistance: number): THREE.Vector3 {
  const direction = target.clone().sub(camera.position).normalize();
  return target.clone().sub(direction.multiplyScalar(offsetDistance));
}

function flyThroughTargets(camera: Camera, targets: THREE.Vector3[], offsetDistance: number, duration: number) {
  let tweenChain = new TWEEN.Tween(camera.position)
    .to(getOffsetPosition(camera, targets[0], offsetDistance), duration)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.lookAt(targets[0]);
    });

  // for (let i = 1; i < targets.length; i++) {
  //   console.log('go')
  //   tweenChain = tweenChain.chain(
  //     new TWEEN.Tween(camera.position)
  //       .to(getOffsetPosition(camera, targets[i], offsetDistance), duration)
  //       .easing(TWEEN.Easing.Quadratic.InOut)
  //       .onUpdate(() => {
  //         camera.lookAt(targets[i]);
  //       })
  //   );
  // }
  //
  tweenChain.start();
}


const Animation = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
  ) => {
    const initialPos = new THREE.Vector3(6740, 892, -296);
    camera.animateTo(initialPos, paragliders[0].position, 0);

    paragliders.forEach(async p => {
      const paraglider = new Paraglider(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.001; // mm to m
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    });


    tandems.forEach(async p => {
      const tandem = new Tandem(p.pg);
      const mesh = await tandem.load();
      mesh.position.copy(p.position);
      const scale = 0.001; // mm to m
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    });

    // must render before adding env
    renderer.render(scene, camera);

    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.generateThermals(weather, 0);
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] }
    env.addClouds(weather, thermals, cloudOptions);
    env.addTrees(terrain);
    env.addStones(terrain);
    env.addHouses(terrain);
    env.addBoats(water);


    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
    flyThroughTargets(camera, paragliders.map(p => p.position), 10, 2000);
  },
};

export default Animation;
