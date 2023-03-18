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
    water.visible = false;
    terrain.visible = false;

    const controls = Controls.createControls(camera, renderer);
    
    sky.updateSunPosition(14);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const loader = new THREE.TextureLoader();

    const displacement = loader.load(textureImg);
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);
    const groundMaterial = new THREE.MeshPhongMaterial({
      wireframe: true,
      color: "red",
      reflectivity: 0.4,
      displacementMap: displacement,
      displacementScale: 623,
      displacementBias: 0.2,
      map: displacement,
    });
    const mesh = new THREE.Mesh(groundGeometry, groundMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -20, 0);
    scene.add(mesh);


    const groundMaterial2 = new THREE.MeshPhongMaterial({
      color: "yellow",
      reflectivity: 0.4,
      displacementMap: displacement,
      displacementScale: 323,
      displacementBias: 0.2,
      map: displacement,
    });
    const mesh2 = new THREE.Mesh(groundGeometry, groundMaterial2);
    mesh2.rotation.x = -Math.PI / 2;
    mesh2.position.set(0, -20, 0);
    scene.add(mesh2);


    const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);
    const waterMaterial = new THREE.MeshPhongMaterial({
      wireframe: false,
      color: "blue",
      // displacementBias: 2,
    });
    const meshWater = new THREE.Mesh(waterGeometry, waterMaterial);
    meshWater.rotation.x = -Math.PI / 2;
    scene.add(meshWater);

    camera.position.set(4120, 2500, 12000);
    controls.target = mesh.position;
  },
};

export default Terrain;
