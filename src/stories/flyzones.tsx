import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera, { CameraMode } from "../elements/camera";
import Animations from "../utils/animations";
import Controls from "../utils/controls";

const initial = new THREE.Vector3(7, 880, 5);
const pechos = new THREE.Vector3(6827, 880, -555);
const tenesar = new THREE.Vector3(-5427, 580, -355);
const other = new THREE.Vector3(8727, 1280, -4355);
// position: new THREE.Vector3(7500, 1280, -3700),

const FlyZones = {
  load: (camera: Camera, scene: THREE.Scene, renderer) => {
    const controls = Controls.createControls(camera, renderer);

    const navigateTo = (point: THREE.Vector3) => {
      console.log("navigate to:", point);
      Animations.animateCamera(camera, controls, point, initial, 2000, () => {
        console.log("doe");
      });
      camera.lookAt(point);
    };

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    root.render(
      <div className="points">
        <button onClick={() => navigateTo(pechos)}>Famara/Teguise</button>
        <button onClick={() => navigateTo(tenesar)}>Tenesar</button>
      </div>
    );

    camera.position.copy(initial);

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default FlyZones;
