import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import Paraglider from "../components/paraglider";
import Helpers from "../utils/helpers";

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

    Helpers.createHelpers(scene);

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
    const mesh = paraglider.load(gui);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    paraglider.breakLeft();
    paraglider.breakRight();

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    camera.position.set(66, 32, 41);
    camera.lookAt(mesh.position);
    // controls.target = mesh.position.clone().add(new THREE.Vector3(0, 12, 0));
    animate();
  },
};

export default Workshop;