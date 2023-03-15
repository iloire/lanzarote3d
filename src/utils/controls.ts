import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Controls = {
  createControls: (camera: THREE.PerspectiveCamera, renderer) => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 1.2;
    controls.zoomSpeed = 1.9;

    controls.enableDamping = true;
    controls.enablePan = true;
    // controls.maxPolarAngle = 1.5;
    // controls.minDistance = 200;
    // controls.maxDistance = 220;

    controls.keys = {
      LEFT: "ArrowLeft", //left arrow
      UP: "ArrowUp", // up arrow
      RIGHT: "ArrowRight", // right arrow
      BOTTOM: "ArrowDown", // down arrow
    };

    controls.listenToKeyEvents(window);
    return controls;
  },
};
export default Controls;
