import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Animations = {
  animateCamera: (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    time: number = 2000,
    callBack?: () => void
  ) => {
    const tween = new TWEEN.Tween({
      x1: camera.position.x,
      y1: camera.position.y,
      z1: camera.position.z,
      x2: controls.target.x,
      y2: controls.target.y,
      z2: controls.target.z,
    });
    tween.to(
      {
        x1: newPosition.x,
        y1: newPosition.y,
        z1: newPosition.z,
        x2: newTarget.x,
        y2: newTarget.y,
        z2: newTarget.z,
      },
      time
    );
    tween.onUpdate(function(object) {
      camera.position.x = object.x1;
      camera.position.y = object.y1;
      camera.position.z = object.z1;
      controls.target.x = object.x2;
      controls.target.y = object.y2;
      controls.target.z = object.z2;
      controls.update();
    });
    tween.onComplete(function() {
      controls.enabled = true;
      callBack && callBack();
    });
    tween.easing(TWEEN.Easing.Cubic.InOut);
    tween.start();
  },
};
export default Animations;
