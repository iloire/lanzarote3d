import * as THREE from "three";
import { rndBetween, rndIntBetween } from "../utils/math";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";

const mat_cloud = new THREE.MeshLambertMaterial({ color: 0xffffff });
const mat_cloud2 = new THREE.MeshLambertMaterial({ color: 0x666666 });
const mat_cloud3 = new THREE.MeshLambertMaterial({ color: 0x999999 });

const materials = [mat_cloud, mat_cloud2, mat_cloud3];

const generateCloudPart = (
  radius: number,
  scale: number,
  material: THREE.Material
) => {
  const geo_cloudPart = new THREE.IcosahedronGeometry(radius, 0);
  const cloudPart = new THREE.Mesh(geo_cloudPart, material);
  const scaleX = rndBetween(scale * 0.9, scale * 1.1);
  const scaleY = rndBetween(scale * 0.9, scale * 1.1);
  const scaleZ = rndBetween(scale * 0.9, scale * 1.1);
  cloudPart.scale.set(scaleX, scaleY, scaleZ);
  cloudPart.rotation.z = -0.5;
  cloudPart.rotation.x = -0.2;
  cloudPart.castShadow = true;
  return cloudPart;
};

const generateCloud = async (): Promise<THREE.Object3D> => {
  const radius = 40;
  const r = rndBetween;
  const n = rndIntBetween(3, 8);
  const group = new THREE.Group();

  const material = materials[rndIntBetween(0, materials.length)];

  for (let i = 0; i < n; i++) {
    const scale = r(i * 0.9, i * 1.1);
    const posX = 1.7 * radius * r(-1 * i, i);
    const posY = 0.3 * radius * r(-1 * i, i);
    const posZ = 1.2 * radius * r(-1 * i, i);
    const p = generateCloudPart(radius, scale, material);
    p.position.set(posX, posY, posZ);
    group.add(p);
  }

  return group;
};

const experimental = true;

const tweakSize = (mesh: THREE.Object3D, interval: number) => {
  const min = 0.95,
    max = 1.05;
  const multiplier = rndBetween(min, max);
  const scaleX = mesh.scale.x * multiplier;
  const scaleY = mesh.scale.y * multiplier;
  const scaleZ = mesh.scale.z * multiplier;

  const targetPosition = new THREE.Vector3(scaleX, scaleY, scaleZ);
  new TWEEN.Tween(mesh.scale)
    .to(targetPosition, interval)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
};

const tweakPos = (mesh: THREE.Object3D, interval: number) => {
  const min = 0.95,
    max = 1.05;
  const multiplier = rndBetween(min, max);
  const posX = mesh.position.x * multiplier;
  const posY = mesh.position.y * multiplier;
  const posZ = mesh.position.z * multiplier;

  const targetPosition = new THREE.Vector3(posX, posY, posZ);
  new TWEEN.Tween(mesh.position)
    .to(targetPosition, interval)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
};

class Cloud {
  interval: number;

  async load(): Promise<THREE.Object3D> {
    const mesh = await generateCloud();
    const interval = 3000;
    this.interval = setInterval(() => {
      mesh.children.forEach((m) => {
        tweakSize(m, interval);
        tweakPos(m, interval);
      });
    }, interval);

    const animate = (mesh: THREE.Object3D) => {
      const timer = (Date.now() + Math.random() * 1000) * 0.0001;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 0.1;
      requestAnimationFrame(() => animate(mesh));
    };

    animate(mesh);
    return mesh;
  }
}

export default Cloud;
