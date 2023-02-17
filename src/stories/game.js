import * as THREE from "three";
import Wind from "../audio/wind.js";
import Paraglider from "../elements/pg";
import GUI from "lil-gui";
import Controls from "../utils/controls.js";
import Helpers from "../utils/helpers";
import WindIndicator from "../elements/wind-indicator";

const gui = new GUI();

const settings = {
  sensitivity: 0.01,
  rotationSensitivity: 0.01,
  mouseControl: false,
  orbitControl: false,
  followCam: true,
};

const weather = {
  windDirectionDegreesFromNorth: 310,
  windSpeed: 18,
};

const pgOptions = {
  kg: 80,
  area: 24,
  glidingRatio: 10,
  trimSpeed: 25,
  halfSpeedBarSpeed: 30,
  fullSpeedBarSpeed: 35,
  smallEarsSpeed: 20,
  bigEarsSpeed: 18,
};

const p = {
  scale: 0.0004,
  position: { x: 27, y: 7, z: 5 },
};

const nav = gui.addFolder("Navigation");
nav.add(settings, "mouseControl");
nav.add(settings, "rotationSensitivity", 0, 1);
nav.add(settings, "sensitivity", 0, 1);

const weatherGui = gui.addFolder("Weather");
weatherGui.add(weather, "windDirectionDegreesFromNorth", 0, 360);
weatherGui.add(weather, "windSpeed", 0, 0.01);

const getObjectPosition = (obj) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

const getWindDirectionVector = (degreesFromNorth) => {
  const angleRadiansWind = THREE.MathUtils.degToRad(-degreesFromNorth);
  const directionWind = new THREE.Vector3().setFromSphericalCoords(
    1,
    Math.PI / 2,
    angleRadiansWind
  );
  return directionWind;
};

const moveForward = (pg, weather, pgOptions) => {
  const multipleSpeed = p.scale / 10;
  //
  const rotationPG = pg.quaternion.clone();
  const directionPG = new THREE.Vector3(0, 0, -1);
  directionPG.applyQuaternion(rotationPG);
  const velocity = directionPG.multiplyScalar(
    multipleSpeed * pgOptions.trimSpeed
  );
  const windDirection = getWindDirectionVector(
    weather.windDirectionDegreesFromNorth
  );
  const velocityWind = windDirection.multiplyScalar(
    multipleSpeed * weather.windSpeed
  );
  pg.position.add(velocity);
  pg.position.add(velocityWind);
};

const moveVertical = (pg, weather, pgOptions) => {
  // const lift = getLiftValue(obj, windDirection, windSpeed, terrain);
  // console.log(lift);
  const gravityDirection = new THREE.Vector3(0, -1, 0);
  const gravityVector = gravityDirection.multiplyScalar(
    (p.scale * (pgOptions.trimSpeed - weather.windSpeed)) /
      pgOptions.glidingRatio
  );
  pg.position.add(gravityVector);
  // const liftDirection = new THREE.Vector3(0, 1, 0);
  // const liftVector = liftDirection.multiplyScalar(lift);
  // obj.position.add(liftVector);
};

const getLiftValue = (pg, windDirection, windSpeed, terrain) => {
  const pos = pg.position;
  const rayVertical = new THREE.Raycaster(
    pos,
    new THREE.Vector3(0, -1, 0) // vertical
  );

  const intersectsFloor = rayVertical.intersectObject(terrain);
  if (intersectsFloor.length) {
    const terrainBelowHeight = intersectsFloor[0].point.y;
    return THREE.MathUtils.smoothstep(terrainBelowHeight, 1, 10);
  } else {
    return 0;
  }
};

const Game = {
  load: async (camera, scene, renderer, terrain, water) => {
    const cameraGui = gui.addFolder("Camera");
    cameraGui.add(camera.position, "x", -100, 100).name("x");
    cameraGui.add(camera.position, "y", 0, 100).name("y");
    cameraGui.add(camera.position, "z", -100, 100).name("z");

    cameraGui.add(camera.rotation, "x", -Math.PI, Math.PI).name("rotation.x");
    cameraGui.add(camera.rotation, "y", -Math.PI, Math.PI).name("rotation.y");
    cameraGui.add(camera.rotation, "z", -Math.PI, Math.PI).name("rotation.z");

    cameraGui.add(settings, "followCam");

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const pg = new Paraglider(pgOptions);
    await pg.loadModel(p.scale, p.position);
    pg.addGui(gui);
    scene.add(pg.model);

    const windIndicator = WindIndicator.load(
      weather.windDirectionDegreesFromNorth,
      14,
      {
        x: 0,
        y: 0,
        z: 0,
      }
    );
    scene.add(windIndicator);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 87) {
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
    // Wind.load(camera);
    renderer.domElement.addEventListener("mousemove", (event) => {
      if (settings.mouseControl) {
        camera.quaternion.y -= (event.movementX * settings.sensitivity) / 20;
        camera.quaternion.x -= (event.movementY * settings.sensitivity) / 20;
      }
    });

    const windDirection = getWindDirectionVector(
      weather.windDirectionDegreesFromNorth
    );

    // const raycaster = getLiftValue(pg.position, terrain);
    //
    // scene.add(
    //   new THREE.ArrowHelper(
    //     raycaster.ray.direction,
    //     raycaster.ray.origin,
    //     300,
    //     0xff0000
    //   )
    // );

    // const dir = new THREE.Vector3(0, -1, 0);
    // const arrow2 = new THREE.ArrowHelper(dir, pg.position, 10);
    // scene.add(arrow2);

    const animate = () => {
      // setTimeout(animate, 1200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      // camera.position.y += Math.sin(timer) * 0.0003;

      if (settings.followCam) {
        const cameraOffset = new THREE.Vector3(-0.2, 10.5, -0.2);
        camera.position.copy(getObjectPosition(pg.model)).add(cameraOffset);
        camera.lookAt(pg.position());
      }
      if (controls.enabled) {
        controls.update();
      }
      moveForward(pg.model, weather, pgOptions);
      moveVertical(pg.model, weather, pgOptions);

      renderer.render(scene, camera);
    };

    camera.position.set(-20, 10, 20);
    camera.lookAt(pg.position());

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
