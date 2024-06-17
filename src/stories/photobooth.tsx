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

const PhotoBooth = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
  ) => {
    const initialPos = new THREE.Vector3(6827, 880, -555);
    const lookAt = new THREE.Vector3(7827, 880, -1555);
    camera.animateTo(initialPos, lookAt, 0);

    const paraglider = new Paraglider();
    const mesh = await paraglider.load();
    mesh.position.copy(initialPos);
    const scale = 0.1;
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);

    // must render before adding env
    renderer.render(scene, camera);

    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.addThermals(weather, 1);
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
