import * as THREE from "three";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import HangGlider from "../components/hangglider";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

const HangGliderWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui } = options;
    
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);
    //

    const hg = new HangGlider();
    const mesh = await hg.load([], gui);

    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(225, -70, 90);
    camera.lookAt(lookAt);
    animate();
  },
};

export default HangGliderWorkshop;
