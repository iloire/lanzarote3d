import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import React from "react";
import { createRoot } from "react-dom/client";
import Paraglider from "../components/paraglider";
import Boat from "../components/boat";
import House from "../components/house";
import PineTree from "../components/pinetree";
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
    const mesh = await paraglider.load(gui);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const boat = new Boat();
    const boatMesh = boat.load(gui);
    boatMesh.position.set(20, 0, 30);
    scene.add(boatMesh);

    const house = new House();
    const houseMesh = house.load(gui);
    houseMesh.position.set(40, 0, 30);
    scene.add(houseMesh);

    const pineTree = new PineTree();
    const pineTreeMesh = pineTree.load();
    pineTreeMesh.scale.set(3, 3, 3);
    pineTreeMesh.position.set(20, 0, 30);
    scene.add(pineTreeMesh);

    paraglider.breakLeft();
    // paraglider.breakRight();

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = mesh.position.clone().add(new THREE.Vector3(0, 0, 0));
    camera.position.set(20, 192, 121);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default Workshop;
