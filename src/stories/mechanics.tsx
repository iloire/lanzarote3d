import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Paraglider, { ParagliderConstructor } from "../components/pg";
import Weather, { WeatherOptions } from "../elements/weather";
import WindIndicator from "../components/wind-indicator";
import Environment from "./env/environment";

const KMH_TO_MS = 3.6;

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / KMH_TO_MS,
  lclLevel: 1800,
};

const p = {
  scale: 10,
  position: new THREE.Vector3(6827, 3080, -555),
};

const Mechanics = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    const controls = Controls.createControls(camera, renderer);

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);

    const env = new Environment(scene);
    const thermals = env.addThermals(weather);
    env.addClouds(weather, thermals);

    sky.updateSunPosition(20);

    const pgOptions: ParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 25 / KMH_TO_MS,
      fullSpeedBarSpeed: 35 / KMH_TO_MS,
      bigEarsSpeed: 18 / KMH_TO_MS,
    };
    const envOptions = {
      weather,
      terrain,
      water,
      thermals,
    };
    const pg = new Paraglider(pgOptions, envOptions);
    const mesh = await pg.loadModel(p.scale);
    mesh.position.copy(p.position);
    pg.addGui(gui);
    pg.init();
    scene.add(mesh);

    // const fogColor = 0x000000;
    // scene.fog = new THREE.FogExp2(fogColor, 0.00001);

    const windIndicator = new WindIndicator(4000);
    const arrow = windIndicator.load(330, pg.position());
    scene.add(arrow);

    renderer.render(scene, camera); // render before adding trees
    env.addTrees(terrain);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      // camera.lookAt(sky.getSunPosition());
      // camera.lookAt(pg.position());
      // controls.target = pg.position();
    };

    camera.position.set(4200, 12500, -23200);
    camera.lookAt(mesh.position);
    animate();
  },
};

export default Mechanics;
