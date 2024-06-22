import * as THREE from "three";

export enum PilotHeadType {
  Default, Warrior
}

const DEFAULT_OPTIONS = {
  helmetColor: 'red',
  helmetColor2: 'white',
  helmetColor3: 'red',
  skinColor: '#e0bea5',
  beardColor: '#cc613d',
  eyeColor: 'white',
  glassesColor: 'pink',
  headType: PilotHeadType.Default
}

export type PilotHeadOptions = {
  helmetColor?: string;
  helmetColor2?: string;
  helmetColor3?: string;
  skinColor?: string;
  beardColor?: string;
  eyeColor?: string;
  glassesColor?: string;
  headType?: PilotHeadType;
}

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

const getWarriorHead = (options: PilotHeadOptions): THREE.Group => {
  function addBeard() {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: options.beardColor,
      flatShading: true
    });

    const shape1 = new THREE.Shape();
    const shape2 = new THREE.Shape();

    shape1.moveTo(-0.75, 0);
    shape1.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.15, -1.5);
    shape1.lineTo(-2, -1.5);
    shape1.lineTo(-2, 0);

    shape2.moveTo(-0.75, 0);
    shape2.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.25, -1.25);
    shape2.lineTo(-2, -1.25);
    shape2.lineTo(-2, 0);


    const primarySettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: false
    };

    const secondarySettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: false
    };

    const primaryBeardGeo = new THREE.ExtrudeGeometry(shape1, primarySettings);
    const primaryBeard = new THREE.Mesh(primaryBeardGeo, material);

    const secondaryBeardGeo = new THREE.ExtrudeGeometry(shape2, secondarySettings);
    const secondaryBeardLeft = new THREE.Mesh(secondaryBeardGeo, material);
    const secondaryBeardRight = new THREE.Mesh(secondaryBeardGeo, material);

    //scene.add(primaryBeard);
    group.add(secondaryBeardLeft);
    group.add(secondaryBeardRight);

    primaryBeard.castShadow = true;
    secondaryBeardLeft.castShadow = true;
    secondaryBeardRight.castShadow = true;

    primaryBeard.position.set(0.5, 1.5, 1.65)
    secondaryBeardLeft.position.set(1.1, 1.4, 1.3)
    secondaryBeardRight.position.set(-0.18, 1.4, 1.55)

    primaryBeard.rotation.y = -Math.PI / 2;
    secondaryBeardLeft.rotation.y = -Math.PI / 2 + 0.25;
    secondaryBeardRight.rotation.y = -Math.PI / 2 - 0.25;
    return group;
  }

  function addMustache() {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: 0xcc613d,
      flatShading: true
    });

    const mustacheGeo = new THREE.BoxGeometry(0.6, 0.2, 0.25);
    const mustacheLeft = new THREE.Mesh(mustacheGeo, material);
    const mustacheRight = new THREE.Mesh(mustacheGeo, material);

    group.add(mustacheLeft);
    group.add(mustacheRight)

    mustacheLeft.position.set(-0.25, 1.55, 0.7);
    mustacheRight.position.set(0.25, 1.55, 0.7);

    mustacheLeft.rotation.z = Math.PI / 8;
    mustacheRight.rotation.z = -Math.PI / 8;
    return group;
  }

  const group = new THREE.Group();
  const skinMat = getColoredMaterial(options.skinColor);
  const headGeo = new THREE.BoxGeometry(1.5, 1.5, 1.2);
  const head = new THREE.Mesh(headGeo, skinMat);

  const browGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
  const brow = new THREE.Mesh(browGeo, skinMat);

  const noseGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
  const nose = new THREE.Mesh(noseGeo, skinMat);

  group.add(head);
  group.add(brow);
  group.add(nose);
  group.add(addBeard());
  group.add(addMustache());

  head.castShadow = true;
  head.receiveShadow = true;
  brow.castShadow = true;
  nose.castShadow = true;

  head.position.set(0, 2, 0);
  brow.position.set(0, 2.43, 0.46);
  nose.position.set(0, 2.05, 0.54);

  brow.rotation.x = 130;

  //Helmet
  const helmetTopMat = getColoredMaterial(options.helmetColor);
  const helmetGeo = new THREE.BoxGeometry(2, 0.90, 1.90);
  const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 3.10;
  group.add(helmet);

  const scale = 200;
  group.translateY(-230);
  group.scale.set(scale, scale, scale);
  return group;
}

const getDefaultHead = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();

  const skinMat = getColoredMaterial(options.skinColor);
  const headGeo = new THREE.BoxGeometry(300, 350, 280);
  const head = new THREE.Mesh(headGeo, skinMat);
  group.add(head);

  //Helmet
  const helmetTopMat = getColoredMaterial(options.helmetColor);
  const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
  const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 180;
  head.add(helmet);

  const helmetSeparatorMat = getColoredMaterial(options.helmetColor2);
  const helmetSeparatorGeo = new THREE.BoxGeometry(420, 40, 400);
  const helmetSeparator = new THREE.Mesh(helmetSeparatorGeo, helmetSeparatorMat);
  helmetSeparator.position.x = 0;
  helmetSeparator.position.z = 0;
  helmetSeparator.position.y = 100;
  head.add(helmetSeparator);

  const helmetBottomMat = getColoredMaterial(options.helmetColor3);
  const helmetBottomGeo = new THREE.BoxGeometry(400, 220, 290);
  const helmetBottom = new THREE.Mesh(helmetBottomGeo, helmetBottomMat);
  helmetBottom.position.x = 0;
  helmetBottom.position.z = -20;
  helmetBottom.position.y = 0;
  head.add(helmetBottom);


  //glasses
  const glassGeo = new THREE.BoxGeometry(120, 78, 10);

  //Retinas Left
  const eyeMat = getColoredMaterial(options.eyeColor);
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
  const glassesMat = getColoredMaterial(options.glassesColor);
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
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }

  load(): THREE.Group {
    if (this.options.headType === PilotHeadType.Warrior) {
      return getWarriorHead(this.options);
    } else {
      return getDefaultHead(this.options);

    }
  }
}

export default PilotHead;
