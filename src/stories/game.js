import * as THREE from "three";
import Wind from "../audio/wind.js";
import PG from "../elements/pg";
import GUI from "lil-gui";
import Controls from "../utils/controls.js";
import Helpers from "../utils/helpers";

const gui = new GUI();

const settings = {
  sensitivity: 0.01,
  xSpeed: 0.001,
  rotationSensitivity: 0.002,
  mouseControl: false,
  orbitControl: false,
  followCam: false,
};

const nav = gui.addFolder("Navigation");
nav.add(settings, "mouseControl");
nav.add(settings, "xSpeed", 0, 1);
nav.add(settings, "rotationSensitivity", 0, 1);
nav.add(settings, "sensitivity", 0, 1);
nav.add(settings, "followCam");

const getObjectPosition = (obj) => {
  const objectPosition = new THREE.Vector3();
  obj.getWorldPosition(objectPosition);
  return objectPosition;
};

const getWorldDirection = (obj) => {
  const dir = new THREE.Vector3();
  obj.getWorldDirection(dir);
  return dir;
};

const moveForward = (obj, speed) => {
  const dir = getWorldDirection(obj);
  const axis = new THREE.Vector3(1, 0, 0); // rotate around the y-axis
  const angle = -Math.PI / 2; // rotate by 90 degrees

  const rotatedDir = dir.applyAxisAngle(axis, angle);
  obj.position.addScaledVector(rotatedDir, speed);
  return rotatedDir;
};

const createArrowHelperForObj = (obj, len, color) => {
  const dir = getWorldDirection(obj);
  const origin = getObjectPosition(obj);
  const arrow = new THREE.ArrowHelper(dir, origin, len, color || 0xffffff);
  arrow.rotateX(-Math.PI / 2);
  return arrow;
};

const Game = {
  load: async (camera, scene, renderer) => {

    const cameraGui = gui.addFolder("Camera");
    cameraGui.add(camera.position, "x", -100, 100).name("camera.x");
    cameraGui.add(camera.position, "y", 0, 100).name("camera.y");
    cameraGui.add(camera.position, "z", -100, 100).name("camera.z");

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const p = {
      scale: 0.09,
      position: { x: 27, y: 4, z: 5 },
    };

    const pg = await PG.load(p.scale, p.position);
    scene.add(pg);

    const pgGui = gui.addFolder("Paraglider");
    pgGui.add(pg.rotation, "x", -Math.PI, Math.PI).name("pg.rotation.x");
    pgGui.add(pg.rotation, "y", -Math.PI, Math.PI).name("pg.rotation.y");
    pgGui.add(pg.rotation, "z", -Math.PI, Math.PI).name("pg.rotation.z");

    pgGui.add(pg.position, "x", -100, 100).name("pg.position.x");
    pgGui.add(pg.position, "y", 0, 100).name("pg.position.y");
    pgGui.add(pg.position, "z", -100, 100).name("pg.position.z");

    const grid = Helpers.createGrid(pg.position);
    scene.add(grid);

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
        console.log(settings);
        camera.quaternion.y -= (event.movementX * settings.sensitivity) / 20;
        camera.quaternion.x -= (event.movementY * settings.sensitivity) / 20;
      }
    });

    const animate = () => {
      // setTimeout(animate, 200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      camera.position.y += Math.sin(timer) * 0.0003;

      const cameraOffset = new THREE.Vector3(-1, 0.5, 1);
      //   pg.position.addScaledVector(dir, speed);
      const pgDirection = getWorldDirection(pg);
      if (controls.followCam) {
        camera.position.copy(getObjectPosition(pg)).add(cameraOffset);
        camera.lookAt(pg.position);
      }
      controls.update();
      moveForward(pg, settings.xSpeed);
      moveForward(arrow, settings.xSpeed);

      renderer.render(scene, camera);
    };

    camera.position.set(-50, 30, -30);
    camera.lookAt(pg.position);

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
