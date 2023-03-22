import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import Cloud from "../components/cloud";
import Helpers from "../utils/helpers";

const CloudWorkshop = {
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

    const mesh = await new Cloud().load();
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const mesh2 = await new Cloud().load();
    mesh2.scale.set(0.1, 0.1, 0.1);
    mesh2.position.set(0, 0, 150);
    scene.add(mesh2);

    const mesh3 = await new Cloud().load();
    mesh3.scale.set(0.1, 0.1, 0.1);
    mesh3.position.set(0, 0, -50);
    scene.add(mesh3);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(150, 30, 130);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default CloudWorkshop;
