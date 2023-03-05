import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera, { CameraMode } from "../elements/camera";
import Animations from "../utils/animations";
import Controls from "../utils/controls";

const initial = new THREE.Vector3(7, 880, 5);

const pechos = new THREE.Vector3(4207, 880, -755);
const pechosLookAt = new THREE.Vector3(6827, 880, -6555);

const tenesar = new THREE.Vector3(-6527, 580, -4555);
const tenesarLookAt = new THREE.Vector3(-5127, 580, -255);

const FlyZones = {
  load: (camera: Camera, scene: THREE.Scene, renderer) => {
    const navigateTo = (point: THREE.Vector3, lookAt: THREE.Vector3) => {
      console.log("navigate to:", point);
      camera.animateTo(point, lookAt, 2000, () => {
        console.log("doe");
      });
    };

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    root.render(
      <div className="points">
        <button onClick={() => navigateTo(pechos, pechosLookAt)}>Famara</button>
        <button onClick={() => navigateTo(tenesar, tenesarLookAt)}>
          Tenesar
        </button>
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
