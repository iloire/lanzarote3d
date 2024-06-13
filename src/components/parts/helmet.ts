import * as THREE from "three";

const createHalfSphere = (
  radius: number,
  widthSegments: number,
  heightSegments: number,
  phiStart: number,
  phiLength: number,
): THREE.Mesh => {
  const geometry = new THREE.CapsuleGeometry(
    radius,
    widthSegments,
    heightSegments,
    phiStart,
  );
  geometry.scale(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Adjust material as needed
  const halfSphere = new THREE.Mesh(geometry, material);
  return halfSphere;
};

const getColoredMaterial = (color: number) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};
const suitMat = getColoredMaterial(0x333);

const createRoundHelmet = (options) => {
  const helmetGroup = new THREE.Group();
  const helmetMat = getColoredMaterial(options.helmetColor || 0xffffff);

  // const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
  // const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  // helmet.position.x = 0;
  // helmet.position.z = 0;
  // helmet.position.y = 180;
  // helmetGroup.add(helmet);

  // const helmet2Geo = new THREE.BoxGeometry(400, 220, 290);
  // const helmet2 = new THREE.Mesh(helmet2Geo, helmetMat);
  // helmet2.position.x = 0;
  // helmet2.position.z = -20;
  // helmet2.position.y = 0;
  // helmetGroup.add(helmet2);
  //
  // const hatBottomGeo = new THREE.BoxGeometry(420, 40, 400);
  // const hatBottom = new THREE.Mesh(hatBottomGeo, suitMat);
  // hatBottom.position.x = 0;
  // hatBottom.position.z = 0;
  // hatBottom.position.y = 100;
  // helmetGroup.add(hatBottom);

  helmetGroup.add(createHalfSphere(300, 332, 16, 39, 20));

  return helmetGroup;
};

export default createRoundHelmet;
