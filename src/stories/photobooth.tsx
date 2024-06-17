import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera from "../components/camera";
import locations from "./locations/lanzarote";
import Paraglider from "../components/paraglider";

const PhotoBooth = {
  load: async (camera: Camera, scene: THREE.Scene, renderer) => {
    const initialPos = new THREE.Vector3(6827, 880, -555);
    const lookAt = new THREE.Vector3(7827, 880, -1555);
    camera.animateTo(initialPos, lookAt, 0);

    const paraglider = new Paraglider();
    const mesh = await paraglider.load();
    mesh.position.copy(initialPos);
    scene.add(mesh);

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default PhotoBooth;
