import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import BackgroundSound from "../audio/background";
import Paraglider, { ParagliderConstructor } from "../components/pg";
import Animations from "../utils/animations";
import Helpers from "../utils/helpers";
import Vario from "../audio/vario";
import Weather, { WeatherOptions } from "../elements/weather";
import Camera, { CameraMode } from "../components/camera";
import UIControls, { View, FirstPersonViewLook } from "../elements/ui-controls";
import Trajectory from "../elements/trajectory";
import Analytics from "../elements/analytics";
import { GameStartOptions, GameStatus } from "../stories/game/types";
import Environment from "./game/env";
import locations from "./locations/lanzarote";
import WindIndicator from "../components/wind-indicator";
import Sky from "../components/sky";
import rStats from "rStats";
import glStats from "glStats";
import threeStats from "threeStats";

const KMH_TO_MS = 3.6;

const FOG_ENABLED = true;
const TIME_OF_DAY = 20;
const START_WITH_SOUND = false;
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

const pgOptions: ParagliderConstructor = {
  glidingRatio: 9,
  trimSpeed: 35 / KMH_TO_MS,
  fullSpeedBarSpeed: 45 / KMH_TO_MS,
  bigEarsSpeed: 27 / KMH_TO_MS,
};

const addWindIndicatorToScene = (
  scene: THREE.Scene,
  pg: Paraglider,
  weather: Weather
) => {
  const windIndicator = new WindIndicator(40);
  const arrow = windIndicator.load(
    WEATHER_SETTINGS.windDirectionDegreesFromNorth,
    pg.position().add(pg.direction())
  );
  scene.add(arrow);
  pg.addEventListener("position", (event) => {
    arrow.position.copy(event.position).add(pg.direction().multiplyScalar(300));
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
    const tS = new threeStats(renderer);
    const glS = new glStats();
    const rS = new rStats({
      CSSPath: "https://spite.github.io/rstats/",
      userTimingAPI: true,
      values: {
        frame: { caption: "Total frame time (ms)", over: 16 },
        fps: { caption: "Framerate (FPS)", below: 30 },
        calls: { caption: "Calls (three.js)", over: 3000 },
        raf: { caption: "Time since last rAF (ms)" },
        rstats: { caption: "rStats update (ms)" },
      },
      groups: [
        { caption: "Framerate", values: ["fps", "raf"] },
        {
          caption: "Frame Budget",
          values: ["frame", "texture", "setup", "render"],
        },
      ],
      fractions: [{ base: "frame", steps: ["move", "render"] }],
      plugins: [tS, glS],
    });
    const rsBase: any = document.getElementsByClassName("rs-base");
    rsBase[0].style.display = "none";

    sky.updateSunPosition(TIME_OF_DAY);

    const env = new Environment();

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);

    const bgMusic = new BackgroundSound();

    const thermals = env.addThermals(scene, weather);

    const envOptions = {
      weather,
      terrain,
      water,
      thermals,
      rs: rS,
    };

    const pg = new Paraglider(pgOptions, envOptions, DEBUG);
    const vario = new Vario(pg);
    const pgMesh = await pg.loadModel(0.05, gui);
    const box = new THREE.BoxHelper(pgMesh, 0xffff00);
    if (DEBUG) {
      scene.add(box);
    }
    pg.addGui(gui);
    scene.add(pgMesh);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      const keyCode = event.which;
      if (keyCode == 90) {
        //z
        const rsBase: any = document.getElementsByClassName("rs-base");
        if (gui._hidden) {
          if (rsBase.length) {
            rsBase[0].style.display = "";
          }
          gui.show();
        } else {
          if (rsBase.length) {
            rsBase[0].style.display = "none";
          }
          gui.hide();
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
      .onChange((value) => {
        wrapSpeedChange(value);
      });

    let isLeftViewing = false;
    let isRightViewing = false;
    let isZoomInViewing = false;
    let isZoomOutViewing = false;

    let gameStatus = GameStatus.NonStarted;

    const rootElement = document.getElementById("ui-controls");
    const root = createRoot(rootElement);

    const uiControls = (
      <UIControls
        pg={pg}
        locations={locations}
        vario={vario}
        weather={weather}
        showDebugInfo={true}
        defaultGameSpeed={3}
        defaultCameraMode={CameraMode.FirstPersonView}
        onLeftBreak={() => {
          pg.leftBreakInput();
        }}
        onLeftBreakRelease={() => {
          pg.leftBreakRelease();
        }}
        onRightBreak={() => {
          pg.rightBreakInput();
        }}
        onRightBreakRelease={() => {
          pg.rightBreakRelease();
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
          camera.setCameraMode(mode, pg);
        }}
        onViewChange={(view: View) => {
          analytics.trackEvent("game-view-change", view);
          if (view === View.Left) {
            isLeftViewing = true;
          } else if (view === View.LeftRelease) {
            isLeftViewing = false;
          } else if (view === View.Right) {
            isRightViewing = true;
          } else if (view === View.RightRelease) {
            isRightViewing = false;
          } else if (view === View.ZoomIn) {
            isZoomInViewing = true;
          } else if (view === View.ZoomInRelease) {
            isZoomInViewing = false;
          } else if (view === View.ZoomOut) {
            isZoomOutViewing = true;
          } else if (view === View.ZoomOutRelease) {
            isZoomOutViewing = false;
          }
        }}
        onWrapSpeedChange={(value) => {
          analytics.trackEvent("game-speed-change", value.toString());
          wrapSpeedChange(value);
        }}
      />
    );
    root.render(uiControls);

    function touchedGround() {}

    function finishGame() {
      analytics.trackEvent("game-crash", pg.getTrajectory().length.toString());
      vario.stop();
      bgMusic.stop();
      pg.stop();

      const trajectory = new Trajectory(pg.getTrajectory(), 15);
      scene.add(trajectory.getMesh());
      camera.setCameraMode(CameraMode.OrbitControl, pg);

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
      pg.init();
      camera.setCameraMode(CameraMode.FirstPersonView, pg);
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

    renderer.render(scene, camera); // must render before adding trees

    // Game start
    pg.setPosition(locations[0].position);
    pg.model.rotation.y = 1.2; // TODO: should implemente a setDirection on pg
    camera.setCameraMode(CameraMode.FirstPersonView, pg);
    camera.lookAt(locations[0].lookAt);

    env.addClouds(scene, weather, thermals);
    env.addTrees(scene, terrain);
    env.addStones(scene, terrain);
    env.addHouses(scene, terrain);
    env.addBoats(scene, water);
    const birdsPath = [
      { x: 7500, y: 1090, z: -1068 },
      { x: 6500, y: 1190, z: -1368 },
      { x: 4500, y: 1390, z: -1768 },
    ];
    env.addBirds(
      scene,
      birdsPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      gui
    );
    const hgPath = [
      { x: 10000, y: 1090, z: -6068 },
      { x: 6500, y: 1190, z: -1368 },
      { x: 8200, y: 1190, z: -1668 },
      { x: 8900, y: 1390, z: -2768 },
      { x: 9500, y: 1790, z: -4268 },
      { x: 11000, y: 2790, z: -7468 },
    ];
    env.addHangGlider(
      scene,
      hgPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      gui
    );
    // await env.addOtherGliders(scene, weather, terrain, water);

    const animate = () => {
      box.update();
      vario.updateReading(pg.altitude());
      if (isLeftViewing) {
        camera.turnLeft();
      }
      if (isRightViewing) {
        camera.turnRight();
      }
      if (isZoomInViewing) {
        camera.zoomIn();
      }
      if (isZoomOutViewing) {
        camera.zoomOut();
      }

      glS.start();

      rS("frame").start();
      rS("rAF").tick();
      rS("FPS").frame();

      rS("tween").start();
      TWEEN.update();
      rS("tween").end();

      rS("camera").start();
      camera.update();
      rS("camera").end();

      rS("render").start();
      renderer.render(scene, camera);
      rS("render").end();

      rS("frame").end();
      rS().update();

      requestAnimationFrame(animate);
    };
    animate();

    console.log("triangles:", renderer.info.render.triangles);
  },
};

export default Game;
