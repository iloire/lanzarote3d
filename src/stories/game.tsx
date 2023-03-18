import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import BackgroundSound from "../audio/background";
import Paraglider, { ParagliderConstructor } from "../elements/pg";
import Animations from "../utils/animations";
import Helpers from "../utils/helpers";
import Vario from "../audio/vario";
import Weather, { WeatherOptions } from "../elements/weather";
import Camera, { CameraMode } from "../elements/camera";
import UIControls, { View, FirstPersonViewLook } from "../elements/ui-controls";
import Thermal from "../elements/thermal";
import Clouds from "../elements/clouds";
import Trajectory from "../elements/trajectory";
import Analytics from "../elements/analytics";
import { GameStartOptions } from "../stories/game/types";
import Environment from "./game/env";
import locations from "./locations/lanzarote";
import WindIndicator from "../components/wind-indicator";
import Sky from "../components/sky";

const KMH_TO_MS = 3.6;

const FOG_ENABLED = false;
const TIME_OF_DAY = 20;
const SOUND_ENABLED = false;
const DEBUG = false;

function round(number: number): number {
  return Math.round(number * 100) / 100;
}

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
  halfSpeedBarSpeed: 40 / KMH_TO_MS,
  fullSpeedBarSpeed: 45 / KMH_TO_MS,
  smallEarsSpeed: 30 / KMH_TO_MS,
  bigEarsSpeed: 27 / KMH_TO_MS,
};

const addWindIndicatorToScene = (
  scene: THREE.Scene,
  pg: Paraglider,
  weather: Weather
) => {
  const windIndicator = new WindIndicator(140);
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
    gui.hide();
    sky.updateSunPosition(TIME_OF_DAY);

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);

    const bgMusic = new BackgroundSound(SOUND_ENABLED);

    const thermals = Environment.addThermals(scene, weather);

    Environment.addClouds(scene, weather, thermals);

    const pg = new Paraglider(
      pgOptions,
      weather,
      terrain,
      water,
      thermals,
      DEBUG
    );
    const vario = new Vario(pg, SOUND_ENABLED);
    const pgMesh = await pg.loadModel(0.5);
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
        //c
        if (gui._hidden) {
          gui.show();
        } else {
          gui.hide();
        }
      } else if (keyCode == 77) {
        //m
        bgMusic.toggle();
        vario.toggle();
      } else if (keyCode == 83) {
        //s
        pg.toggleSpeedBar();
      }
    }

    const nav = gui.addFolder("Navigation");
    nav.add(settings, "rotationSensitivity", 0.01, 0.05).listen();
    nav
      .add(settings, "wrapSpeed", 1, 20)
      .listen()
      .onChange((value) => {
        pg.updateWrapSpeed(value);
        vario.updateWrapSpeed(value);
      });

    let isLeftViewing = false;
    let isRightViewing = false;
    let isZoomInViewing = false;
    let isZoomOutViewing = false;

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
          camera.lookDirection(direction.x, direction.y);
        }}
        onGameStart={(options: GameStartOptions, fnHideStartButton) => {
          analytics.trackEvent("game-start");
          weather.changeWindSpeed(options.windSpeedMetresPerSecond);
          weather.changeWindDirection(options.windDirectionDegreesFromNorth);
          fnHideStartButton();
          bgMusic.start();
          vario.start();
          pg.setPosition(options.startingLocation.position);
          pg.model.rotation.y = 1.2;
          pg.init();
          camera.setCameraMode(CameraMode.FirstPersonView, pg);
          if (FOG_ENABLED) {
            const fogColor = 0x000000;
            const fog = new THREE.FogExp2(fogColor, 0.0002);
            // const fog = new THREE.Fog(fogColor, 1, 15000);
            scene.fog = fog;
          }
        }}
        onFinishGame={() => {
          finishGame();
        }}
        onPause={(paused) => {
          analytics.trackEvent("game-pause");
          if (paused) {
            pg.stop();
            vario.stop();
            bgMusic.stop();
          } else {
            pg.init();
            vario.start();
            bgMusic.start();
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
          pg.updateWrapSpeed(value);
          vario.updateWrapSpeed(value);
        }}
      />
    );
    root.render(uiControls);

    // Game start
    camera.setCameraMode(CameraMode.AirplaneView, pg);

    function touchedGround() {}

    function finishGame() {
      analytics.trackEvent("game-crash", pg.getTrajectory().length.toString());
      vario.stop();
      bgMusic.stop();
      pg.stop();

      const trajectory = new Trajectory(pg.getTrajectory(), 5);
      scene.add(trajectory.getMesh());
      camera.setCameraMode(CameraMode.OrbitControl, pg);

      const trajectoryPoints = trajectory.getPoints();
      const initialPosition = trajectoryPoints[0];
      if (trajectoryPoints.length) {
        camera.animateTo(
          initialPosition.add(
            new THREE.Vector3(0, 30, 0).add(weather.getWindVelocity(-250))
          ),
          pg.position()
        );
      }
    }

    pg.addEventListener("touchedGround", touchedGround);
    pg.addEventListener("crashed", finishGame);

    addWindIndicatorToScene(scene, pg, weather);

    renderer.render(scene, camera); // must render before adding trees
    Environment.addTrees(scene, terrain);
    Environment.addStones(scene, terrain);
    // await Environment.addOtherGliders(scene, weather, terrain, water);

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
      TWEEN.update();
      camera.update();
      renderer.render(scene, camera);
      // setTimeout(animate, 1000);
      requestAnimationFrame(animate);
    };

    animate();
  },
};

export default Game;
