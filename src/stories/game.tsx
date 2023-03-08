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
import UIControls, { View } from "../elements/ui-controls";
import Thermal from "../elements/thermal";
import Clouds from "../elements/clouds";
import Trajectory from "../elements/trajectory";
import Analytics from "../elements/analytics";
import Stats from "three/examples/jsm/libs/stats.module";
import { GameStartOptions } from "../stories/game/types";
import Environment from "./game/env";
import locations from "./locations/lanzarote";

const KMH_TO_MS = 3.6;

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

const p = {
  scale: 0.004,
};

const analytics = new Analytics();

const Game = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    gui
  ) => {
    gui.hide();

    const weather = new Weather(WEATHER_SETTINGS);
    weather.addGui(gui);

    const bgMusic = new BackgroundSound();

    const thermals = Environment.addThermals(scene, weather);

    const pg = new Paraglider(pgOptions, weather, terrain, water, thermals);
    const vario = new Vario(pg);
    const mesh = await pg.loadModel(p.scale);
    pg.addGui(gui);
    scene.add(mesh);

    Environment.addClouds(scene, weather, thermals);

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
        onViewUIChange={(direction: number) => {
          camera.lookDirection(-1 * direction);
          camera.lookDirection(-1 * direction);
        }}
        onGameStart={(options: GameStartOptions, fnHideStartButton) => {
          analytics.trackEvent("game-start");
          weather.changeWindSpeed(options.windSpeedMetresPerSecond);
          weather.changeWindDirection(options.windDirectionDegreesFromNorth);
          fnHideStartButton();
          bgMusic.start();
          vario.start();
          pg.setPosition(options.startingLocation.position);
          pg.init();
          camera.setCameraMode(CameraMode.FirstPersonView, pg);
          const fogColor = 0x000000;
          // const fog = new THREE.FogExp2(fogColor, 0.0002);
          const fog = new THREE.Fog(fogColor, 1, 15000);
          scene.fog = fog;
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
          analytics.trackEvent("game-camera-change", mode);
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

    function touchedGround() {
      analytics.trackEvent("game-crash", pg.getTrajectory().length.toString());
      vario.stop();
      bgMusic.stop();
      pg.stop();
      const trajectory = new Trajectory(pg.getTrajectory(), 5);
      scene.add(trajectory.getMesh());
      camera.setCameraMode(CameraMode.OrbitControl, pg);
      const initialPosition = trajectory.getPoints()[0];
      camera.animateTo(
        initialPosition.add(
          new THREE.Vector3(0, 30, 0).add(weather.getWindVelocity(-250))
        ),
        pg.position()
      );
    }

    pg.addEventListener("touchedGround", touchedGround);

    const animate = () => {
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
      stats.update();
    };

    animate();
  },
};

export default Game;

const stats = Stats();
document.getElementById("stats").appendChild(stats.dom);
