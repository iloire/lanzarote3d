import * as THREE from "three";
import BackgroundSound from "../audio/background";
import Paraglider, { ParagliderConstructor } from "../elements/pg";
import Controls from "../utils/controls";
import Helpers from "../utils/helpers";
import WindIndicator from "../elements/wind-indicator";
import Vario from "../audio/vario";
import Weather from "../elements/weather";

const KMH_TO_MS = 3.6;

const settings = {
  // sensitivity: 0.01,
  rotationSensitivity: 0.01,
  mouseControl: false,
  orbitControl: true,
  wrapSpeed: 1,
};

const WEATHER_SETTINGS = {
  windDirectionDegreesFromNorth: 310,
  windSpeed: 18 / KMH_TO_MS,
};

const pgOptions: ParagliderConstructor = {
  glidingRatio: 2,
  trimSpeed: 25 / KMH_TO_MS,
  halfSpeedBarSpeed: 30 / KMH_TO_MS,
  fullSpeedBarSpeed: 35 / KMH_TO_MS,
  smallEarsSpeed: 20 / KMH_TO_MS,
  bigEarsSpeed: 18 / KMH_TO_MS,
};

const p = {
  scale: 0.004,
  position: new THREE.Vector3(6827, 880, -555),
};

const getObjectPosition = (obj) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

const Game = {
  load: async (camera: THREE.PerspectiveCamera, scene, renderer, terrain, water, gui) => {
    console.log("============ LOAD GAME ====================== ");
    const nav = gui.addFolder("Navigation");
    nav.add(settings, "mouseControl").listen();
    nav.add(settings, "rotationSensitivity", 0, 1).listen();
    // nav.add(settings, "sensitivity", 0, 1).listen();
    nav.add(settings, "wrapSpeed", 1, 10).listen();

    // const weatherGui = gui.addFolder("Weather");
    // weatherGui.add(weather, "windDirectionDegreesFromNorth", 0, 360).listen();
    // weatherGui.add(weather, "windSpeed", 0, 60).listen();

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const weather = new Weather(WEATHER_SETTINGS.windDirectionDegreesFromNorth, WEATHER_SETTINGS.windSpeed)

    const speedBarUI = document.getElementById("paraglider-speedBar");
    const pg = new Paraglider(pgOptions, weather, terrain);
    await pg.loadModel(p.scale, p.position);
    pg.addEventListener("position", function (event) {
      speedBarUI.innerText = "speedbar: " + pg.isOnSpeedBar().toString();
    });
    pg.addGui(gui);
    scene.add(pg.model);

    // const windIndicator = new WindIndicator();
    // windIndicator.load(weather.windDirectionDegreesFromNorth, 14, {
    //   x: 0,
    //   y: 0,
    //   z: 0,
    // });
    // scene.add(windIndicator.arrow);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 32) {
        //space
        pg.jump(terrain);
      } else if (keyCode == 83) {
        //s
        pg.toggleSpeedBar();
      } else if (keyCode == 65) {
        //a
        pg.rotateLeft(settings.rotationSensitivity);
      } else if (keyCode == 68) {
        //d
        pg.rotateRight(settings.rotationSensitivity);
      }
    }
    // renderer.domElement.addEventListener("mousemove", (event) => {
    //   if (settings.mouseControl) {
    //     camera.quaternion.y -= (event.movementX * settings.sensitivity) / 20;
    //     camera.quaternion.x -= (event.movementY * settings.sensitivity) / 20;
    //   }
    // });

    const altitudeUI = document.getElementById("vario-altitude");
    const deltaUI = document.getElementById("vario-delta");
    const vario = new Vario(pg);
    vario.addEventListener("delta", function (event) {
      deltaUI.innerText = Math.round(event.delta * 100) / 100 + " vertical";
    });
    vario.addEventListener("altitude", function (event) {
      altitudeUI.innerText = Math.round(event.altitude) + " m.";
    });
    vario.start();

    // Game start
    const gameStart = document.getElementById("game-start-button");
    gameStart.addEventListener('click', (event : MouseEvent) => {
      gameStart.style.display = 'none'
      const cameraOffset = new THREE.Vector3(-4.2, 10, 11.2);
      camera.position.copy(getObjectPosition(pg.model)).add(cameraOffset);
      camera.lookAt(pg.position());
      animate();
      console.log("Number of Triangles :", renderer.info.render.triangles);
      BackgroundSound.load(camera);
    })

    const animate = () => {
      // setTimeout(animate, 2200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      // camera.position.y += Math.sin(timer) * 0.0003;
      controls.target = pg.position();
      controls.update();
      vario.updateReading(pg.altitude());
      // windIndicator.update(weather.windDirectionDegreesFromNorth);
      renderer.render(scene, camera);
    };

  },
};

export default Game;
