import * as THREE from "three";
import Wind from "../audio/wind.js";
import PG from "../elements/pg";
import GUI from "lil-gui";
import Controls from "../utils/controls.js";
import Helpers from "../utils/helpers";
import WindIndicator from "../elements/wind-indicator";

const gui = new GUI();

const settings = {
  sensitivity: 0.01,
  xSpeed: 0.001,
  rotationSensitivity: 0.007,
  mouseControl: false,
  orbitControl: true,
  followCam: false,
  windDirectionDegreesFromNorth: 310,
  windSpeed: 0.0007,
};

const nav = gui.addFolder("Navigation");
nav.add(settings, "mouseControl");
nav.add(settings, "xSpeed", 0, 0.01);
nav.add(settings, "rotationSensitivity", 0, 1);
nav.add(settings, "sensitivity", 0, 1);
nav.add(settings, "windDirectionDegreesFromNorth", 0, 360);
nav.add(settings, "windSpeed", 0, 0.01);

const getObjectPosition = (obj) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

const getWorldDirection = (obj) => {
  const dir = new THREE.Vector3();
  obj.getWorldDirection(dir);
  return dir;
};

const getWorldQuaternion = (obj) => {
  const dir = new THREE.Quaternion();
  obj.getWorldQuaternion(dir);
  return dir;
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

const moveForward = (obj, speed) => {
  const rotationPG = obj.quaternion.clone();
  const directionPG = new THREE.Vector3(0, 1, 0);
  directionPG.applyQuaternion(rotationPG);
  const velocity = directionPG.multiplyScalar(speed);

  const windDirection = getWindDirectionVector(
    settings.windDirectionDegreesFromNorth
  );
  const velocityWind = windDirection.multiplyScalar(settings.windSpeed);

  obj.position.add(velocity);
  obj.position.add(velocityWind);
};

const createArrowHelperForObj = (obj, len, color) => {
  const dir = getWorldDirection(obj);
  const origin = getObjectPosition(obj);
  const arrow = new THREE.ArrowHelper(dir, origin, len, color || 0xffffff);
  arrow.rotateX(-Math.PI / 2);
  return arrow;
};

const getLiftValue = (pg, windDirection, windSpeed, terrain) => {
  const pos = pg.position;
  const rayVertical = new THREE.Raycaster(
    pos,
    new THREE.Vector3(0, -1, 0) // vertical
  );
  // console.log(windSpeed, terrain);

  const intersectsFloor = rayVertical.intersectObject(terrain);
  // console.log(intersectsFloor);
  if (intersectsFloor.length) {
    // console.log("intersects, ", intersectsFloor[0].point.y);
    const terrainBelowHeight = intersectsFloor[0].point.y;
    return THREE.MathUtils.smoothstep(terrainBelowHeight, 1, 10);
  } else {
    return 0;
  }
};

const moveVertical = (obj, windDirection, windSpeed, terrain) => {
  console.log(terrain);
  const lift = getLiftValue(obj, windDirection, windSpeed, terrain);
  console.log(lift);
  const liftDirection = new THREE.Vector3(0, 1, 0);
  const liftVector = liftDirection.multiplyScalar(lift);
  obj.position.add(liftVector);
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

    const p = {
      scale: 0.01,
      position: { x: 27, y: 4, z: 5 },
    };

    const pg = await PG.load(p.scale, p.position);
    scene.add(pg);
    setTimeout(() => {
      //TODO fix this race condition
      pg.position.set(p.position.x, p.position.y, p.position.z);
    }, 1);

    const pgGui = gui.addFolder("Paraglider");
    pgGui.add(pg.rotation, "x", -Math.PI, Math.PI).name("pg.rotation.x");
    pgGui.add(pg.rotation, "y", -Math.PI, Math.PI).name("pg.rotation.y");
    pgGui.add(pg.rotation, "z", -Math.PI, Math.PI).name("pg.rotation.z");

    pgGui.add(pg.position, "x", -100, 100).name("pg.position.x");
    pgGui.add(pg.position, "y", 0, 100).name("pg.position.y");
    pgGui.add(pg.position, "z", -100, 100).name("pg.position.z");

    const windIndicator = WindIndicator.load(
      settings.windDirectionDegreesFromNorth,
      14,
      {
        x: 0,
        y: 0,
        z: 0,
      }
    );
    scene.add(windIndicator);

    const arrow = createArrowHelperForObj(pg);
    scene.add(arrow);

    function rotateLeft() {
      pg.rotation.z += Math.PI * settings.rotationSensitivity;
      arrow.rotation.z += Math.PI * settings.rotationSensitivity;
    }

    function rotateRight() {
      pg.rotation.z -= Math.PI * settings.rotationSensitivity;
      arrow.rotation.z -= Math.PI * settings.rotationSensitivity;
    }

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 87) {
        //w
        // moveForward(xSpeed);
      } else if (keyCode == 65) {
        //a
        rotateLeft();
      } else if (keyCode == 68) {
        //d
        rotateRight();
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
      settings.windDirectionDegreesFromNorth
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
      camera.position.y += Math.sin(timer) * 0.0003;

      if (settings.followCam) {
        const cameraOffset = new THREE.Vector3(-2, 0.5, -2);
        camera.position.copy(getObjectPosition(pg)).add(cameraOffset);
        camera.lookAt(pg.position);
      }
      if (controls.enabled) {
        controls.update();
      }
      const windDirection = getWindDirectionVector(
        settings.windDirectionDegreesFromNorth
      );
      // moveVertical(pg, windDirection, settings.windSpeed, terrain);
      // moveVertical(arrow, windDirection, settings.windSpeed, terrain);
      moveForward(pg, settings.xSpeed);
      moveForward(arrow, settings.xSpeed);

      renderer.render(scene, camera);
    };

    camera.position.set(-10, 50, -23);
    camera.lookAt(pg.position);

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
