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

    const initialCamPos = new THREE.Vector3(7100, 470, -475);
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
    const pgFlyable = new Paraglider({
      glider: gliderOptions,
      pilot: pilotOptions
    });

    const combinedMesh = await pgFlyable.load(gui);
    combinedMesh.position.copy(initialPGPos);

    // Create separate meshes for wing and pilot
    const wingMesh = pgFlyable.glider.fullWing;
    const scale = 0.1;
    // wingMesh.translateY(-300);
    // wingMesh.translateX(300);
    wingMesh.scale.set(scale, scale, scale);

    const pilotMesh = pgFlyable.pilotMesh;
    pilotMesh.scale.set(scale, scale, scale);

    scene.add(wingMesh);
    scene.add(pilotMesh);

    const pgOptions: PhysicsFlierConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,
      flyable: pgFlyable,
      world,
      pilotMesh,
      wingMesh,
      pilotWeight: 80, // 80 kg pilot weight
      wingWeight: 6, // 7 kg wing weight
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
      pg.turnLeft(100);
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
