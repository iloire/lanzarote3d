import * as THREE from "three";
import getDefaultGlasses from "./glasses/default";
import getSunGlasses1 from "./glasses/sunglasses1";

export enum PilotHeadType {
  Default, Warrior, Skeleton
}

export enum GlassesType {
  Default, SunGlasses1
}

const DEFAULT_OPTIONS = {
  helmetColor: 'yellow',
  helmetColor2: 'white',
  helmetColor3: '#c2c2c2',
  skinColor: '#e0bea5',
  beardColor: '#cc613d',
  eyeColor: 'white',
  glassesColor: 'pink',
  headType: PilotHeadType.Default,
  glassesType: GlassesType.Default
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
  glassesType?: GlassesType;
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

  const helmet = getDefaultHelmet(options);
  helmet.scale.set(0.006, 0.006, 0.006);
  helmet.translateY(2.2);
  helmet.translateZ(-0.3);
  group.add(helmet)

  const scale = 200;
  group.translateY(-230);
  group.scale.set(scale, scale, scale);
  return group;
}

const getDefaultHelmet = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();
  //Helmet
  const helmetTopMat = getColoredMaterial(options.helmetColor);
  const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
  const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
  helmet.position.x = 0;
  helmet.position.z = 0;
  helmet.position.y = 180;
  group.add(helmet);

  const helmetSeparatorMat = getColoredMaterial(options.helmetColor2);
  const helmetSeparatorGeo = new THREE.BoxGeometry(420, 40, 400);
  const helmetSeparator = new THREE.Mesh(helmetSeparatorGeo, helmetSeparatorMat);
  helmetSeparator.position.x = 0;
  helmetSeparator.position.z = 0;
  helmetSeparator.position.y = 100;
  group.add(helmetSeparator);

  const helmetBottomMat = getColoredMaterial(options.helmetColor3);
  const helmetBottomGeo = new THREE.BoxGeometry(400, 220, 290);
  const helmetBottom = new THREE.Mesh(helmetBottomGeo, helmetBottomMat);
  helmetBottom.position.x = 0;
  helmetBottom.position.z = -20;
  helmetBottom.position.y = 0;
  group.add(helmetBottom);
  return group;
}

const getSkeletonHelmet = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();
  const mainMat = getColoredMaterial(options.helmetColor);
  const accentMat = getColoredMaterial(options.helmetColor2);
  const metalMat = getColoredMaterial(options.helmetColor3);

  // Main helmet shell - made more angular
  const helmetGeo = new THREE.BoxGeometry(400, 200, 390);
  const helmet = new THREE.Mesh(helmetGeo, mainMat);
  helmet.position.set(0, 180, 0);
  
  // Angular face guard
  const faceGuardGeo = new THREE.BoxGeometry(420, 160, 100);
  const faceGuard = new THREE.Mesh(faceGuardGeo, accentMat);
  faceGuard.position.set(0, 120, 150);
  faceGuard.rotation.x = Math.PI * 0.15;

  // Horns
  const hornGeo = new THREE.ConeGeometry(30, 150, 4);
  const leftHorn = new THREE.Mesh(hornGeo, metalMat);
  const rightHorn = new THREE.Mesh(hornGeo, metalMat);
  
  leftHorn.position.set(-150, 250, 50);
  rightHorn.position.set(150, 250, 50);
  leftHorn.rotation.z = -0.4;
  rightHorn.rotation.z = 0.4;

  // Mohawk-style spikes
  const createSpike = (x: number, y: number, z: number) => {
    const spikeGeo = new THREE.ConeGeometry(15, 80, 4);
    const spike = new THREE.Mesh(spikeGeo, accentMat);
    spike.position.set(x, y, z);
    return spike;
  };

  // Add row of spikes along the top
  for (let i = -3; i <= 3; i++) {
    const spike = createSpike(i * 50, 300, -50);
    spike.rotation.x = -Math.PI * 0.15;
    group.add(spike);
  }

  // Decorative side plates
  const sidePlateGeo = new THREE.BoxGeometry(50, 180, 200);
  const leftPlate = new THREE.Mesh(sidePlateGeo, metalMat);
  const rightPlate = new THREE.Mesh(sidePlateGeo, metalMat);
  
  leftPlate.position.set(-225, 150, 0);
  rightPlate.position.set(225, 150, 0);
  
  // Back guard with spikes
  const backGuardGeo = new THREE.BoxGeometry(400, 150, 50);
  const backGuard = new THREE.Mesh(backGuardGeo, accentMat);
  backGuard.position.set(0, 150, -200);

  // Add small decorative spikes on back
  const backSpikes = [];
  for (let i = -2; i <= 2; i++) {
    const spike = createSpike(i * 70, 180, -220);
    spike.rotation.x = Math.PI * 0.5;
    spike.scale.set(0.7, 0.7, 0.7);
    backSpikes.push(spike);
  }

  group.add(helmet);
  group.add(faceGuard);
  group.add(leftHorn);
  group.add(rightHorn);
  group.add(leftPlate);
  group.add(rightPlate);
  group.add(backGuard);
  backSpikes.forEach(spike => group.add(spike));

  return group;
};

