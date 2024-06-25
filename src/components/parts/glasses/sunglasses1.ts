import * as THREE from "three";
import { PilotHeadOptions } from "../pilot-head";

const getSunGlasses1 = (options: PilotHeadOptions): THREE.Group => {
  const group = new THREE.Group();

  //glasses
  const glassGeo = new THREE.BoxGeometry(150, 105, 10);
  const sunGlassMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const glassLeft = new THREE.Mesh(glassGeo, sunGlassMat);
  glassLeft.position.x = -80;
  glassLeft.position.y = 4;
  glassLeft.position.z = 160;

  const glassRight = new THREE.Mesh(glassGeo, sunGlassMat);
  glassRight.position.x = 80;
  glassRight.position.y = 4;
  glassRight.position.z = 160;
  group.add(glassLeft);
  group.add(glassRight);

  const glassMiddleGeo = new THREE.BoxGeometry(40, 60, 10);
  const glassu = new THREE.Mesh(glassMiddleGeo, sunGlassMat);
  glassu.position.x = 0;
  glassu.position.y = 25;
  glassu.position.z = 155;
  group.add(glassu);

  return group;
}

export default getSunGlasses1;
