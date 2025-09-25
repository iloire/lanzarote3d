import { Tween, Easing, update } from "@tweenjs/tween.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Animations = {
  animateCamera: (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    time: number = 2000,
    callBack?: () => void,
  ) => {
    console.log('animateCamera called with:', { newPosition, newTarget, time });

    // Store tween for debugging and manual update if needed
    const tween = new Tween({
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
      time,
    );
    tween.onUpdate(function (object) {
      camera.position.x = object.x1;
      camera.position.y = object.y1;
      camera.position.z = object.z1;
      controls.target.x = object.x2;
      controls.target.y = object.y2;
      controls.target.z = object.z2;
      controls.update();

      // Debug occasionally to see if tween is progressing
      if (Math.random() < 0.01) {
        console.log('Tween updating, camera position:', {x: object.x1, y: object.y1, z: object.z1});
      }
    });
    tween.onComplete(function () {
      console.log('Camera tween completed');
      callBack && callBack();
    });
    tween.easing(Easing.Cubic.InOut);
    console.log('Starting tween...');
    tween.start();

    // Store the tween globally so it can be updated from anywhere
    (window as any).activeCameraTween = tween;
  },
};
export default Animations;
