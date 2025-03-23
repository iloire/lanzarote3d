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

    gui.show();

    terrain.visible = true;
    water.visible = true;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const initialCamPos = new THREE.Vector3(7000, 870, -475);
    const initialPGPos = new THREE.Vector3(6900, 870, -475);

    // Create physics world
    const world = new CANNON.World();

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      numeroCajones: 40
    };
    const pilotOptions = {}
    const glider = new Glider(gliderOptions);
    const wingMesh = await glider.load(gui);


    const pilot = new Pilot(pilotOptions);
    const pilotMesh = await pilot.load();

    const scale = 0.001; // mm to m
    wingMesh.scale.set(scale, scale, scale);
    pilotMesh.scale.set(scale, scale, scale);
    pilotMesh.rotateY(Math.PI / 2);

    scene.add(wingMesh);
    scene.add(pilotMesh);


    // Add visualization boxes around meshes
    const wingBox = Helpers.createMeshVisualization(scene, wingMesh, 0xff0000); // Red box for wing
    const pilotBox = Helpers.createMeshVisualization(scene, pilotMesh, 0x00ff00); // Green box for pilot

    const distanceWingPilot = 10;

    const pgOptions: PhysicsParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,

      glider: {
        mesh: wingMesh,
        weight: 6,
        initialPosition: initialPGPos,
      },
      pilot: {
        mesh: pilotMesh,
        weight: 80,
        initialPosition: initialPGPos.clone().add(new THREE.Vector3(0, 0, 0)),
      },
      world,
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
      // camera.position.copy(pg.position().clone().add(new THREE.Vector3(313, 20, 40)));
      camera.lookAt(pg.position());

      // Update the BoxHelper objects to match the current state of the meshes
      wingBox.update();
      pilotBox.update();

      TWEEN.update();
      controls.update();
    };

    animate();
  },
};

export default ParagliderWorkshop;
