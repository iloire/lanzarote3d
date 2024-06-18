import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Paraglider from "../components/paraglider";
import Boat from "../components/boat";
import House, { HouseType } from "../components/house";
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

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      breakColor: '#ffffff',
      lineFrontColor: '#ffffff',
      lineBackColor: '#ffffff',
      inletsColor: '#333333',
      numeroCajones: 40
    };

    const pilotOptions = { head: {} };
    const paraglider = new Paraglider({ glider: gliderOptions, pilot: pilotOptions });
    const mesh = await paraglider.load(gui);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(0.01, 0.01, 0.01);
    scene.add(mesh);

    const boat = new Boat();
    const boatMesh = boat.load(gui);
    boatMesh.position.set(20, 0, 30);
    scene.add(boatMesh);

    const houseSmall = new House(HouseType.Small);
    const houseSmallMesh = houseSmall.load(gui);
    houseSmallMesh.position.set(-40, 0, 60);
    scene.add(houseSmallMesh);

    const house = new House(HouseType.Medium);
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
    camera.position.set(132, 80, 11);
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default Workshop;
