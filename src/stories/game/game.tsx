import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import BackgroundSound from "../../audio/background";
import Flier, { FlierConstructor } from "../../components/base/flier";
import Paraglider from "../../components/paraglider";
import Vario from "../../audio/vario";
import Weather, { WeatherOptions } from "../../elements/weather";
import Camera, { CameraMode } from "../../components/camera";
import UIControls, { FirstPersonViewLook } from "./ui-controls";
import Trajectory from "../../elements/trajectory";
import Analytics from "../../elements/analytics";
import { GameStartOptions, GameStatus } from "./types";
import { addGameEnvironment } from "./env";
import locations from "../locations/lanzarote";
import WindIndicator from "../../components/wind-indicator";
import Sky from "../../components/sky";
import PerfStats from "../../utils/stats";

const KMH_TO_MS = 3.6;

const FOG_ENABLED = true;
const TIME_OF_DAY = 20;
const START_WITH_SOUND = false;
const INITIAL_CAMERA_MODE = CameraMode.FollowTarget;
const DEBUG = false;

const settings = {
  rotationSensitivity: 0.002,
  orbitControl: false,
  wrapSpeed: 1,
};

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / KMH_TO_MS,
  lclLevel: 1800,
};


const addWindIndicatorToScene = (
  scene: THREE.Scene,
  flier: Flier,
  weather: Weather
) => {
  const windIndicator = new WindIndicator(40);
  const arrow = windIndicator.load(
    WEATHER_SETTINGS.windDirectionDegreesFromNorth,
    flier.position().add(flier.direction())
  );
  scene.add(arrow);
  flier.addEventListener("position", (event) => {
    arrow.position.copy(event.position).add(flier.direction().multiplyScalar(300));
  });

  weather.addEventListener("wind-directionChange", (event) => {
    windIndicator.update(event.value);
  });
};

const analytics = new Analytics();

