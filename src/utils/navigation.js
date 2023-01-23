import Animations from "./animations";
import * as THREE from "three";

const Navigation = (camera, controls) => {
  const nav = {
    default: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 10, z: -115 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    famara: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -40, y: 10, z: -10 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    orzola: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 120, y: 10, z: -70 },
        { x: 20, y: 0, z: -30 },
        t || 1600,
        cb || (() => {})
      );
    },

    macher: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 10, z: 100 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    tenesar: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -30, y: 5, z: -20 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },
  };

  function moveForward(speed) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.addScaledVector(dir, speed);
  }

  function moveBackwards(speed) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.addScaledVector(dir, -1 * speed);
  }

  // rotation won't work with OrbitControls enabled
  function rotateLeft() {
    camera.rotation.y -= Math.PI / 8;
  }

  function rotateRight() {
    camera.rotation.y += Math.PI / 8;
  }

  const xSpeed = 0.1;
  const ySpeed = 0.1;
  document.addEventListener("keydown", onDocumentKeyDown, false);

  function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
      //w
      moveForward(xSpeed);
    } else if (keyCode == 83) {
      //s
      moveBackwards(xSpeed);
    } else if (keyCode == 65) {
      //a
      rotateLeft();
    } else if (keyCode == 68) {
      //d
      rotateRight();
    } else if (keyCode == 32) {
      //space
      nav.default();
    }
    controls.update();
  }

  document.querySelectorAll(".point").forEach((item) => {
    item.addEventListener(
      "click",
      (event) => {
        let className =
          event.target.classList[event.target.classList.length - 1];
        switch (className) {
          case "label-0": // famara
            nav.famara();
            break;
          case "label-1": // mirador Orzola
            nav.orzola();
            break;
          case "label-2": // macher
            nav.macher();
            break;
          case "label-3": // Tenesar
            nav.tenesar();
            break;
          default:
            break;
        }
      },
      false
    );
  });

  return nav;
};

export default Navigation;
