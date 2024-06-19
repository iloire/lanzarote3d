import * as THREE from "three";
import PilotHead, { PilotHeadOptions } from './parts/pilot-head';

export type PilotOptions = {
  head: {
    helmetColor?: string;
    helmetColor2?: string;
    helmetColor3?: string;
    skinColor?: string;
    eyeColor?: string;
  },
  skinColor?: string;
  suitColor?: string;
  suitColor2?: string;
  shoesColor?: string;
  carabinercolor?: string;
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
    this.options = options;
  }

  showHead() {
    this.head.visible = true;
  }

  hideHead() {
    this.head.visible = false;
  }

  getBody(): THREE.Group {
    const group = new THREE.Group();

    const suitMat = getColoredMaterial(this.options.suitColor || '#333');
    const skinMat = getColoredMaterial(this.options.skinColor || '#e0bea5');

    const bodyGeo = new THREE.BoxGeometry(250, 420, 1200);
    this.body = new THREE.Mesh(bodyGeo, suitMat);
    this.body.position.x = 0;
    this.body.position.y = -390;
    this.body.position.z = 200;
    group.add(this.body);

    const subBodyMat = getColoredMaterial(this.options.suitColor || '#666');
    const subBodyGeo = new THREE.BoxGeometry(150, 420, 400);
    const subBody = new THREE.Mesh(subBodyGeo, subBodyMat);
    subBody.position.x = 0;
    subBody.position.y = -385;
    subBody.position.z = 400;
    group.add(subBody);

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

    // carabiner
    const carabinerGeo = new THREE.BoxGeometry(40, 30, 50);
    const carabinerMat = getColoredMaterial(this.options.carabinercolor || '#ff0000');
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(90, -180, 275);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set(-90, -180, 275);

    group.add(this.armLeft);
    group.add(this.armRight);

    group.add(carabinerLeft);
    group.add(carabinerRight);

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
