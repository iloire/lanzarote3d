import * as CANNON from "cannon-es";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import PhysicsFlier, { PhysicsEnvOptions, PhysicsParagliderConstructor } from "../components/base/physics-paraglider";
import Glider from "../components/parts/glider";
import Pilot from "../components/pilot";
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

    const initialCamPos = new THREE.Vector3(7000, 400, -475);
    const initialPGPos = new THREE.Vector3(6900, 370, -475);

    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      numeroCajones: 40
    };
    const pilotOptions = {}
    const glider = new Glider(gliderOptions);
    const wingMesh = await glider.load();


    const pilot = new Pilot(pilotOptions);
    const pilotMesh = await pilot.load();

    const scale = 0.01;
    wingMesh.scale.set(scale, scale, scale);
    pilotMesh.scale.set(scale, scale, scale);
    pilotMesh.rotateY(Math.PI / 2);

    scene.add(wingMesh);
    scene.add(pilotMesh);

    const distanceWingPilot = 6;

    const pgOptions: PhysicsParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,

      glider: {
        mesh: wingMesh,
        weight: 6,
        position: initialPGPos,
        rotation: new THREE.Quaternion()
      },
      pilot: {
        mesh: pilotMesh,
        weight: 80,
        position: initialPGPos.clone().add(new THREE.Vector3(0, -5 * distanceWingPilot, 40)),
        rotation: new THREE.Quaternion()
      },
      world,
      pilotMesh,
      wingMesh,
      pilotWeight: 80, // 80 kg pilot weight
      wingWeight: 6, // 7 kg wing weight
      distanceWingPilot: distanceWingPilot, // 10 meters distance between wing and pilot
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
      // console.log(pg.getTurnState());
      // pg.turnLeft(200);
    }, 100);

    const fps = 10;
    const animate = () => {
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 1000 / fps);
      // requestAnimationFrame(animate);
      renderer.render(scene, camera);
      // camera.position.copy(pg.position().clone().add(new THREE.Vector3(3130, 2420, 410)));
      // camera.lookAt(pg.position());
      TWEEN.update();
      controls.update();
    };

    animate();
  },
};

export default ParagliderWorkshop;
