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

class TandemPilot {
  armRight: THREE.Mesh;
  armLeft: THREE.Mesh;
  body: THREE.Mesh;
  head: THREE.Group;
  options: TandemPilotOptions;

  constructor(options: TandemPilotOptions) {
    this.options = options;
  }

  getBody(options: PilotOptions): THREE.Group {
    const group = new THREE.Group();

    const suitMat = getColoredMaterial(options.suitColor || '#333');
    const skinMat = getColoredMaterial(options.skinColor || '#e0bea5');

    const height = 470;
    const width = 350;
    const bodyGeo = new THREE.BoxGeometry(width, height, 400);
    this.body = new THREE.Mesh(bodyGeo, suitMat);
    this.body.position.x = 0;
    this.body.position.y = -390; // push down he head
    this.body.position.z = 0;
    group.add(this.body);

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
    const carabinerMat = getColoredMaterial(options.carabinercolor || '#ff0000');
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

    const groupPilot = new THREE.Group();
    const headPilot = getHead(this.options.pilot.head);
    const bodyPilot = this.getBody(this.options.pilot);
    groupPilot.add(headPilot);
    groupPilot.add(bodyPilot);
    group.add(groupPilot);

    const groupPassenger = new THREE.Group();
    const headPassenger = getHead(this.options.passenger.head);
    const bodyPassenger = this.getBody(this.options.passenger);
    groupPassenger.add(headPassenger);
    groupPassenger.add(bodyPassenger);
    groupPassenger.position.set(0, -380, 400);
    group.add(groupPassenger);
    return group;
  }
}

export default TandemPilot;
