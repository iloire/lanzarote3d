import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import Paraglider from "../components/paraglider";

const Workshop = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    terrain.visible = false;
    water.visible = false;

    const controls = Controls.createControls(camera, renderer);
    sky.updateSunPosition(12);
    //
    // const planeGeo = new THREE.PlaneGeometry(100, 100);
    // const material = new THREE.MeshBasicMaterial({
    //   color: 0x666666,
    //   side: THREE.DoubleSide,
    // });
    // const plane = new THREE.Mesh(planeGeo, material);
    // scene.add(plane);

    const paraglider = new Paraglider();
    const mesh = paraglider.load();
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    camera.position.set(66, 32, 41);
    camera.lookAt(mesh.position);
    controls.target = mesh.position;
    animate();
  },
};

export default Workshop;
