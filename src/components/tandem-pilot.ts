import * as THREE from "three";
import PilotHead, { PilotHeadOptions } from './parts/pilot-head';
import Pilot, { PilotOptions } from './pilot';

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

export type TandemPilotOptions = {
  pilot: PilotOptions;
  passenger: PilotOptions;
}

const getPilotLegs = (options: PilotOptions, armRotation: number) => {
  const shoesMat = getColoredMaterial(options.shoesColor || '#333');
  const pantsMat = getColoredMaterial(options.suitColor2 || '#666');

  const group = new THREE.Group();

  //legs
  const legGeo = new THREE.BoxGeometry(50, 490, 60);
  const legRight = new THREE.Mesh(legGeo, pantsMat);
  legRight.position.x = -130;
  legRight.position.y = -750;
  legRight.position.z = 150;
  group.add(legRight);

  const legLeft = legRight.clone();
  legLeft.translateX(260);
  group.add(legLeft);

  //feet
  const feetGeo = new THREE.BoxGeometry(70, 70, 160);
  const feetRight = new THREE.Mesh(feetGeo, shoesMat);
  feetRight.position.x = -130;
  feetRight.position.y = -990;
  feetRight.position.z = 180;
  group.add(feetRight);

  const feetLeft = feetRight.clone();
  feetLeft.translateX(260);
  group.add(feetLeft);

  return group;
}

const getPilotArms = (options: PilotOptions, armRotation: number) => {
  const suitMat = getColoredMaterial(options.suitColor || '#333');
  const skinMat = getColoredMaterial(options.skinColor || '#e0bea5');

  const group = new THREE.Group();
  //arms
  const armGeo = new THREE.BoxGeometry(50, 390, 60);
  const armRight = new THREE.Mesh(armGeo, suitMat);
  armRight.position.x = -190;
  armRight.position.y = -50;
  armRight.position.z = 150;

  const armLeft = new THREE.Mesh(armGeo, suitMat);
  armLeft.position.x = 190;
  armLeft.position.y = -50;
  armLeft.position.z = 150;

  //hands
  const handGeo = new THREE.BoxGeometry(70, 70, 70);
  const handLeft = new THREE.Mesh(handGeo, skinMat);
  handLeft.position.y = 190;

  const handRight = new THREE.Mesh(handGeo, skinMat);
  handRight.position.y = 190;
  armRight.add(handRight);
  armLeft.add(handLeft);

  armLeft.rotateZ(armRotation);
  armLeft.rotateX(-1 * armRotation);
  //
  armRight.rotateZ(-1 * armRotation);
  armRight.rotateX(-1 * armRotation);

  group.add(armLeft);
  group.add(armRight);

  return group;
}

class TandemPilot {
  options: TandemPilotOptions;

  constructor(options: TandemPilotOptions) {
    this.options = options;
  }

  getBody(options: PilotOptions, armRotation: number): THREE.Group {
    const group = new THREE.Group();

    const suitMat = getColoredMaterial(options.suitColor || '#333');

    const height = 470;
    const width = 350;
    const bodyGeo = new THREE.BoxGeometry(width, height, 400);
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.x = 0;
    body.position.y = -390; // push down he head
    body.position.z = 0;
    group.add(body);

    // carabiner
    const carabinerGeo = new THREE.BoxGeometry(40, 30, 50);
    const carabinerMat = getColoredMaterial(options.carabinercolor || '#ff0000');
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(90, -180, 275);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set(-90, -180, 275);

    group.add(carabinerLeft);
    group.add(carabinerRight);

    group.add(getPilotArms(options, armRotation));
    group.add(getPilotLegs(options, 0));

    return group;
  }

  load(): THREE.Object3D {
    const group = new THREE.Group();

    const groupPilot = new THREE.Group();
    const headPilot = getHead(this.options.pilot.head);
    const bodyPilot = this.getBody(this.options.pilot, -0.3);
    groupPilot.add(headPilot);
    groupPilot.add(bodyPilot);
    group.add(groupPilot);

    const groupPassenger = new THREE.Group();
    const headPassenger = getHead(this.options.passenger.head);
    const bodyPassenger = this.getBody(this.options.passenger, -2.8);
    groupPassenger.add(headPassenger);
    groupPassenger.add(bodyPassenger);
    groupPassenger.position.set(0, -380, 400);
    group.add(groupPassenger);
    return group;
  }
}

export default TandemPilot;
