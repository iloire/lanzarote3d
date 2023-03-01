import * as THREE from "three";
import Controls from "../utils/controls";

import Clouds from "../elements/clouds";
import Trajectory from "../elements/trajectory";
import Paraglider, { ParagliderConstructor } from "../elements/pg";
import Weather from "../elements/weather";

const KMH_TO_MS = 3.6;

const WEATHER_SETTINGS = {
  windDirectionDegreesFromNorth: 310,
  windSpeed: 18 / KMH_TO_MS,
  lclLevel: 1800,
};

const p = {
  scale: 0.4,
  position: new THREE.Vector3(6827, 1880, -555),
};

const Mechanics = {
  load: async (camera, scene, renderer, terrain, water, gui) => {
    const controls = Controls.createControls(camera, renderer);

    const cloudPos = new THREE.Vector3(87, 1300, 3355);
    const c = await Clouds.load(1, cloudPos);
    scene.add(c);

    const cloudPos2 = new THREE.Vector3(837, 1300, -3355);
    const c2 = await Clouds.load(1, cloudPos2);
    scene.add(c2);

    const weather = new Weather(
      WEATHER_SETTINGS.windDirectionDegreesFromNorth,
      WEATHER_SETTINGS.windSpeed,
      WEATHER_SETTINGS.lclLevel
    );
    weather.addGui(gui);

    const pgOptions: ParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 25 / KMH_TO_MS,
      halfSpeedBarSpeed: 30 / KMH_TO_MS,
      fullSpeedBarSpeed: 35 / KMH_TO_MS,
      smallEarsSpeed: 20 / KMH_TO_MS,
      bigEarsSpeed: 18 / KMH_TO_MS,
    };
    const pg = new Paraglider(pgOptions, weather, terrain, water, []);
    const mesh = await pg.loadModel(p.scale);
    mesh.position.copy(p.position);
    pg.addGui(gui);
    scene.add(mesh);
    pg.init();

    const points = [
      new THREE.Vector3(29000, 1000, 3100),
      new THREE.Vector3(3500, 800, 3200),
      new THREE.Vector3(2300, 1200, 3300),
      new THREE.Vector3(3000, 700, 3400),
      new THREE.Vector3(5000, 1300, 3300),
    ];
    const trajectory = new Trajectory(points);
    scene.add(trajectory.getMesh());

    console.log("Number of Triangles :", renderer.info.render.triangles);
    camera.position.set(4200, 2500, -3200);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      camera.lookAt(pg.position());
      controls.target = pg.position();
    };
    animate();
  },
};

export default Mechanics;
