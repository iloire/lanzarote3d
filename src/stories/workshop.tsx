import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Paraglider from "../components/paraglider";
import Boat from "../components/boat";
import House, { HouseType } from "../components/house";
import PineTree from "../components/pinetree";
import Helpers from "../utils/helpers";

const createLabel = (text: string, position: THREE.Vector3) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 32px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false
  });
  const geometry = new THREE.PlaneGeometry(12, 3);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = -10;
  return mesh;
};

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

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
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

    const labels: THREE.Mesh[] = [];

    const houseSmall = new House(HouseType.Small);
    const houseSmallMesh = houseSmall.load(gui);
    houseSmallMesh.position.set(0, 0, 0);
    scene.add(houseSmallMesh);
    labels.push(createLabel('Small House', new THREE.Vector3(0, -10, 0)));
    scene.add(labels[labels.length - 1]);

    const houseMedium = new House(HouseType.Medium);
    const houseMediumMesh = houseMedium.load(gui);
    houseMediumMesh.position.set(0, 0, 30);
    scene.add(houseMediumMesh);
    labels.push(createLabel('Medium House', new THREE.Vector3(0, -10, 30)));
    scene.add(labels[labels.length - 1]);

    const houseLarge = new House(HouseType.Large);
    const houseLargeMesh = houseLarge.load(gui);
    houseLargeMesh.position.set(0, 0, 60);
    scene.add(houseLargeMesh);
    labels.push(createLabel('Large House', new THREE.Vector3(0, -10, 60)));
    scene.add(labels[labels.length - 1]);

    const houseModern = new House(HouseType.Modern);
    const houseModernMesh = houseModern.load(gui);
    houseModernMesh.position.set(0, 0, 90);
    scene.add(houseModernMesh);
    labels.push(createLabel('Modern House', new THREE.Vector3(0, -10, 90)));
    scene.add(labels[labels.length - 1]);

    const pineTree = new PineTree();
    const pineTreeMesh = pineTree.load();
    pineTreeMesh.scale.set(3, 3, 3);
    pineTreeMesh.position.set(20, 0, 30);
    scene.add(pineTreeMesh);

    const animate = () => {
      requestAnimationFrame(animate);
      
      labels.forEach(label => {
        label.quaternion.copy(camera.quaternion);
      });
      
      renderer.render(scene, camera);
    };

    const lookAt = new THREE.Vector3(0, 0, 45);  // Center point between all houses
    camera.position.set(200, 100, -100);  // Further away and better angle
    camera.lookAt(lookAt);
    controls.target = lookAt;
    animate();
  },
};

export default Workshop;
