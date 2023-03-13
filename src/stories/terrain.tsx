import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import textureImg from "../textures/h-map-lanzarote.png";

const Terrain = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    // water.visible = false;
    terrain.visible = false;

    const controls = Controls.createControls(camera, renderer);
    sky.updateSunPosition(12);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const loader = new THREE.TextureLoader();
    const displacement = loader.load(textureImg);
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);
    const groundMaterial = new THREE.MeshPhongMaterial({
      // wireframe: true,
      color: "red",
      displacementMap: displacement,
      displacementScale: 900,
      // displacementBias: 2,
      map: displacement,
    });

    const mesh = new THREE.Mesh(groundGeometry, groundMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -20, 0);
    scene.add(mesh);
    camera.position.set(4120, 2500, 12000);
    controls.target = mesh.position;
  },
};

export default Terrain;
