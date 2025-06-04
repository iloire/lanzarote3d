import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Animations = {

  animateCamera: (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    duration: number = 2000,
    callBack?: () => void
  ) => {

    // TODO: reafactor, understand Tween API
    const tween = new TWEEN.Tween({
      x1: camera.position.x,
      y1: camera.position.y,
      z1: camera.position.z,
      targetx: controls.target.x,
      targety: controls.target.y,
      targetz: controls.target.z,
    });
    tween.to(
      {
        x1: newPosition.x,
        y1: newPosition.y,
        z1: newPosition.z,
        targetx: newTarget.x,
        targety: newTarget.y,
        targetz: newTarget.z,
      },
      duration
    );

    tween.onUpdate(function (tween) {
      camera.position.x = tween.x1;
      camera.position.y = tween.y1;
      camera.position.z = tween.z1;
      controls.target.x = tween.targetx;
      controls.target.y = tween.targety;
      controls.target.z = tween.targetz;
      controls.update();
    });
    tween.onComplete(function () {
      callBack && callBack();
    });
    tween.easing(TWEEN.Easing.Cubic.InOut);
    tween.start();
  },
};
export default Animations;
