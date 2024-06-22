import * as THREE from "three";
import PilotHead, { PilotHeadOptions } from './parts/pilot-head';
import CocoonHarness from "./parts/cocoon-harness";

const DEFAULT_OPTIONS = {
  head: {},
  skinColor: '#e0bea5',
  suitColor: '#333',
  suitColor2: '#666',
  shoesColor: 'red',
  carabinerColor: 'silver'
}

export type PilotOptions = {
  head?: PilotHeadOptions;
  skinColor?: string;
  suitColor?: string;
  suitColor2?: string;
  shoesColor?: string;
  carabinerColor?: string;
};

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};


const getHead = (options: PilotHeadOptions): THREE.Group => {
  const pilotHead = new PilotHead(options);
  return pilotHead.load();
};

const BREAK_Y_MOVE = 50; //cm

class Pilot {
  armRight: THREE.Mesh;
  armLeft: THREE.Mesh;
  body: THREE.Mesh;
  head: THREE.Group;
  options: PilotOptions;

  constructor(options: PilotOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }

  showHead() {
    this.head.visible = true;
  }

  hideHead() {
    this.head.visible = false;
  }

  getBody(): THREE.Group {
    const group = new THREE.Group();

    const harness = new CocoonHarness({
      color1: '#333',
      color2: '#666',
      carabinerColor: this.options.carabinerColor,
      carabinerSeparationMM: 300
    });

    const suitMat = getColoredMaterial(this.options.suitColor);
    const skinMat = getColoredMaterial(this.options.skinColor);

    group.add(harness.load());

    //arms
    const armGeo = new THREE.BoxGeometry(50, 390, 60);
    this.armRight = new THREE.Mesh(armGeo, suitMat);
    this.armRight.position.x = -190;
    this.armRight.position.y = -50;
    this.armRight.position.z = 150;

    this.armLeft = new THREE.Mesh(armGeo, suitMat);
    this.armLeft.position.x = 190;
    this.armLeft.position.y = -50;
    this.armLeft.position.z = 150;

    //hands
    const handGeo = new THREE.BoxGeometry(70, 70, 70);
    const handLeft = new THREE.Mesh(handGeo, skinMat);
    handLeft.position.y = 190;

    const handRight = new THREE.Mesh(handGeo, skinMat);
    handRight.position.y = 190;
    this.armRight.add(handRight);
    this.armLeft.add(handLeft);

    const armRotation = -0.3;
    this.armLeft.rotateZ(armRotation);
    this.armLeft.rotateX(-1 * armRotation);
    //
    this.armRight.rotateZ(-1 * armRotation);
    this.armRight.rotateX(-1 * armRotation);

    group.add(this.armLeft);
    group.add(this.armRight);

    return group;
  }

  load(): THREE.Object3D {
    const group = new THREE.Group();
    this.head = getHead(this.options.head);
    group.add(this.head);
    group.add(this.getBody());
    return group;
  }

  speedBar() {
    this.body.scale.z = 1.2;
    this.body.position.z += 40;
    this.body.scale.x = 0.9;
  }

  releaseSpeedBar() {
    this.body.scale.z = 1;
    this.body.position.z -= 40;

    this.body.scale.x = 1;
  }

  breakLeft() {
    this.armLeft.position.y = -1 * BREAK_Y_MOVE;
  }

  breakRight() {
    this.armRight.position.y = -1 * BREAK_Y_MOVE;
  }

  handsUp() {
    this.armLeft.position.y = 0;
    this.armRight.position.y = 0;
  }
}

export default Pilot;
