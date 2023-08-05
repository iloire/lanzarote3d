// import * as THREE from "three";
// import Controls from "../utils/controls";
// import Sky from "../components/sky";
// import React from "react";
// import { createRoot } from "react-dom/client";
// import HangGlider from "../components/hangglider";
// import Helpers from "../utils/helpers";
//
// const HangGliderWorkshop = {
//   load: async (
//     camera: THREE.PerspectiveCamera,
//     scene: THREE.Scene,
//     renderer,
//     terrain: THREE.Mesh,
//     water: THREE.Mesh,
//     sky: Sky,
//     gui
//   ) => {
//     terrain.visible = false;
//     water.visible = false;
//
//     Helpers.createHelpers(scene);
//
//     const controls = Controls.createControls(camera, renderer);
//     sky.updateSunPosition(12);
//     //
//
//     const hg = new HangGlider();
//     const mesh = await hg.load(gui);
//     mesh.position.set(0, 0, 0);
//     scene.add(mesh);
//
//     const animate = () => {
//       requestAnimationFrame(animate);
//       renderer.render(scene, camera);
//     };
//
//     const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
//     camera.position.set(225, 129, 0);
//     camera.lookAt(lookAt);
//     controls.target = lookAt;
//     animate();
//   },
// };
//
// export default HangGliderWorkshop;