const getSkeletonHead = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();
  const boneMaterial = getColoredMaterial('#e8e8e8'); // Off-white color for bones
  const eyeSocketMaterial = getColoredMaterial('#1a1a1a'); // Darker black for depth
  const teethMaterial = getColoredMaterial('#ffffff'); // Pure white for teeth
  const innerSkullMaterial = getColoredMaterial('#d4d4d4'); // Slightly darker for inner parts
  const pupilMaterial = getColoredMaterial('#00ff00'); // Eerie green for pupils
  
  // Skull base
  const skullGeo = new THREE.BoxGeometry(1.5, 1.8, 1.4);
  const skull = new THREE.Mesh(skullGeo, boneMaterial);
  skull.position.set(0, 2, 0);
  
  // Jaw with slightly different color
  const jawGeo = new THREE.BoxGeometry(1.5, 0.4, 1.4);
  const jaw = new THREE.Mesh(jawGeo, innerSkullMaterial);
  jaw.position.set(0, 1.2, 0);
  
  // Eye sockets with depth effect - increased size
  const eyeSocketGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
  const eyeSocketBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
  
  // Left eye socket layers - adjusted position
  const leftEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
  const leftEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, getColoredMaterial('#000000'));
  leftEyeSocket.position.set(-0.35, 2.2, 0.7);
  leftEyeSocketBack.position.set(-0.35, 2.2, 0.6);
  
  // Left floating pupil
  const leftPupilGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const leftPupil = new THREE.Mesh(leftPupilGeo, pupilMaterial);
  leftPupil.position.set(-0.35, 2.2, 0.65);
  
  // Right eye socket layers - adjusted position
  const rightEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
  const rightEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, getColoredMaterial('#000000'));
  rightEyeSocket.position.set(0.35, 2.2, 0.7);
  rightEyeSocketBack.position.set(0.35, 2.2, 0.6);
  
  // Nose hole with depth - increased size
  const noseHoleGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3);
  const noseHoleBack = new THREE.BoxGeometry(0.3, 0.3, 0.2);
  const noseHole = new THREE.Mesh(noseHoleGeo, eyeSocketMaterial);
  const noseHoleInner = new THREE.Mesh(noseHoleBack, getColoredMaterial('#000000'));
  noseHole.position.set(0, 1.9, 0.7);
  noseHoleInner.position.set(0, 1.9, 0.6);
  
  // Teeth (small white boxes) - adjusted position
  const teethGroup = new THREE.Group();
  
  for (let i = 0; i < 4; i++) {
    const toothGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
    const tooth = new THREE.Mesh(toothGeo, teethMaterial);
    tooth.position.set(-0.45 + (i * 0.3), 1.4, 0.7);
    teethGroup.add(tooth);
  }

  // Add all parts to the group
  group.add(skull);
  group.add(jaw);
  group.add(leftEyeSocket);
  group.add(rightEyeSocket);
  group.add(leftEyeSocketBack);
  group.add(rightEyeSocketBack);
  group.add(noseHole);
  group.add(noseHoleInner);
  group.add(teethGroup);

  // Replace the default helmet with our custom one
  const helmet = getSkeletonHelmet(options);
  helmet.scale.set(0.006, 0.006, 0.006);
  helmet.translateY(2.2);
  helmet.translateZ(-0.3);
  group.add(helmet);

  const scale = 200;
  group.translateY(-230);
  group.scale.set(scale, scale, scale);

  return group;
};

const getDefaultHead = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();

  const skinMat = getColoredMaterial(options.skinColor);
  const headGeo = new THREE.BoxGeometry(300, 350, 280);
  const head = new THREE.Mesh(headGeo, skinMat);
  group.add(head);

  group.add(getDefaultHelmet(options));

  if (options.glassesType === GlassesType.SunGlasses1) {
    head.add(getSunGlasses1(options));
  } else {
    head.add(getDefaultGlasses(options));
  }

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
    } else if (this.options.headType === PilotHeadType.Skeleton) {
      return getSkeletonHead(this.options);
    } else {
      return getDefaultHead(this.options);
    }
  }
}

export default PilotHead;
