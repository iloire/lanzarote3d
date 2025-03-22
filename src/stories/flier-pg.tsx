import * as CANNON from "cannon-es";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import PhysicsFlier, { PhysicsEnvOptions, PhysicsFlierConstructor } from "../components/base/physics-flier";
import Paraglider from "../components/paraglider";
import Weather, { WeatherOptions } from "../elements/weather";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

const KMH_TO_MS = 3.6;

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / KMH_TO_MS,
  lclLevel: 1800,
};

const ParagliderWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

    terrain.visible = true;
    water.visible = true;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const initialCamPos = new THREE.Vector3(9800, 870, -475);
    const initialPGPos = new THREE.Vector3(6900, 970, -475);

    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);

    // Create ground body
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: groundShape,
      material: new CANNON.Material('ground')
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, 0, 0);
    world.addBody(groundBody);

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      numeroCajones: 40
    };
    const pilotOptions = {}
    const pgFlyable = new Paraglider({
      glider: gliderOptions,
      pilot: pilotOptions
    });

    const mesh = await pgFlyable.load(gui);
    const scale = 0.1;
    mesh.scale.set(scale, scale, scale);
    mesh.position.copy(initialPGPos);
    scene.add(mesh);

    const pgOptions: PhysicsFlierConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,
      flyable: pgFlyable,
      world
    };

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);
    const envOptions: PhysicsEnvOptions = {
      weather,
      terrain,
      water,
      thermals: [],
      perfStats: null,
      world
    };

    camera.animateTo(initialCamPos, initialPGPos, 200, controls);

    const pg = new PhysicsFlier(pgOptions, envOptions, false);
    pg.addGui(gui);
    pg.init();

    setInterval(() => {
      console.log(pg.getTurnState());
      pg.turnLeft(12220);
    }, 50);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      // const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
      // camera.lookAt(lookAt);
      TWEEN.update();
      controls.update();
    };

    animate();
  },
};

export default ParagliderWorkshop;
