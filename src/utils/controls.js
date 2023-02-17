import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
const Controls = {
  createControls: (camera, renderer) => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.panSpeed = 0.4;
    controls.rotateSpeed = 0.2;
    controls.zoomSpeed = 0.4;

    controls.enableDamping = true;
    controls.enablePan = true;
    controls.maxPolarAngle = 1.5;
    controls.minDistance = 0.2;
    controls.maxDistance = 220;

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
