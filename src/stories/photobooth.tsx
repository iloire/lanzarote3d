import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Paraglider from "../components/paraglider";
import Camera from "../components/camera";
import Environment from "./env/environment";
import Weather, { WeatherOptions } from "../elements/weather";

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};


const paragliders = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        numeroCajones: 30
      },
      pilot: {
        head: { helmetColor: '#ffff00' }
      }
    },
    position: new THREE.Vector3(6827, 860, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        numeroCajones: 50
      },
      pilot: {
        head: { helmetColor: '#ffff00' }
      }
    },
    position: new THREE.Vector3(6727, 780, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        numeroCajones: 20
      },
      pilot: {
        head: { helmetColor: '#ffff00' }
      }
    },
    position: new THREE.Vector3(6777, 920, -535)
  }
]

const PhotoBooth = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
  ) => {
    const initialPos = new THREE.Vector3(6800, 880, -495);
    camera.animateTo(initialPos, paragliders[0].position, 0);

    paragliders.forEach(async p => {
      const paraglider = new Paraglider(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.001; // mm to m
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    });


    // must render before adding env
    renderer.render(scene, camera);

    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.addThermals(weather, 0);
    env.addClouds(weather, thermals);
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
  },
};

export default PhotoBooth;
