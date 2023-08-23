import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import textureImg from "../textures/h-map-lanzarote.png";

const terrainGenerator1 = (groundGeo, displacement) => {
  const groundMaterial = new THREE.MeshPhongMaterial({
    wireframe: true,
    color: "red",
    reflectivity: 0.4,
    displacementMap: displacement,
    displacementScale: 623,
    displacementBias: 0.2,
    map: displacement,
  });
  const mesh = new THREE.Mesh(groundGeo, groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -20, 0);
  return mesh;
};

const terrainGenerator2 = (groundGeo, displacement) => {
  const groundMaterial2 = new THREE.MeshPhongMaterial({
    color: "yellow",
    reflectivity: 0.4,
    displacementMap: displacement,
    displacementScale: 323,
    displacementBias: 0.2,
    map: displacement,
  });
  const mesh = new THREE.Mesh(groundGeo, groundMaterial2);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -20, 0);
  return mesh;
};

const waterGenerator = () => {
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);
  const waterMaterial = new THREE.MeshPhongMaterial({
    wireframe: false,
    color: "blue",
    // displacementBias: 2,
  });
  const mesh = new THREE.Mesh(waterGeometry, waterMaterial);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

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

    scene.add(terrainGenerator1(groundGeometry, displacement));
    scene.add(terrainGenerator2(groundGeometry, displacement));

    scene.add(waterGenerator());

    camera.position.set(4120, 2500, 12000);
  },
};

export default Terrain;
