import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Paraglider from "../components/paraglider";
import Tandem from "../components/tandem";
import Environment from "../stories-env/environment";
import Weather, { WeatherOptions } from "../elements/weather";
import { StoryOptions } from "./types";
import { paragliders, tandems } from "../stories-data/paragliders";

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};

const Animation = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls } = options;

    const initialPos = new THREE.Vector3(6740, 892, -296);
    camera.animateTo(initialPos, paragliders[0].position, 0, controls);

    // Load all paragliders
    for (const pg of paragliders) {
      const paraglider = new Paraglider(pg.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(pg.position);
      const scale = 0.001; // mm to m
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    }

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

    function followParaglider() {
      const target = paragliders[0].position;
      const startPosition = new THREE.Vector3(
        target.x - 200,  // Start further back
        target.y + 100,  // Start higher
        target.z + 200   // Start offset to the side
      );
      const finalPosition = new THREE.Vector3(
        target.x - 20,   // End closer to paraglider
        target.y + 10,   // Slightly above
        target.z + 20    // Slightly to the side
      );

      camera.position.copy(startPosition);

      new TWEEN.Tween(camera.position)
        .to(finalPosition, 5000) // 5 seconds duration
        .easing(TWEEN.Easing.Quadratic.Out) // Smooth deceleration
        .onUpdate(() => {
          camera.lookAt(target);
        })
        .start();
    }

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    followParaglider();
    animate();
  },
};

export default Animation;