const Game = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    const perfStats = new PerfStats(renderer, "rs-base");

    sky.updateSunPosition(TIME_OF_DAY);

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);

    const bgMusic = new BackgroundSound();

    // must render before adding env
    renderer.render(scene, camera);
    const env = addGameEnvironment(scene, terrain, weather, water, gui);
    const thermals = env.getThermals();

    const envOptions = {
      weather,
      terrain,
      water,
      thermals,
      perfStats,
    };

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      numeroCajones: 40
    };

    const pilotOptions = {}

    const paragliderFlyable = new Paraglider({
      glider: gliderOptions,
      pilot: pilotOptions
    });

    const mesh = await paragliderFlyable.load(gui);
    const scale = 0.01;
    mesh.scale.set(scale, scale, scale);

    const pgOptions: FlierConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,
      flyable: paragliderFlyable
    };

    const pg = new Flier(pgOptions, envOptions, DEBUG);
    const vario = new Vario(pg);
    pg.addGui(gui);

    scene.add(mesh);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      const keyCode = event.which;
      if (keyCode == 90) {
        //z
        if (perfStats.isVisible()) {
          perfStats.hide();
        } else {
          perfStats.show();
        }
      } else if (keyCode == 77) {
        //m
        bgMusic.toggle();
        vario.toggle();
      } else if (keyCode == 83) {
        //s
        pg.toggleSpeedBar();
      } else if (keyCode == 69) {
        //s
        pg.toggleEars();
      }
    }

    const wrapSpeedChange = (value: number) => {
      pg.updateWrapSpeed(value);
      vario.updateWrapSpeed(value);
      env.updateWrapSpeed(value);
    };

    const nav = gui.addFolder("Navigation");
    nav.add(settings, "rotationSensitivity", 0.01, 0.05).listen();
    nav
      .add(settings, "wrapSpeed", 1, 20)
      .listen()
      .onChange((value: number) => {
        wrapSpeedChange(value);
      });

    let gameStatus = GameStatus.NonStarted;


    function setCameraMode(mode) {
      camera.setCameraMode(mode, pg);
    }

    const uiControls = (
      <UIControls
        pg={pg}
        locations={locations}
        vario={vario}
        weather={weather}
        showDebugInfo={true}
        defaultGameSpeed={3}
        defaultCameraMode={INITIAL_CAMERA_MODE}
        onLeftInput={() => {
          pg.leftInput();
        }}
        onLeftInputRelease={() => {
          pg.leftRelease();
        }}
        onRightInput={() => {
          pg.rightInput();
        }}
        onRightInputRelease={() => {
          pg.rightRelease();
        }}
        onBreakUIChange={(direction: number) => {
          pg.directionInput(direction);
        }}
        onViewUIChange={(direction: FirstPersonViewLook) => {
          if (gameStatus === GameStatus.Started) {
            camera.lookDirection(direction.x, direction.y);
          }
        }}
        onGameStart={(options: GameStartOptions, fnHideStartButton) => {
          startGame(options);
          fnHideStartButton();
        }}
        onFinishGame={(fnHideButtons) => {
          if (
            gameStatus === GameStatus.Started ||
            gameStatus === GameStatus.Paused
          ) {
            finishGame();
            fnHideButtons();
          }
        }}
        onPause={(paused) => {
          if (
            gameStatus === GameStatus.Started ||
            gameStatus === GameStatus.Paused
          ) {
            analytics.trackEvent("game-pause");
            if (paused) {
              pg.stop();
              vario.pause();
              bgMusic.pause();
              gameStatus = GameStatus.Paused;
            } else {
              pg.init();
              vario.start();
              bgMusic.play();
              gameStatus = GameStatus.Started;
            }
          }
        }}
        onSelectCamera={(mode: CameraMode) => {
          analytics.trackEvent("game-camera-change", mode.toString());
          setCameraMode(mode);
        }}
        onWrapSpeedChange={(value) => {
          analytics.trackEvent("game-speed-change", value.toString());
          wrapSpeedChange(value);
        }}
      />
    );

    const root = createRoot(document.getElementById("ui-controls"));
    root.render(uiControls);

    function touchedGround() { }

    function finishGame() {
      analytics.trackEvent("game-crash", pg.getTrajectory().length.toString());
      vario.stop();
      bgMusic.stop();
      pg.stop();

      const trajectory = new Trajectory(pg.getTrajectory(), 15);
      scene.add(trajectory.getMesh());
      setCameraMode(CameraMode.OrbitControl);

      const trajectoryPoints = trajectory.getPoints();
      if (trajectoryPoints.length) {
        const first = trajectoryPoints[0];
        camera.animateTo(
          first.vector.add(
            new THREE.Vector3(0, 30, 0).add(weather.getWindVelocity(-250))
          ),
          pg.position()
        );
      }
      gameStatus = GameStatus.Finished;
    }


    function startGame(options: GameStartOptions) {
      analytics.trackEvent("game-start");
      weather.changeWindSpeed(options.windSpeedMetresPerSecond);
      weather.changeWindDirection(options.windDirectionDegreesFromNorth);
      if (START_WITH_SOUND) {
        bgMusic.play();
        vario.start();
      }
      pg.setPosition(options.startingLocation.position);

      pg.rotate(-134, 0);
      pg.init();

      setCameraMode(INITIAL_CAMERA_MODE);

      if (FOG_ENABLED) {
        const fogColor = 0x000000;
        // const fog = new THREE.FogExp2(fogColor, 0.0002);
        const fog = new THREE.Fog(fogColor, 1, 22500);
        scene.fog = fog;
      }
      gameStatus = GameStatus.Started;
    }

    pg.addEventListener("touchedGround", touchedGround);
    pg.addEventListener("crashed", finishGame);

    addWindIndicatorToScene(scene, pg, weather);

    renderer.render(scene, camera);

    const animate = () => {

      if (gameStatus !== GameStatus.Started) {
        const timeMultiplier = 0.000008;
        camera.position.x = 32000 * Math.sin(Date.now() * timeMultiplier);
        camera.position.y = 950;
        camera.position.z = 3000 * Math.cos(Date.now() * timeMultiplier);
        camera.lookAt(new THREE.Vector3(0, 500, 0));
      }

      vario.updateReading(pg.altitude());
      perfStats.frameStart();
      perfStats.wrapFunction("tween", () => {
        TWEEN.update();
      });
      perfStats.wrapFunction("camera", () => {
        camera.update();
      });
      perfStats.wrapFunction("render", () => {
        renderer.render(scene, camera);
      });
      perfStats.frameEnd();
      perfStats.update();

      requestAnimationFrame(animate);
    };

    animate();

    console.log("triangles:", renderer.info.render.triangles);
  },
};

export default Game;
