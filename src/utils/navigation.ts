import Animations from "./animations";
import * as THREE from "three";

type Callback = () => void | {};

const Navigation = (camera: THREE.PerspectiveCamera, controls) => {
  const nav = {
    default: (t: number = 1600, cb?: Callback) => {
      Animations.animateCamera(
        camera,
        controls,
        new THREE.Vector3(30, 10, 115),
        new THREE.Vector3(50, 0, 0),
        t || 1600,
        cb || (() => {})
      );
    },

    famara: (t: number = 1600, cb?: Callback) => {
      Animations.animateCamera(
        camera,
        controls,
        new THREE.Vector3(-40, 10, -10),
        new THREE.Vector3(50, 0, 0),
        t || 1600,
        cb || (() => {})
      );
    },

    orzola: (t: number = 1600, cb?: Callback) => {
      Animations.animateCamera(
        camera,
        controls,
        new THREE.Vector3(120, 10, -70),
        new THREE.Vector3(20, 0, -30),
        t || 1600,
        cb || (() => {})
      );
    },

    macher: (t: number = 1600, cb?: Callback) => {
      Animations.animateCamera(
        camera,
        controls,
        new THREE.Vector3(-30, 10, 100),
        new THREE.Vector3(-20, 0, 0),
        t || 1600,
        cb || (() => {})
      );
    },

    tenesar: (t: number = 1600, cb?: Callback) => {
      Animations.animateCamera(
        camera,
        controls,
        new THREE.Vector3(-30, 5, -20),
        new THREE.Vector3(-20, 0, 0),
        t || 1600,
        cb || (() => {})
      );
    },
  };

  function moveForward(speed: number) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.addScaledVector(dir, speed);
  }

  function moveBackwards(speed: number) {
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
      (event: any) => {
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
