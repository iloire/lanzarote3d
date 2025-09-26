import * as THREE from 'three';
import { Paraglider } from '../../../foundation/components/vehicles';
import { Boat, Tree, Stone, Island } from '../../../foundation/components/scenery';
import { House, HouseType } from '../../../foundation/components/scenery';
import { PineTree } from '../../../foundation/components/scenery';
import Helpers from '../../../foundation/utils/helpers';
import { PilotHeadType } from '../../../foundation/components/characters';
import { StoryOptions } from '../../shared/types';

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
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(12, 3);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.position.y = -10;
  return mesh;
};

const Workshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

    controls.enabled = true;

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      inletsColor: '#333333',
      numeroCajones: 40,
    };

    const pilotOptions = {
      head: {
        headType: PilotHeadType.Default,
        helmetOptions: {
          color: '#ffffff',
          color2: '#cccccc',
          color3: '#999999',
        },
      },
    };
    const paraglider = new Paraglider({
      glider: gliderOptions,
      pilot: pilotOptions,
    });
    const mesh = await paraglider.load(gui);
    mesh.position.set(-20, 0, 0); // Move paraglider away from houses
    mesh.scale.set(0.01, 0.01, 0.01);
    scene.add(mesh);

    const labels: THREE.Mesh[] = [];

    const boat = new Boat();
    const boatMesh = boat.load(gui);
    boatMesh.position.set(-30, 0, 80);
    scene.add(boatMesh);
    labels.push(createLabel('Boat', new THREE.Vector3(-30, -10, 80)));
    scene.add(labels[labels.length - 1]);

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
    pineTreeMesh.position.set(30, 0, 120);
    scene.add(pineTreeMesh);
    labels.push(createLabel('Pine Tree', new THREE.Vector3(30, -10, 120)));
    scene.add(labels[labels.length - 1]);

    // Add regular tree
    const tree = new Tree();
    const treeMesh = tree.load();
    treeMesh.scale.set(2, 2, 2);
    treeMesh.position.set(60, 0, 120);
    scene.add(treeMesh);
    labels.push(createLabel('Tree', new THREE.Vector3(60, -10, 120)));
    scene.add(labels[labels.length - 1]);

    // Add stones
    const stone1 = new Stone();
    const stone1Mesh = stone1.load();
    stone1Mesh.position.set(100, 0, 30);
    stone1Mesh.scale.set(2, 2, 2);
    scene.add(stone1Mesh);
    labels.push(createLabel('Stone', new THREE.Vector3(100, -10, 30)));
    scene.add(labels[labels.length - 1]);

    // Add another stone with different scale
    const stone2 = new Stone();
    const stone2Mesh = stone2.load();
    stone2Mesh.position.set(130, 0, 60);
    stone2Mesh.scale.set(1.5, 3, 1.5);
    scene.add(stone2Mesh);
    labels.push(createLabel('Tall Stone', new THREE.Vector3(130, -10, 60)));
    scene.add(labels[labels.length - 1]);

    // Add island (async loading)
    const loadingManager = new THREE.LoadingManager();
    const islandMesh = await Island.load(loadingManager);
    islandMesh.position.set(-50, 0, 50);
    islandMesh.scale.set(0.5, 0.5, 0.5);
    scene.add(islandMesh);
    labels.push(createLabel('Island', new THREE.Vector3(-50, -10, 50)));
    scene.add(labels[labels.length - 1]);

    const animate = () => {
      requestAnimationFrame(animate);

      labels.forEach(label => {
        label.quaternion.copy(camera.quaternion);
      });

      renderer.render(scene, camera);
      controls.update();
    };

    const lookAt = new THREE.Vector3(40, 0, 60); // Center point between all spread-out components
    camera.position.set(400, 200, -150); // Much further away to show all scenery
    camera.lookAt(lookAt);
    animate();
  },
};

export default Workshop;
