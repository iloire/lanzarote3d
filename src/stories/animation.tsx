import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Paraglider from "../components/paraglider";
import Tandem from "../components/tandem";
import Environment from "./env/environment";
import Weather, { WeatherOptions } from "../elements/weather";
import { PilotHeadType } from "../components/parts/pilot-head";
import { StoryOptions } from "./types";

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
    position: new THREE.Vector3(6897, 920, -705) 
  }
];


const Animation = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water,  controls } = options;
    
    const initialPos = new THREE.Vector3(6714, 949, -525);  
    camera.animateTo(initialPos, paragliders[0].position, 0, controls);

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
    const thermals = env.generateThermals(weather, 0);
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] }
    env.addClouds(weather, thermals, cloudOptions);
    env.addTrees(terrain);
    env.addStones(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    const points: THREE.Vector3[] = paragliders.map(p => p.position);

    let pointIndex = 0;
    const radius = 30;

    camera.animateTo(initialPos, paragliders[0].position, 1000, controls, () => {
       camera.baseY = camera.position.y;
    });

    const animate = () => {
      if (camera.baseY) {
        const floatSpeed = 0.15; // oscillations per second
        const floatAmplitude = 0.5; // units up/down
        const time = performance.now() * 0.001;
        camera.position.y = camera.baseY + Math.sin(time * floatSpeed * Math.PI * 2) * floatAmplitude;
      }
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      controls.update();
    };
    animate();
  },
};

export default Animation;
