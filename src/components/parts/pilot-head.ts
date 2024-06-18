import * as THREE from "three";

export type PilotHeadOptions = {
  helmetColor?: string;
  helmetColor2?: string;
  helmetColor3?: string;
  skinColor?: string;
  eyeColor?: string;
  glassesColor?: string;
}

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

const getHead = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();

  const skinMat = getColoredMaterial(options.skinColor || '#e0bea5');
  const headGeo = new THREE.BoxGeometry(300, 350, 280);
  const head = new THREE.Mesh(headGeo, skinMat);
  group.add(head);

  //Helmet
  const helmetTopMat = getColoredMaterial(options.helmetColor || '#ff0000');
  const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
  const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 180;
  head.add(helmet);

  const helmetSeparatorMat = getColoredMaterial(options.helmetColor2 || '#666666');
  const helmetSeparatorGeo = new THREE.BoxGeometry(420, 40, 400);
  const helmetSeparator = new THREE.Mesh(helmetSeparatorGeo, helmetSeparatorMat);
  helmetSeparator.position.x = 0;
  helmetSeparator.position.z = 0;
  helmetSeparator.position.y = 100;
  head.add(helmetSeparator);

  const helmetBottomMat = getColoredMaterial(options.helmetColor3 || '#ffffff');
  const helmetBottomGeo = new THREE.BoxGeometry(400, 220, 290);
  const helmetBottom = new THREE.Mesh(helmetBottomGeo, helmetBottomMat);
  helmetBottom.position.x = 0;
  helmetBottom.position.z = -20;
  helmetBottom.position.y = 0;
  head.add(helmetBottom);


  //glasses
  const glassGeo = new THREE.BoxGeometry(120, 78, 10);
  //Retinas Left
  const eyeMat = getColoredMaterial(options.eyeColor || '#ffffff');
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
  const glassesMat = getColoredMaterial(options.glassesColor || '#333');
  const glassMiddleGeo = new THREE.BoxGeometry(40, 10, 10);
  const glassu = new THREE.Mesh(glassMiddleGeo, glassesMat);
  glassu.position.x = 0;
  glassu.position.y = 5;
  glassu.position.z = 155;
  head.add(glassu);

  //Retinas
  const retina = new THREE.BoxGeometry(25, 25, 5);
  //Retinas Left
  const pupilaMat = getColoredMaterial('#333');
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
  const lipMat = getColoredMaterial('#333');
  const lipGeo = new THREE.BoxGeometry(40, 20, 50);
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.x = 0;
  lip.position.z = 162;
  lip.position.y = -120;
  head.add(lip);

  return group;
};


class PilotHead {
  options: PilotHeadOptions;

  constructor(options: PilotHeadOptions) {
    this.options = options;
  }

  load(): THREE.Group {
    return getHead(this.options);
  }
}

export default PilotHead;
