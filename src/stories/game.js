import * as THREE from "three";
import Wind from "../audio/wind";
import Paraglider from "../elements/pg";
import Controls from "../utils/controls";
import Helpers from "../utils/helpers";
import WindIndicator from "../elements/wind-indicator";
import MathUtils from "../utils/math";
import Vario from "../audio/vario";

const settings = {
  sensitivity: 0.01,
  rotationSensitivity: 0.01,
  mouseControl: false,
  orbitControl: true,
  wrapSpeed: 1,
};

const weather = {
  windDirectionDegreesFromNorth: 310,
  windSpeed: 18,
};

const pgOptions = {
  glidingRatio: 10,
  trimSpeed: 25,
  halfSpeedBarSpeed: 30,
  fullSpeedBarSpeed: 35,
  smallEarsSpeed: 20,
  bigEarsSpeed: 18,
};

const p = {
  scale: 0.004,
  position: { x: 6127, y: 980, z: 5 },
};

const getObjectPosition = (obj) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

const moveForward = (pg, weather, pgOptions) => {
  const pgMesh = pg.model;
  const multipleSpeed = p.scale * settings.wrapSpeed;
  //
  const rotationPG = pgMesh.quaternion.clone();
  const directionPG = new THREE.Vector3(0, 0, -1);
  directionPG.applyQuaternion(rotationPG);
  const velocity = directionPG.multiplyScalar(
    multipleSpeed * pgOptions.trimSpeed
  );
  const windDirection = MathUtils.getWindDirectionVector(
    weather.windDirectionDegreesFromNorth
  );
  const velocityWind = windDirection.multiplyScalar(
    multipleSpeed * weather.windSpeed
  );
  pgMesh.position.add(velocity);
  pgMesh.position.add(velocityWind);
};

const moveVertical = (pg, weather, pgOptions, terrain) => {
  const pgMesh = pg.model;
  const multipleSpeed = p.scale * settings.wrapSpeed;
  const windDirection = MathUtils.getWindDirectionVector(
    weather.windDirectionDegreesFromNorth
  );
  const lift = pg.getLiftValue(terrain, weather);
  const gravityDirection = new THREE.Vector3(0, -1, 0);
  const gravityVector = gravityDirection.multiplyScalar(
    (multipleSpeed * (pgOptions.trimSpeed - weather.windSpeed)) /
      pgOptions.glidingRatio
  );
  pgMesh.position.add(gravityVector);

  const liftDirection = new THREE.Vector3(0, 1, 0);
  const liftVector = liftDirection.multiplyScalar(multipleSpeed * lift);
  pgMesh.position.add(liftVector);
};

const Game = {
  load: async (camera, scene, renderer, terrain, water, gui) => {
    console.log("============ LOAD GAME ====================== ");
    const nav = gui.addFolder("Navigation");
    nav.add(settings, "mouseControl").listen();
    nav.add(settings, "rotationSensitivity", 0, 1).listen();
    nav.add(settings, "sensitivity", 0, 1).listen();
    nav.add(settings, "wrapSpeed", 1, 10).listen();

    const weatherGui = gui.addFolder("Weather");
    weatherGui.add(weather, "windDirectionDegreesFromNorth", 0, 360).listen();
    weatherGui.add(weather, "windSpeed", 0, 60).listen();

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const pg = new Paraglider(pgOptions);
    await pg.loadModel(p.scale, p.position);
    pg.addGui(gui);
    scene.add(pg.model);

    const windIndicator = new WindIndicator();
    windIndicator.load(weather.windDirectionDegreesFromNorth, 14, {
      x: 0,
      y: 0,
      z: 0,
    });
    scene.add(windIndicator.arrow);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 32) {
        //space
        pg.jump(terrain);
      }
      //w
      else if (keyCode == 87) {
        //w
        // moveForward(xSpeed);
      } else if (keyCode == 65) {
        //a
        pg.rotateLeft(settings.rotationSensitivity);
      } else if (keyCode == 68) {
        //d
        pg.rotateRight(settings.rotationSensitivity);
      }
    }
    Wind.load(camera);
    renderer.domElement.addEventListener("mousemove", (event) => {
      if (settings.mouseControl) {
        camera.quaternion.y -= (event.movementX * settings.sensitivity) / 20;
        camera.quaternion.x -= (event.movementY * settings.sensitivity) / 20;
      }
    });

    const vario = new Vario();
    vario.start();

    const animate = () => {
      // setTimeout(animate, 2200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      // camera.position.y += Math.sin(timer) * 0.0003;
      controls.target = pg.position();
      controls.update();
      if (!pg.hasTouchedGround(terrain)) {
        moveForward(pg, weather, pgOptions);
        moveVertical(pg, weather, pgOptions, terrain);
        vario.updateReading(pg.altitude());
      }
      windIndicator.update(weather.windDirectionDegreesFromNorth);
      renderer.render(scene, camera);
    };

    const cameraOffset = new THREE.Vector3(-91.2, 30, 91.2);
    camera.position.copy(getObjectPosition(pg.model)).add(cameraOffset);
    camera.lookAt(pg.position());

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
