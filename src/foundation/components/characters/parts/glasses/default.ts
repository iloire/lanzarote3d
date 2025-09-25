import * as THREE from "three";
import { PilotHeadOptions } from "../pilot-head";

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

const getDefaultGlasses = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();
  //glasses
  const glassGeo = new THREE.BoxGeometry(120, 78, 10);

  //Retinas Left
  const eyeMat = getColoredMaterial(options.eyeColor || 'white');
  const glassLeft = new THREE.Mesh(glassGeo, eyeMat);
  glassLeft.position.x = -80;
  glassLeft.position.y = 4;
  glassLeft.position.z = 160;

  //Retinas Right
  const glassRight = new THREE.Mesh(glassGeo, eyeMat);
  glassRight.position.x = 80;
  glassRight.position.y = 4;
  glassRight.position.z = 160;
  group.add(glassLeft);
  group.add(glassRight);

  //glass middle
  const glassesMat = getColoredMaterial(options.glassesColor || 'pink');
  const glassMiddleGeo = new THREE.BoxGeometry(40, 10, 10);
  const glassu = new THREE.Mesh(glassMiddleGeo, glassesMat);
  glassu.position.x = 0;
  glassu.position.y = 5;
  glassu.position.z = 155;
  group.add(glassu);

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
  group.add(retinaLeft);
  group.add(retinaRight);

  return group;
}

export default getDefaultGlasses;
