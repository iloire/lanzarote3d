import Cloud, { CloudType } from "../elements/cloud";
import * as THREE from "three";

const getRandomType = (): CloudType => {
  return "WHITE";
  const rn = random(1, 3);
  if (rn === 1) {
    return "WHITE";
  } else {
    return "BLACK";
  }
};

const randomNumber = (min: number, max: number) => Math.random() * min + max;

const getRandomSign = (): number => {
  const randomBoolean = Math.random() < 0.5;
  return randomBoolean ? 1 : -1;
};

const getRandomCloud = async () => {
  const cloud = await Cloud.load(getRandomType());
  const boundingBox = new THREE.Box3().setFromObject(cloud);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const rndPosOffset = new THREE.Vector3(
    getRandomSign() * random(0.3 * size.x, 1.2 * size.x),
    getRandomSign() * random(0.1 * size.y, 0.2 * size.y),
    getRandomSign() * random(0.3 * size.z, 2 * size.z)
  );
  cloud.position.copy(rndPosOffset);
  cloud.rotation.x = -Math.PI / 2;
  cloud.rotation.z = (getRandomSign() * Math.PI) / random(11, 20);
  cloud.rotation.y = (getRandomSign() * Math.PI) / random(38, 45);
  const scale = cloud.scale.x * randomNumber(0.6, 1.1);
  cloud.scale.set(scale, scale, scale);
  return cloud;
};

const random = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min)) + min;

const Clouds = {
  load: async (scale: number, pos: THREE.Vector3) => {
    const group = new THREE.Group();
    const nClouds = random(3, 8);
    for (let i = 0; i < nClouds; i++) {
      const cloud = await getRandomCloud();
      group.add(cloud);
      group.position.copy(pos);
    }
    return group;
  },
};

export default Clouds;
