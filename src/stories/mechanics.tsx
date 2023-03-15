import * as THREE from "three";
import Controls from "../utils/controls";

import Sky from "../components/sky";
import Trajectory from "../elements/trajectory";
import Paraglider, { ParagliderConstructor } from "../elements/pg";
import Weather, { WeatherOptions } from "../elements/weather";
import Birds from "../elements/birds";
import WindIndicator from "../components/wind-indicator";
import Environment from "./game/env";
import Helpers from "../utils/helpers";
import Stone from "../components/stone";
import Tree from "../components/tree";

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

    const thermals = Environment.addThermals(scene, weather);
    Environment.addClouds(scene, weather, thermals);

    sky.updateSunPosition(12);

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

    // const birds = new Birds();
    // const birdsMesh = await birds.loadModel(33);
    // const birdsPosition = new THREE.Vector3(p.position.x, 1280, p.position.z);
    // birdsMesh.position.copy(birdsPosition);
    // scene.add(birdsMesh);

    // const fogColor = 0x000000;
    // scene.fog = new THREE.FogExp2(fogColor, 0.00001);

    const windIndicator = new WindIndicator(4000);
    const arrow = windIndicator.load(330, pg.position());
    scene.add(arrow);

    // Helpers.drawPoint(scene, sky.getSunPosition());

    // const findCameraIntercept = () => {
    //   const raycaster = new THREE.Raycaster(
    //     pg.position(),
    //     camera.position.clone().sub(pg.position()).normalize()
    //   );
    //   const intersects = raycaster.intersectObject(terrain);
    //   if (intersects.length > 0) {
    //     console.log("camera intersects", intersects);
    //     const distance = intersects[0].distance;
    //     console.log(distance);
    //     const newPosition = new THREE.Vector3().addVectors(
    //       camera.position,
    //       raycaster.ray.direction.multiplyScalar(-1 * distance)
    //     );
    //     camera.position.copy(newPosition);
    //   }
    // };

    const stone = new Stone().load();
    stone.position.set(0, 1000, 0);
    stone.scale.set(100, 100, 100);
    scene.add(stone);

    const tree = new Tree().load();
    tree.position.set(0, 400, 0);
    tree.scale.set(10, 10, 10);
    scene.add(tree);

    const animate = () => {
      // findCameraIntercept();
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
