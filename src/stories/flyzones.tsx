import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera, { CameraMode } from "../elements/camera";
import Animations from "../utils/animations";
import Controls from "../utils/controls";
import locations from "./locations/lanzarote";

const initial = new THREE.Vector3(7, 880, 5);

const FlyZones = {
  load: (camera: Camera, scene: THREE.Scene, renderer) => {
    const navigateTo = (point: THREE.Vector3, lookAt: THREE.Vector3) => {
      console.log("navigate to:", point);
      camera.animateTo(point, lookAt, 1000, () => {
        console.log("doe");
      });
    };

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    const buttons = locations.map((location) => (
      <button onClick={() => navigateTo(location.pos, location.lookAt)}>
        {location.title}
      </button>
    ));
    root.render(<div className="points">{buttons}</div>);

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
