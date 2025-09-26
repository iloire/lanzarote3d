// import Animations from './animations'; // TODO: Missing animations module
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type Callback = () => void | {};

const Navigation = (camera: THREE.PerspectiveCamera, controls: OrbitControls) => {
  const nav = {
    default: (_t: number = 1600, cb?: Callback) => {
      // TODO: Restore when Animations module is available
      console.warn('Navigation.default: Animations module not available');
      if (cb) cb();
    },

    famara: (_t: number = 1600, cb?: Callback) => {
      // TODO: Restore when Animations module is available
      console.warn('Navigation.famara: Animations module not available');
      if (cb) cb();
    },

    orzola: (_t: number = 1600, cb?: Callback) => {
      // TODO: Restore when Animations module is available
      console.warn('Navigation.orzola: Animations module not available');
      if (cb) cb();
    },

    macher: (_t: number = 1600, cb?: Callback) => {
      // TODO: Restore when Animations module is available
      console.warn('Navigation.macher: Animations module not available');
      if (cb) cb();
    },

    tenesar: (_t: number = 1600, cb?: Callback) => {
      // TODO: Restore when Animations module is available
      console.warn('Navigation.tenesar: Animations module not available');
      if (cb) cb();
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

  // Store reference to listener for cleanup
  const keydownListener = onDocumentKeyDown;
  document.addEventListener('keydown', keydownListener, false);

  // Return cleanup function
  const cleanup = () => {
    document.removeEventListener('keydown', keydownListener);
  };

  function onDocumentKeyDown(event: KeyboardEvent) {
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

  // Store point click listeners for cleanup
  const pointClickListeners = new Map<Element, EventListener>();

  document.querySelectorAll('.point').forEach(item => {
    const clickListener = (event: Event) => {
      const target = event.target as Element;
      let className = target.classList[target.classList.length - 1];
      switch (className) {
        case 'label-0': // famara
          nav.famara();
          break;
        case 'label-1': // mirador Orzola
          nav.orzola();
          break;
        case 'label-2': // macher
          nav.macher();
          break;
        case 'label-3': // Tenesar
          nav.tenesar();
          break;
        default:
          break;
      }
    };

    item.addEventListener('click', clickListener, false);
    pointClickListeners.set(item, clickListener);
  });

  // Enhanced navigation object with cleanup
  const navWithCleanup = {
    ...nav,
    dispose: () => {
      cleanup();
      pointClickListeners.forEach((listener, element) => {
        element.removeEventListener('click', listener);
      });
      pointClickListeners.clear();
    },
  };

  return navWithCleanup;
};

export default Navigation;
