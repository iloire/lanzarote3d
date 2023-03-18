import * as THREE from "three";

const skinMat = new THREE.MeshLambertMaterial({
  color: "#e0bea5",
  // shading: THREE.FlatShading,
});
const helmetMat = new THREE.MeshLambertMaterial({
  color: "#fff",
  // shading: THREE.FlatShading,
});
const eyeMat = new THREE.MeshLambertMaterial({
  color: "white",
  // shading: THREE.FlatShading
});

const pupilaMat = new THREE.MeshLambertMaterial({
  color: "#333",
  // shading: THREE.FlatShading,
});

const suitMat = new THREE.MeshLambertMaterial({
  color: "#333",
  // shading: THREE.FlatShading,
});
const lipMat = new THREE.MeshLambertMaterial({
  color: "#333",
  // shading: THREE.FlatShading,
});

const getHead = (): THREE.Group => {
  const group = new THREE.Group();

  const headGeo = new THREE.BoxGeometry(300, 350, 280);
  const head = new THREE.Mesh(headGeo, skinMat);
  // head.position.x = 0;
  // head.position.y = 160;
  // head.position.z = 400;
  group.add(head);

  //Helmet
  const helmetGeo = new THREE.BoxGeometry(320, 120, 290);
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 180;
  head.add(helmet);

  const hatBottomGeo = new THREE.BoxGeometry(400, 40, 380);
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

const getBody = (): THREE.Group => {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(250, 420, 1400);
  const body = new THREE.Mesh(bodyGeo, suitMat);
  body.position.x = 0;
  body.position.y = -350;
  body.position.z = 200;
  group.add(body);

  //arms
  const armGeo = new THREE.BoxGeometry(50, 390, 60);
  const armLeft = new THREE.Mesh(armGeo, suitMat);
  armLeft.position.x = -190;
  armLeft.position.y = -50;
  armLeft.position.z = 150;

  const armRight = new THREE.Mesh(armGeo, suitMat);
  armRight.position.x = 190;
  armRight.position.y = -50;
  armRight.position.z = 150;

  //hands
  const handGeo = new THREE.BoxGeometry(70, 70, 70);
  const handLeft = new THREE.Mesh(handGeo, skinMat);
  handLeft.position.y = 190;

  const handRight = new THREE.Mesh(handGeo, skinMat);
  handRight.position.y = 190;
  armRight.add(handRight);
  armLeft.add(handLeft);

  const armRotation = 0.3;
  armLeft.rotateZ(armRotation);
  armLeft.rotateX(armRotation);
  armRight.rotateZ(-1 * armRotation);
  armRight.rotateX(armRotation);

  group.add(armLeft);
  group.add(armRight);

  return group;
};

class Pilot {
  load(): THREE.Object3D {
    const group = new THREE.Group();
    group.add(getHead());
    group.add(getBody());
    return group;
  }
}

export default Pilot;
