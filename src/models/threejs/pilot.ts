import * as THREE from "three";

const getColoredMaterial = (color: number) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

const skinMat = getColoredMaterial(0xe0bea5);
const eyeMat = getColoredMaterial(0xffffff);
const pupilaMat = getColoredMaterial(0x333);
const subBodyMat = getColoredMaterial(0x666);
const lipMat = getColoredMaterial(0x333);
const carabinerMat = getColoredMaterial(0xff0000);
const suitMat = getColoredMaterial(0x333);

const getHead = (options: PilotOptions): THREE.Group => {
  const group = new THREE.Group();

  const headGeo = new THREE.BoxGeometry(300, 350, 280);
  const head = new THREE.Mesh(headGeo, skinMat);
  group.add(head);

  //Helmet
  const helmetMat = getColoredMaterial(options.helmetColor);
  const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 180;
  head.add(helmet);

  const helmet2Geo = new THREE.BoxGeometry(400, 220, 290);
  const helmet2 = new THREE.Mesh(helmet2Geo, helmetMat);
  helmet2.position.x = 0;
  helmet2.position.z = -20;
  helmet2.position.y = 0;
  head.add(helmet2);

  const hatBottomGeo = new THREE.BoxGeometry(420, 40, 400);
  const hatBottom = new THREE.Mesh(hatBottomGeo, suitMat);
  hatBottom.position.x = 0;
  hatBottom.position.z = 0;
  hatBottom.position.y = 100;
  head.add(hatBottom);

  //glasses
  const glassGeo = new THREE.BoxGeometry(120, 78, 10);
  //Retinas Left
  const glassLeft = new THREE.Mesh(glassGeo, eyeMat);
  glassLeft.position.x = -80;
  glassLeft.position.y = 4;
  glassLeft.position.z = 160;
  //Retinas Right
  const glassRight = new THREE.Mesh(glassGeo, eyeMat);
  glassRight.position.x = 80;
  glassRight.position.y = 4;
  glassRight.position.z = 160;
  head.add(glassLeft);
  head.add(glassRight);

  //glass middle
  var glassMiddleGeo = new THREE.BoxGeometry(40, 10, 10);
  const glassu = new THREE.Mesh(glassMiddleGeo, suitMat);
  glassu.position.x = 0;
  glassu.position.y = 5;
  glassu.position.z = 155;
  head.add(glassu);

  //Retinas
  const retina = new THREE.BoxGeometry(25, 25, 5);
  //Retinas Left
  const retinaLeft = new THREE.Mesh(retina, pupilaMat);
  retinaLeft.position.x = -80;
  retinaLeft.position.y = 5;
  retinaLeft.position.z = 168;
  //Retinas Right
  const retinaRight = new THREE.Mesh(retina, pupilaMat);
  retinaRight.position.x = 80;
  retinaRight.position.y = 5;
  retinaRight.position.z = 168;
  head.add(retinaLeft);
  head.add(retinaRight);

  //mouth
  const mouthGeo = new THREE.BoxGeometry(90, 60, 50);
  const mouth = new THREE.Mesh(mouthGeo, skinMat);
  mouth.position.x = 0;
  mouth.position.z = 155;
  mouth.position.y = -130;
  head.add(mouth);

  //lip
  const lipGeo = new THREE.BoxGeometry(40, 20, 50);
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.x = 0;
  lip.position.z = 162;
  lip.position.y = -120;
  head.add(lip);

  return group;
};

const BREAK_Y_MOVE = 90;

type PilotOptions = {
  helmetColor?: number;
};

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

    const bodyGeo = new THREE.BoxGeometry(250, 420, 1400);
    this.body = new THREE.Mesh(bodyGeo, suitMat);
    this.body.position.x = 0;
    this.body.position.y = -390;
    this.body.position.z = 200;
    group.add(this.body);

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
    this.head = getHead(this.options);
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
