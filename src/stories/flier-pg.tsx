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

// Function to create a static box visualization at a specific position
function createStaticBoxVisualization(
  scene: THREE.Scene,
  dimensions: CANNON.Vec3,
  position: THREE.Vector3,
  color: number = 0xffff00
): THREE.Mesh {
  // Create a Three.js box with the same dimensions as the CANNON.Box
  // CANNON.Box dimensions are half-extents, so we double them for Three.js
  const width = dimensions.x * 2;
  const height = dimensions.y * 2;
  const depth = dimensions.z * 2;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });

  const boxMesh = new THREE.Mesh(geometry, material);
  boxMesh.position.copy(position);
  scene.add(boxMesh);

  return boxMesh;
}

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

    // Create a static visualization of CANNON.Box(new CANNON.Vec3(10, 1, 10))
    const boxDimensions = new CANNON.Vec3(10, 1, 10);
    const boxPosition = initialPGPos.clone().add(new THREE.Vector3(50, 0, 0)); // Position offset from PG
    const boxVisualization = createStaticBoxVisualization(
      scene,
      boxDimensions,
      boxPosition,
      0x0000ff // Blue color
    );

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

    // Visualize physics bodies after initialization
    let physicsVisualizers = [];

    // Wait for physics bodies to be created and initialized
    setTimeout(() => {
      // Visualize the glider physics body (wing)
      if (pg.gliderBody) {
        const gliderPhysicsVis = Helpers.createCannonShapeVisualization(
          scene,
          pg.gliderBody,
          0xff00ff // Magenta for glider physics
        );
        physicsVisualizers.push(gliderPhysicsVis);
      }

      // Visualize the pilot physics body
      if (pg.pilotBody) {
        const pilotPhysicsVis = Helpers.createCannonShapeVisualization(
          scene,
          pg.pilotBody,
          0x00ffff // Cyan for pilot physics
        );
        physicsVisualizers.push(pilotPhysicsVis);
      }
    }, 1000); // Short delay to ensure physics bodies are initialized

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

      // Update physics visualizers
      physicsVisualizers.forEach(vis => vis.update && vis.update());

      TWEEN.update();
      controls.update();
    };

    animate();
  },
};

export default ParagliderWorkshop;
