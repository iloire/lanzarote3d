import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera, { CameraMode } from "../components/camera";
import locations from "./locations/lanzarote";
import VideoFrame from "../components/video-frame";


const FlyZones = {
  load: async (camera: Camera, scene: THREE.Scene, renderer) => {
    const videoFrame = new VideoFrame();
    const mesh = await videoFrame.load();
    mesh.scale.set(3000, 2220, 2220);
    scene.add(mesh);

    const navigateTo = (point: THREE.Vector3, lookAt: THREE.Vector3) => {
      camera.animateTo(point, lookAt, 1000, () => {
        mesh.position.copy(point);
        console.log("doe");
      });
    };

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    const buttons = locations.map((location) => (
      <button onClick={() => navigateTo(location.lookFrom, location.lookAt)}>
        {location.title}
      </button>
    ));
    root.render(<div className="points">{buttons}</div>);


    const initial = locations[0];
    navigateTo(initial.lookFrom, initial.lookAt);

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default FlyZones;
