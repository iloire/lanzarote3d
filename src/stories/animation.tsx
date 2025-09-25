import * as THREE from "three";
import { Tween } from "@tweenjs/tween.js";
const TWEEN = { Tween };
import Paraglider, { ParagliderOptions } from "../components/paraglider";
import ParagliderVoxel, { ParagliderVoxelOptions } from "../components/paraglider-voxel";
import { PilotHeadType } from "../components/parts/pilot-head";
import Environment from "./env/environment";
import Weather, { WeatherOptions } from "../elements/weather";
import adriModel from '../models/adri.obj';
import adriTextureImage from '../models/adri.png';
import { StoryOptions } from "./types";

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions,
  position: any
}

const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage
      },
    },
    position: new THREE.Vector3(6897, 920, -705)
  }];


type ParagliderConfig = {
  pg: ParagliderOptions,
  position: any
}

const Animation3 = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls } = options;
    
    // Add voxel paragliders
    paraglidersVoxel.forEach(async (p) => {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
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
    env.addHouses(terrain);
    env.addBoats(water);

    const pgPos = paraglidersVoxel[0].position.clone();

    const initialCameraPosition = new THREE.Vector3(6760, 949, -461);
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 200, 
      pgPos.y + 90, pgPos.z + 450);

    camera.position.copy(initialCameraPosition);
    camera.lookAt(pgPos);

    camera.animateTo(finalCameraPosition, 
      pgPos, 2000, controls, () => {
        camera.baseY = camera.position.y;
    });

    const animate = () => {
      if (camera.baseY) {
        // Floating camera effect
        const floatSpeed = 0.20; // oscillations per second
        const floatAmplitude = 1.2; // units up/down
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

export default Animation3;
