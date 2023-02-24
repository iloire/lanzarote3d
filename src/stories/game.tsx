import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import BackgroundSound from "../audio/background";
import Paraglider, { ParagliderConstructor } from "../elements/pg";
import Controls from "../utils/controls";
import Helpers from "../utils/helpers";
import Vario from "../audio/vario";
import Weather from "../elements/weather";
import Camera, { CameraMode } from "../elements/camera";
import UIControls from "../elements/ui-controls";
import Thermal from "../elements/thermal";

const KMH_TO_MS = 3.6;

function round(number: number): number {
  return Math.round(number * 100) / 100;
}

const settings = {
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

const Game = {
  load: async (camera: Camera, scene, renderer, terrain, water, gui) => {
    gui.hide();

    const nav = gui.addFolder("Navigation");
    nav.add(settings, "mouseControl").listen();
    nav.add(settings, "rotationSensitivity", 0.01, 0.05).listen();
    nav.add(settings, "wrapSpeed", 1, 10).listen();

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const weather = new Weather(
      WEATHER_SETTINGS.windDirectionDegreesFromNorth,
      WEATHER_SETTINGS.windSpeed
    );
    weather.addGui(gui);

    const bgMusic = new BackgroundSound();

    const speedBarUI = document.getElementById("paraglider-speedBar");

    const thermal = new Thermal();
    const thermalPos = new THREE.Vector3(5827, 880, -855);
    const mesh = await thermal.loadModel(p.position);
    scene.add(mesh);

    const pg = new Paraglider(pgOptions, weather, terrain, [thermal]);
    await pg.loadModel(p.scale, p.position);
    pg.addEventListener("position", function (event) {
      speedBarUI.innerText =
        "Speedbar (S key): " + pg.isOnSpeedBar().toString();
    });
    pg.addGui(gui);
    scene.add(pg.model);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      const keyCode = event.which;
      if (keyCode == 32) {
        // space
        pg.jump(terrain);
      } else if (keyCode == 67) {
        //c
        if (gui._hidden) {
          gui.show();
        } else {
          gui.hide();
        }
      } else if (keyCode == 77) {
        //m
        bgMusic.toggle();
      } else if (keyCode == 83) {
        //s
        pg.toggleSpeedBar();
      }
    }
    const altitudeUI = document.getElementById("vario-altitude");
    const deltaUI = document.getElementById("vario-delta");
    const groundSpeedUI = document.getElementById("vario-ground-speed");
    const vario = new Vario(pg);
    vario.addEventListener("delta", function (event) {
      deltaUI.innerText = "Altitude Δ: " + round(event.delta) + " m/s";
    });
    vario.addEventListener("altitude", function (event) {
      altitudeUI.innerText = "Altitude: " + Math.round(event.altitude) + " m.";
    });
    vario.addEventListener("altitude", function (event) {
      groundSpeedUI.innerText =
        "Speed: " + round(KMH_TO_MS * pg.getGroundSpeed()) + " km/h";
    });
    vario.start();

    const weatherDirectionUi = document.getElementById("weather-direction");
    const weatherSpeedUi = document.getElementById("weather-speed");
    weather.addEventListener("wind-speedChange", function (event) {
      console.log(event);
      weatherSpeedUi.innerText =
        "wind speed: " + round(event.value * KMH_TO_MS) + " km/h";
    });
    weather.addEventListener("wind-directionChange", function (event) {
      weatherDirectionUi.innerText =
        "wind direction: " + Math.round(event.value) + " degrees";
    });
    let isLeftTurning;
    let isRightTurning;

    // Game start
    camera.firstPersonView(pg);
    renderer.render(scene, camera);

    const rootElement = document.getElementById("ui-controls");
    const root = createRoot(rootElement);
    const uiControls = (
      <UIControls
        onLeftBreak={() => {
          isLeftTurning = true;
        }}
        onLeftBreakRelease={() => {
          isLeftTurning = false;
        }}
        onRightBreak={() => {
          isRightTurning = true;
        }}
        onRightBreakRelease={() => {
          isRightTurning = false;
        }}
        onGameStart={(fnHideStartButton) => {
          animate();
          console.log("Number of Triangles :", renderer.info.render.triangles);
          bgMusic.start();
          fnHideStartButton();
        }}
        onSelectCamera={(cam: number) => {
          if (cam === 1) {
            camera.setCameraMode(CameraMode.FollowTarget, pg);
          } else if (cam === 2) {
            camera.setCameraMode(CameraMode.FirstPersonView, pg);
          } else if (cam === 3) {
            camera.setCameraMode(CameraMode.FarAway, pg);
          } else if (cam === 4) {
            camera.setCameraMode(CameraMode.TopView, pg);
          }
          renderer.render(scene, camera);
        }}
      />
    );
    root.render(uiControls);

    const animate = () => {
      // setTimeout(animate, 2200);
      if (isLeftTurning) {
        pg.rotateLeft(settings.rotationSensitivity);
      }
      if (isRightTurning) {
        pg.rotateRight(settings.rotationSensitivity);
      }
      requestAnimationFrame(animate);
      camera.update();
      vario.updateReading(pg.altitude());
      renderer.render(scene, camera);
    };
  },
};

export default Game;
