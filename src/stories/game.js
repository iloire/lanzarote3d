import * as THREE from "three";
import Wind from "../audio/wind.js";
import PG from "../elements/pg";

const sensitivity = 0.01;
const xSpeed = 0.001;
const ySpeed = 0.1;

const Game = {
  load: async (camera, scene, renderer) => {
    const p = {
      scale: 1.2,
      location: { x: 50, y: 16, z: -45 },
      speed: { x: 0.0003, y: 0.0003, z: 0.0001 },
    };
    const pg = await PG.load(p.scale, p.location, p.speed);
    scene.add(pg);

    function moveForward(speed) {
      console.log("forward");
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      camera.position.addScaledVector(dir, speed);
    }

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 87) {
        //w
        moveForward(xSpeed);
      }
    }

    // Wind.load(camera);
    renderer.domElement.addEventListener("mousemove", (event) => {
      console.log(event);
      camera.quaternion.y -= (event.movementX * sensitivity) / 10;
      camera.quaternion.x -= (event.movementY * sensitivity) / 10;
    });
    camera.position.set(10, 3, 2);

    const animate = () => {
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      camera && (camera.position.y += Math.sin(timer) * 0.0003);
      moveForward(xSpeed);
      renderer.render(scene, camera);
    };
    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
