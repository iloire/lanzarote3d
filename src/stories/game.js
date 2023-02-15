import * as THREE from "three";
import Wind from "../audio/wind.js";
import PG from "../elements/pg";

const sensitivity = 0.01;
const xSpeed = 0.001;
const rotationSensitivity = 0.002;

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

  console.log("dir", dir);
  const rotatedDir = dir.applyAxisAngle(axis, angle);
  console.log("rotated", rotatedDir);
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
    const p = {
      scale: 0.09,
      location: { x: 1, y: 3, z: 2 },
    };
    const pg = await PG.load(p.scale, p.location);
    const arrow = createArrowHelperForObj(pg);
    scene.add(arrow);
    scene.add(pg);

    function rotateLeft() {
      pg.rotation.z += Math.PI * rotationSensitivity;
      arrow.rotation.z += Math.PI * rotationSensitivity;
    }

    function rotateRight() {
      pg.rotation.z -= Math.PI * rotationSensitivity;
      arrow.rotation.z -= Math.PI * rotationSensitivity;
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
      camera.quaternion.y -= (event.movementX * sensitivity) / 20;
      camera.quaternion.x -= (event.movementY * sensitivity) / 20;
    });

    const animate = () => {
      // setTimeout(animate, 200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      camera.position.y += Math.sin(timer) * 0.0003;

      const cameraOffset = new THREE.Vector3(-1, 0.5, 1);
      //   pg.position.addScaledVector(dir, speed);
      const pgDirection = getWorldDirection(pg);
      camera.position.copy(getObjectPosition(pg)).add(cameraOffset);

      renderer.render(scene, camera);
      // console.log(pgDirection);
      moveForward(pg, xSpeed);
      moveForward(arrow, xSpeed);
    };
    camera.lookAt(scene.position);

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
