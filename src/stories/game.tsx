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
import UIControls, { View } from "../elements/ui-controls";
import Thermal from "../elements/thermal";
import Clouds from "../elements/clouds";

const KMH_TO_MS = 3.6;

function round(number: number): number {
  return Math.round(number * 100) / 100;
}

const settings = {
  rotationSensitivity: 0.002,
  mouseControl: false,
  orbitControl: true,
  wrapSpeed: 1,
};

const WEATHER_SETTINGS = {
  windDirectionDegreesFromNorth: 310,
  windSpeed: 18 / KMH_TO_MS,
  lclLevel: 1500,
};

const pgOptions: ParagliderConstructor = {
  glidingRatio: 9,
  trimSpeed: 25 / KMH_TO_MS,
  halfSpeedBarSpeed: 30 / KMH_TO_MS,
  fullSpeedBarSpeed: 35 / KMH_TO_MS,
  smallEarsSpeed: 20 / KMH_TO_MS,
  bigEarsSpeed: 18 / KMH_TO_MS,
};

const p = {
  scale: 0.004,
  // position: new THREE.Vector3(6827, 880, -555),
  position: new THREE.Vector3(8727, 1280, -4355),
};

const Game = {
  load: async (camera: Camera, scene, renderer, terrain, water, gui) => {
    gui.hide();

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const weather = new Weather(
      WEATHER_SETTINGS.windDirectionDegreesFromNorth,
      WEATHER_SETTINGS.windSpeed,
      WEATHER_SETTINGS.lclLevel
    );
    weather.addGui(gui);

    const bgMusic = new BackgroundSound();

    const thermalPos = new THREE.Vector3(
      5727,
      WEATHER_SETTINGS.lclLevel / 2,
      -535
    );
    const thermalPos2 = new THREE.Vector3(
      7127,
      WEATHER_SETTINGS.lclLevel / 2,
      -1405
    );
    const thermalPos3 = new THREE.Vector3(
      3027,
      WEATHER_SETTINGS.lclLevel / 2,
      1005
    );
    const thermal = new Thermal(
      thermalPos,
      WEATHER_SETTINGS.lclLevel * 1.2,
      weather,
      1.5
    );
    const thermal2 = new Thermal(
      thermalPos2,
      WEATHER_SETTINGS.lclLevel * 1.1,
      weather,
      2
    );
    const thermal3 = new Thermal(
      thermalPos3,
      WEATHER_SETTINGS.lclLevel * 1.3,
      weather,
      2
    );
    scene.add(thermal.mesh);
    scene.add(thermal2.mesh);
    scene.add(thermal3.mesh);

    const pg = new Paraglider(pgOptions, weather, terrain, water, [
      thermal,
      thermal2,
      thermal3,
    ]);
    const vario = new Vario(pg);
    await pg.loadModel(p.scale, p.position);

    pg.addGui(gui);
    scene.add(pg.model);

    const c = await Clouds.load(
      1,
      new THREE.Vector3(
        thermalPos.x,
        WEATHER_SETTINGS.lclLevel * 1.2,
        thermalPos.z
      )
    );
    scene.add(c);
    const c2 = await Clouds.load(
      1,
      new THREE.Vector3(
        thermalPos2.x,
        WEATHER_SETTINGS.lclLevel * 1.1,
        thermalPos2.z
      )
    );
    scene.add(c2);
    const c3 = await Clouds.load(
      1,
      new THREE.Vector3(
        thermalPos3.x,
        WEATHER_SETTINGS.lclLevel * 1.3,
        thermalPos3.z
      )
    );
    scene.add(c3);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      const keyCode = event.which;
      if (keyCode == 32) {
        // space
        // pg.jump(terrain);
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

    const nav = gui.addFolder("Navigation");
    nav.add(settings, "mouseControl").listen();
    nav.add(settings, "rotationSensitivity", 0.01, 0.05).listen();
    nav
      .add(settings, "wrapSpeed", 1, 20)
      .listen()
      .onChange((value) => {
        pg.updateWrapSpeed(value);
        vario.updateWrapSpeed(value);
      });

    const weatherDirectionUi = document.getElementById("weather-direction");
    const weatherSpeedUi = document.getElementById("weather-speed");
    const weatherLCLUi = document.getElementById("weather-lclLevel");
    weather.addEventListener("wind-speedChange", function (event) {
      weatherSpeedUi.innerText =
        "wind speed: " + round(event.value * KMH_TO_MS) + " km/h";
    });
    weather.addEventListener("wind-directionChange", function (event) {
      weatherDirectionUi.innerText =
        "wind direction: " + Math.round(event.value) + " degrees";
    });
    weather.addEventListener("lclChange", function (event) {
      weatherLCLUi.innerText = "lcl: " + Math.round(event.value) + "m";
    });

    let isLeftTurning = false;
    let isRightTurning = false;
    let isLeftViewing = false;
    let isRightViewing = false;

    const rootElement = document.getElementById("ui-controls");
    const root = createRoot(rootElement);
    const uiControls = (
      <UIControls
        pg={pg}
        vario={vario}
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
        onGameStart={(options, fnHideStartButton) => {
          weather.changeWindSpeed(options.windSpeedMetresPerSecond);
          bgMusic.start();
          fnHideStartButton();
          vario.start();
          pg.init();
          // varioUI.style.display = "block";
        }}
        onSelectCamera={(mode: CameraMode) => {
          camera.setCameraMode(mode, pg, controls);
        }}
        onViewChange={(view: View) => {
          if (view === View.Left) {
            isLeftViewing = true;
          } else if (view === View.LeftRelease) {
            isLeftViewing = false;
          } else if (view === View.Right) {
            isRightViewing = true;
          } else if (view === View.RightRelease) {
            isRightViewing = false;
          }
        }}
        onWrapSpeedChange={(value) => {
          pg.updateWrapSpeed(value);
          vario.updateWrapSpeed(value);
        }}
      />
    );
    root.render(uiControls);

    // Game start
    camera.setCameraMode(CameraMode.FollowTarget, pg, controls);

    pg.addEventListener("touchedGround", () => {
      console.log("game over");
      vario.stop();
      bgMusic.stop();
      pg.stop();
    });

    const animate = () => {
      camera.update();
      controls.target = pg.position();
      vario.updateReading(pg.altitude());
      renderer.render(scene, camera);

      if (isLeftTurning) {
        pg.rotateLeft(settings.rotationSensitivity);
      }
      if (isRightTurning) {
        pg.rotateRight(settings.rotationSensitivity);
      }
      if (isLeftViewing) {
        camera.turnLeft();
      }
      if (isRightViewing) {
        camera.turnRight();
      }
      requestAnimationFrame(animate);
      // setTimeout(animate, 2200);
    };
    animate();
  },
};

export default Game;
